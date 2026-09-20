import { store } from '../store/memoryStore.js';

// Helper to convert numbers to Indian Rupee Words
export function convertNumberToIndianWords(num) {
  if (num === null || num === undefined || isNaN(num)) return 'Zero Rupees Only';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = Math.round(Number(num));
  if (n === 0) return 'INR Zero Rupees Only';

  function convertSection(number) {
    if (number === 0) return '';
    if (number < 20) return a[number];
    const tens = b[Math.floor(number / 10)];
    const units = a[number % 10];
    return tens + (units ? ' ' + units : '');
  }

  let str = '';
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const hundred = Math.floor((n % 1000) / 100);
  const rest = n % 100;

  if (crore > 0) str += convertSection(crore).trim() + ' Crore ';
  if (lakh > 0) str += convertSection(lakh).trim() + ' Lakh ';
  if (thousand > 0) str += convertSection(thousand).trim() + ' Thousand ';
  if (hundred > 0) str += convertSection(hundred).trim() + ' Hundred ';
  if (rest > 0) {
    if (str !== '') str += 'and ';
    str += convertSection(rest).trim();
  }

  return `INR ${str.replace(/\s+/g, ' ').trim()} Rupees Only`;
}

// Get Next Invoice Number
export const getNextInvoiceNumber = (req, res) => {
  try {
    const settings = store.getSettings();
    const prefix = settings?.invoiceConfig?.prefix || 'GK/INV/';
    const fy = settings?.invoiceConfig?.financialYear || '26-27';
    const currentSeq = settings?.invoiceConfig?.currentSequence || 4;
    const nextSeq = currentSeq + 1;
    const formattedSeq = String(nextSeq).padStart(3, '0');
    const nextInvoiceNumber = `${prefix}${fy}/${formattedSeq}`;

    res.json({
      success: true,
      data: {
        nextInvoiceNumber,
        invoiceNumber: nextInvoiceNumber,
        sequenceNumber: nextSeq,
        financialYear: fy,
        prefix
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get All Invoices with Filtering & Sorting
export const getAllInvoices = (req, res) => {
  try {
    let invoices = [...store.getInvoices()];
    const { status, search, buyer, sortBy, sortOrder = 'desc', startDate, endDate } = req.query;

    if (status && status !== 'All') {
      invoices = invoices.filter(inv => inv.status.toLowerCase() === status.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      invoices = invoices.filter(inv =>
        inv.invoiceNumber?.toLowerCase().includes(q) ||
        inv.buyerSnapshot?.companyName?.toLowerCase().includes(q) ||
        inv.buyerSnapshot?.gstin?.toLowerCase().includes(q) ||
        inv.metadata?.buyerOrderNo?.toLowerCase().includes(q) ||
        inv.metadata?.testReportRef?.toLowerCase().includes(q)
      );
    }

    if (buyer) {
      invoices = invoices.filter(inv => inv.buyerSnapshot?.companyName?.toLowerCase().includes(buyer.toLowerCase()));
    }

    if (startDate) {
      invoices = invoices.filter(inv => new Date(inv.invoiceDate) >= new Date(startDate));
    }
    if (endDate) {
      invoices = invoices.filter(inv => new Date(inv.invoiceDate) <= new Date(endDate));
    }

    // Sorting
    invoices.sort((a, b) => {
      if (sortBy === 'amount') {
        return sortOrder === 'asc' ? a.grandTotal - b.grandTotal : b.grandTotal - a.grandTotal;
      }
      if (sortBy === 'invoiceNumber') {
        return sortOrder === 'asc'
          ? a.invoiceNumber.localeCompare(b.invoiceNumber)
          : b.invoiceNumber.localeCompare(a.invoiceNumber);
      }
      // Default: date / newest first
      const dateA = new Date(a.invoiceDate || a.createdAt);
      const dateB = new Date(b.invoiceDate || b.createdAt);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    res.json({
      success: true,
      count: invoices.length,
      data: invoices
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Single Invoice by ID
export const getInvoiceById = (req, res) => {
  try {
    const invoice = store.getInvoiceById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create Invoice
export const createInvoice = async (req, res) => {
  try {
    const payload = req.body;
    const settings = store.getSettings();

    // Auto calculate if missing or recalculate for guaranteed integrity
    const items = (payload.items || []).map((item, idx) => ({
      slNo: idx + 1,
      serviceId: item.serviceId || '',
      description: item.description || '',
      testedDate: item.testedDate || item.testedOn || '',
      dayType: item.dayType || item.day || item.visitType || '',
      visitType: item.visitType || item.dayType || item.day || '',
      testingSite: item.testingSite || '',
      sampleDetails: item.sampleDetails || '',
      notes: item.notes || '',
      hsnSac: item.hsnSac || '998346',
      quantity: Number(item.quantity) || 1,
      rate: Number(item.rate) || 0,
      per: item.per || 'No.',
      discountPercent: Number(item.discountPercent) || 0,
      taxableAmount: (Number(item.quantity) || 1) * (Number(item.rate) || 0) * (1 - (Number(item.discountPercent) || 0) / 100)
    }));

    const subtotal = items.reduce((acc, it) => acc + (it.quantity * it.rate), 0);
    const taxableTotal = items.reduce((acc, it) => acc + it.taxableAmount, 0);
    const discountTotal = subtotal - taxableTotal;

    // Check interstate based on buyer state code vs company state code
    const companyStateCode = settings.address?.stateCode || '33';
    const buyerStateCode = payload.buyerSnapshot?.billingAddress?.stateCode || '33';
    const isInterstate = Boolean(payload.isInterstate ?? (buyerStateCode !== companyStateCode));

    let cgstRate = 0;
    let cgstAmount = 0;
    let sgstRate = 0;
    let sgstAmount = 0;
    let igstRate = 0;
    let igstAmount = 0;

    if (isInterstate) {
      igstRate = payload.igstRate ?? (settings.taxConfig?.defaultIgstRate || 18);
      igstAmount = (taxableTotal * igstRate) / 100;
    } else {
      cgstRate = payload.cgstRate ?? (settings.taxConfig?.defaultCgstRate || 9);
      cgstAmount = (taxableTotal * cgstRate) / 100;
      sgstRate = payload.sgstRate ?? (settings.taxConfig?.defaultSgstRate || 9);
      sgstAmount = (taxableTotal * sgstRate) / 100;
    }

    const totalTax = cgstAmount + sgstAmount + igstAmount;
    const rawGrandTotal = taxableTotal + totalTax;
    const roundOff = payload.roundOff !== undefined ? payload.roundOff : Number((Math.round(rawGrandTotal) - rawGrandTotal).toFixed(2));
    const grandTotal = Math.round(rawGrandTotal + (payload.roundOff ? Number(payload.roundOff) : 0));

    const amountInWords = convertNumberToIndianWords(grandTotal);

    // Build immutable company snapshot
    const companySnapshot = {
      companyName: settings.companyName,
      tagline: settings.tagline,
      address: settings.address,
      phone: settings.phone,
      email: settings.email,
      website: settings.website,
      gstin: settings.gstin,
      pan: settings.pan,
      cin: settings.cin,
      bankDetails: settings.bankDetails,
      nablAccreditationNo: settings.nablAccreditationNo,
      invoicePrefix: settings.invoiceConfig?.prefix || 'GK/INV/',
      invoiceConfig: settings.invoiceConfig,
      authorizedSignatoryName: settings.invoiceConfig?.authorizedSignatoryName,
      signatoryTitle: settings.invoiceConfig?.signatoryTitle
    };

    const newInvoice = await store.createInvoice({
      ...payload,
      items,
      subtotal,
      discountTotal,
      taxableTotal,
      isInterstate,
      cgstRate,
      cgstAmount,
      sgstRate,
      sgstAmount,
      igstRate,
      igstAmount,
      totalTax,
      roundOff,
      grandTotal,
      amountInWords,
      paidAmount: payload.paidAmount || 0,
      balanceDue: grandTotal - (payload.paidAmount || 0),
      paymentStatus: (payload.paidAmount || 0) >= grandTotal ? 'Paid' : (payload.paidAmount > 0 ? 'Partially Paid' : 'Unpaid'),
      companySnapshot,
      notes: payload.notes || settings.invoiceConfig?.defaultNotes,
      declaration: payload.declaration || settings.invoiceConfig?.declaration
    });

    // Update customer stats if customer ID provided
    if (payload.customer) {
      const customer = store.getCustomerById(payload.customer);
      if (customer) {
        customer.stats = customer.stats || {};
        customer.stats.totalInvoices = (customer.stats.totalInvoices || 0) + 1;
        customer.stats.totalBilled = (customer.stats.totalBilled || 0) + grandTotal;
        customer.stats.outstandingBalance = (customer.stats.outstandingBalance || 0) + (grandTotal - (payload.paidAmount || 0));
        customer.stats.lastInvoiceDate = newInvoice.invoiceDate;
        await store.updateCustomer(customer._id, customer);
      }
    }

    res.status(201).json({ success: true, data: newInvoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Invoice
export const updateInvoice = async (req, res) => {
  try {
    const id = req.params.id;
    const existing = store.getInvoiceById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const payload = req.body;
    let grandTotal = payload.grandTotal !== undefined ? payload.grandTotal : existing.grandTotal;
    let amountInWords = payload.amountInWords || convertNumberToIndianWords(grandTotal);

    const updated = await store.updateInvoice(id, {
      ...payload,
      grandTotal,
      amountInWords,
      balanceDue: grandTotal - (payload.paidAmount !== undefined ? payload.paidAmount : existing.paidAmount)
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Duplicate Invoice
export const duplicateInvoice = async (req, res) => {
  try {
    const sourceInvoice = store.getInvoiceById(req.params.id);
    if (!sourceInvoice) {
      return res.status(404).json({ success: false, message: 'Source invoice not found' });
    }

    const settings = store.getSettings();
    const prefix = settings?.invoiceConfig?.prefix || 'GK/INV/';
    const fy = settings?.invoiceConfig?.financialYear || '26-27';
    const nextSeq = (settings?.invoiceConfig?.currentSequence || 4) + 1;
    const nextInvoiceNumber = `${prefix}${fy}/${String(nextSeq).padStart(3, '0')}`;

    const duplicatedPayload = {
      ...JSON.parse(JSON.stringify(sourceInvoice)),
      _id: undefined,
      invoiceNumber: nextInvoiceNumber,
      sequenceNumber: nextSeq,
      invoiceDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Draft',
      paymentStatus: 'Unpaid',
      paidAmount: 0,
      balanceDue: sourceInvoice.grandTotal,
      payments: [],
      notes: sourceInvoice.notes,
      declaration: sourceInvoice.declaration,
      createdBy: req.body?.createdBy || 'Billing Desk'
    };

    const newInvoice = await store.createInvoice(duplicatedPayload);
    res.status(201).json({ success: true, data: newInvoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Record Payment
export const recordPayment = async (req, res) => {
  try {
    const id = req.params.id;
    const invoice = store.getInvoiceById(id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const { amount, mode, referenceNo, bankName, notes, paymentDate } = req.body;
    const payAmt = Number(amount);
    if (isNaN(payAmt) || payAmt <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment amount is required' });
    }

    const newPayment = {
      _id: 'pay_' + Date.now(),
      paymentDate: paymentDate || new Date().toISOString(),
      amount: payAmt,
      mode: mode || 'NEFT',
      referenceNo: referenceNo || '',
      bankName: bankName || '',
      notes: notes || '',
      recordedBy: req.body.recordedBy || 'Accounts'
    };

    const payments = [...(invoice.payments || []), newPayment];
    const paidAmount = (invoice.paidAmount || 0) + payAmt;
    const balanceDue = Math.max(0, invoice.grandTotal - paidAmount);
    const paymentStatus = balanceDue === 0 ? 'Paid' : (paidAmount > 0 ? 'Partially Paid' : 'Unpaid');
    const invoiceStatus = balanceDue === 0 ? 'Paid' : (invoice.status === 'Draft' ? 'Draft' : 'Partially Paid');

    const updated = await store.updateInvoice(id, {
      payments,
      paidAmount,
      balanceDue,
      paymentStatus,
      status: invoiceStatus
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete / Cancel Invoice
export const deleteInvoice = async (req, res) => {
  try {
    const id = req.params.id;
    const invoice = store.getInvoiceById(id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Soft cancel or hard delete based on query
    if (req.query.permanent === 'true') {
      await store.deleteInvoice(id);
      return res.json({ success: true, message: 'Invoice permanently deleted' });
    }

    const updated = await store.updateInvoice(id, { status: 'Cancelled' });
    res.json({ success: true, data: updated, message: 'Invoice marked as Cancelled' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
