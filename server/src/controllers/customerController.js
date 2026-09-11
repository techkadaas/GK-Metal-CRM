import { store } from '../store/memoryStore.js';

export const getAllCustomers = (req, res) => {
  try {
    const customers = store.getCustomers();
    const invoices = store.getInvoices();
    const { search } = req.query;

    let result = customers.map(cust => {
      // Recalculate real-time customer invoice aggregates
      const custInvoices = invoices.filter(inv => inv.customer === cust._id || inv.buyerSnapshot?.companyName?.toLowerCase() === cust.companyName?.toLowerCase());
      const totalInvoices = custInvoices.length;
      const totalBilled = custInvoices.reduce((sum, inv) => sum + (inv.status !== 'Cancelled' ? (inv.grandTotal || 0) : 0), 0);
      const totalPaid = custInvoices.reduce((sum, inv) => sum + (inv.status !== 'Cancelled' ? (inv.paidAmount || 0) : 0), 0);
      const outstandingBalance = custInvoices.reduce((sum, inv) => sum + (inv.status !== 'Cancelled' ? (inv.balanceDue || 0) : 0), 0);
      const latestInvoice = custInvoices.sort((a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate))[0];

      return {
        ...cust,
        stats: {
          totalInvoices,
          totalBilled,
          totalPaid,
          outstandingBalance,
          lastInvoiceDate: latestInvoice?.invoiceDate || cust.stats?.lastInvoiceDate
        }
      };
    });

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.customerId?.toLowerCase().includes(q) ||
        c.companyName?.toLowerCase().includes(q) ||
        c.gstin?.toLowerCase().includes(q) ||
        c.contactPerson?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q)
      );
    }

    res.json({ success: true, count: result.length, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCustomerById = (req, res) => {
  try {
    const customer = store.getCustomerById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    const invoices = store.getInvoices().filter(inv => inv.customer === customer._id || inv.buyerSnapshot?.companyName?.toLowerCase() === customer.companyName?.toLowerCase());
    res.json({ success: true, data: { ...customer, invoices } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCustomer = (req, res) => {
  try {
    const payload = req.body;
    if (!payload.companyName) {
      return res.status(400).json({ success: false, message: 'Company Name is required' });
    }
    const newCustomer = store.createCustomer(payload);
    res.status(201).json({ success: true, data: newCustomer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCustomer = (req, res) => {
  try {
    const updated = store.updateCustomer(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCustomer = (req, res) => {
  try {
    const success = store.deleteCustomer(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
