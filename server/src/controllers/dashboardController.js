import { store } from '../store/memoryStore.js';

export const getDashboardMetrics = async (req, res) => {
  try {
    const invoices = store.getInvoices();
    const customers = store.getCustomers();

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let totalBilled = 0;
    let paidAmount = 0;
    let pendingPayments = 0;
    let thisMonthBilled = 0;
    let draftCount = 0;
    let cancelledCount = 0;
    let paidCount = 0;
    let pendingCount = 0;

    const monthlyRevenue = {};

    invoices.forEach(inv => {
      const invDate = new Date(inv.invoiceDate || inv.createdAt);
      const isThisMonth = invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;

      if (inv.status === 'Cancelled') {
        cancelledCount++;
        return;
      }

      if (inv.status === 'Draft') {
        draftCount++;
        return;
      }

      totalBilled += inv.grandTotal || 0;
      paidAmount += inv.paidAmount || 0;
      pendingPayments += inv.balanceDue || 0;

      if (isThisMonth) {
        thisMonthBilled += inv.grandTotal || 0;
      }

      if (inv.status === 'Paid') paidCount++;
      if (inv.status === 'Pending Payment' || inv.status === 'Generated' || inv.status === 'Sent' || inv.status === 'Partially Paid') {
        pendingCount++;
      }

      // Group monthly revenue
      const monthKey = invDate.toLocaleString('default', { month: 'short' }) + ' ' + invDate.getFullYear().toString().slice(-2);
      monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + (inv.grandTotal || 0);
    });

    const recentInvoices = invoices.slice(0, 7);

    res.json({
      success: true,
      data: {
        kpis: {
          totalInvoices: invoices.length,
          thisMonthBilled,
          pendingPayments,
          paidAmount,
          draftInvoices: draftCount,
          cancelledInvoices: cancelledCount,
          paidInvoices: paidCount,
          pendingInvoices: pendingCount,
          totalCustomers: customers.length
        },
        monthlyRevenue,
        recentInvoices
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
