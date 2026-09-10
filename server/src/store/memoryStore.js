import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'db_data.json');

// Initial seed data with clear settings, 1 employee, 1 customer, 1 invoice, and 0 catalog items
export const initialData = {
  companySettings: {
    companyName: '',
    tagline: '',
    logo: '/logo.png',
    address: {
      street: '',
      city: '',
      state: 'Tamil Nadu',
      stateCode: '33',
      pincode: ''
    },
    phone: '',
    email: '',
    website: '',
    gstin: '',
    pan: '',
    cin: '',
    nablAccreditationNo: '',
    bankDetails: {
      bankName: '',
      accountName: '',
      accountNumber: '',
      branch: '',
      ifscCode: '',
      accountType: 'Current Account',
      upiId: ''
    },
    invoiceConfig: {
      prefix: 'GK/INV/',
      financialYear: '26-27',
      startingNumber: 1,
      currentSequence: 1,
      defaultPaymentTerms: '30 Days Net from date of Invoice',
      defaultNotes: '',
      declaration: '1) Cheque, DD / RTGS in favour of GK Metal Testing Lab Payable at Trichy.\n2) GST category: (998346) technical testing and analysis service.\n3) We hereby declare that, there is no transfer of property in goods involved in execution of this contract which is leviable to tax as sale of goods. "This is purely a service contract."\n4) All disputes Subject to Chennai Jurisdiction.',
      authorizedSignatoryName: '',
      signatoryTitle: 'Authorized Signatory',
      signatureImageUrl: ''
    },
    taxConfig: {
      defaultCgstRate: 9,
      defaultSgstRate: 9,
      defaultIgstRate: 18,
      hsnSacDefault: '998346',
      enableRoundOff: true
    }
  },
  services: [],
  customers: [
    {
      _id: 'cust_1',
      customerId: 'CUST-1001',
      companyName: 'L&T Heavy Engineering Limited',
      contactPerson: 'Mr. R. Raghavan (Senior QC Manager)',
      email: 'raghavan.r@lnthe.com',
      phone: '+91 98401 23456',
      gstin: '33AABCL1234F1Z2',
      pan: 'AABCL1234F',
      billingAddress: {
        street: 'Gate 4, Heavy Industrial Complex, Mount Poonamallee Road, Manapakkam',
        city: 'Chennai',
        state: 'Tamil Nadu',
        stateCode: '33',
        pincode: '600089'
      },
      shippingAddress: {
        street: 'Gate 4, Heavy Industrial Complex, Mount Poonamallee Road, Manapakkam',
        city: 'Chennai',
        state: 'Tamil Nadu',
        stateCode: '33',
        pincode: '600089'
      },
      paymentTerms: '45 Days Net',
      status: 'Active',
      stats: {
        totalInvoices: 1,
        totalBilled: 2950,
        totalPaid: 0,
        outstandingBalance: 2950,
        lastInvoiceDate: '2026-09-02T10:30:00.000Z'
      }
    }
  ],
  employees: [
    {
      _id: 'emp_1',
      employeeId: 'EMP-01',
      name: 'G. Karthikeyan',
      email: 'karthik@gkmetallab.com',
      role: 'Admin',
      department: 'Management & Technical QA',
      phone: '+91 94440 12345',
      status: 'Active'
    }
  ],
  invoices: [
    {
      _id: 'inv_1',
      invoiceNumber: 'GK/INV/26-27/001',
      financialYear: '26-27',
      sequenceNumber: 1,
      invoiceDate: '2026-09-02T10:30:00.000Z',
      dueDate: '2026-10-02T10:30:00.000Z',
      status: 'Pending Payment',
      paymentStatus: 'Unpaid',
      metadata: {
        deliveryNote: 'DN/2026/884',
        modeOfPayment: '30 Days Net',
        supplierRef: 'GK/TR/9482',
        otherRef: 'NABL-LAB-09',
        buyerOrderNo: 'PO-LT-99201',
        orderDate: '28-Aug-2026',
        despatchedThrough: 'Lab Courier / Hand Delivery',
        destination: 'Chennai',
        termsOfDelivery: 'Door Delivery Test Report',
        sampleBatchRef: 'Forged Flange Heat #F892',
        testReportRef: 'GK/TR/2026/09482'
      },
      customer: 'cust_1',
      buyerSnapshot: {
        companyName: 'L&T Heavy Engineering Limited',
        contactPerson: 'Mr. R. Raghavan (Senior QC Manager)',
        email: 'raghavan.r@lnthe.com',
        phone: '+91 98401 23456',
        gstin: '33AABCL1234F1Z2',
        pan: 'AABCL1234F',
        billingAddress: {
          street: 'Gate 4, Heavy Industrial Complex, Mount Poonamallee Road, Manapakkam',
          city: 'Chennai',
          state: 'Tamil Nadu',
          stateCode: '33',
          pincode: '600089'
        },
        shippingAddress: {
          street: 'Gate 4, Heavy Industrial Complex, Mount Poonamallee Road, Manapakkam',
          city: 'Chennai',
          state: 'Tamil Nadu',
          stateCode: '33',
          pincode: '600089'
        }
      },
      companySnapshot: {
        companyName: '',
        tagline: '',
        address: {
          street: '',
          city: '',
          state: 'Tamil Nadu',
          stateCode: '33',
          pincode: ''
        },
        phone: '',
        email: '',
        gstin: '',
        pan: '',
        bankDetails: {
          bankName: '',
          accountName: '',
          accountNumber: '',
          branch: '',
          ifscCode: ''
        },
        nablAccreditationNo: ''
      },
      items: [
        {
          slNo: 1,
          serviceId: '',
          description: 'PMI TESTING CHARGES (Positive Material Identification on SS316L Forged Flanges)',
          hsnSac: '998346',
          quantity: 1,
          rate: 2500,
          per: 'No.',
          discountPercent: 0,
          taxableAmount: 2500
        }
      ],
      subtotal: 2500,
      discountTotal: 0,
      taxableTotal: 2500,
      isInterstate: false,
      cgstRate: 9,
      cgstAmount: 225,
      sgstRate: 9,
      sgstAmount: 225,
      igstRate: 0,
      igstAmount: 0,
      totalTax: 450,
      roundOff: 0,
      grandTotal: 2950,
      amountInWords: 'INR Two Thousand Nine Hundred and Fifty Rupees Only',
      paidAmount: 0,
      balanceDue: 2950,
      payments: [],
      notes: '',
      declaration: '1) Cheque, DD / RTGS in favour of GK Metal Testing Lab Payable at Trichy.\n2) GST category: (998346) technical testing and analysis service.\n3) We hereby declare that, there is no transfer of property in goods involved in execution of this contract which is leviable to tax as sale of goods. "This is purely a service contract."\n4) All disputes Subject to Chennai Jurisdiction.',
      createdBy: 'G. Karthikeyan',
      updatedBy: 'G. Karthikeyan',
      createdAt: '2026-09-02T10:30:00.000Z',
      updatedAt: '2026-09-02T10:30:00.000Z'
    }
  ]
};

// JSON-backed store loader & saver for instant operation
class MemoryStore {
  constructor() {
    this.data = null;
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf8');
        this.data = JSON.parse(fileContent);
      } else {
        this.data = JSON.parse(JSON.stringify(initialData));
        this.save();
      }
    } catch (e) {
      console.warn('Fallback to fresh in-memory data store:', e.message);
      this.data = JSON.parse(JSON.stringify(initialData));
    }
  }

  save() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      console.error('Error saving data store file:', e.message);
    }
  }

  // Company Settings
  getSettings() {
    return this.data.companySettings;
  }

  updateSettings(newSettings) {
    this.data.companySettings = {
      ...this.data.companySettings,
      ...newSettings,
      address: { ...this.data.companySettings.address, ...(newSettings.address || {}) },
      bankDetails: { ...this.data.companySettings.bankDetails, ...(newSettings.bankDetails || {}) },
      invoiceConfig: { ...this.data.companySettings.invoiceConfig, ...(newSettings.invoiceConfig || {}) },
      taxConfig: { ...this.data.companySettings.taxConfig, ...(newSettings.taxConfig || {}) }
    };
    this.save();
    return this.data.companySettings;
  }

  // Invoices
  getInvoices() {
    return this.data.invoices;
  }

  getInvoiceById(id) {
    return this.data.invoices.find(inv => inv._id === id || inv.invoiceNumber === id);
  }

  createInvoice(invoicePayload) {
    const nextSeq = (this.data.companySettings.invoiceConfig.currentSequence || 1) + 1;
    this.data.companySettings.invoiceConfig.currentSequence = nextSeq;

    const newInv = {
      _id: 'inv_' + Date.now(),
      sequenceNumber: nextSeq,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...invoicePayload
    };

    this.data.invoices.unshift(newInv);
    this.save();
    return newInv;
  }

  updateInvoice(id, updatePayload) {
    const index = this.data.invoices.findIndex(inv => inv._id === id);
    if (index === -1) return null;

    this.data.invoices[index] = {
      ...this.data.invoices[index],
      ...updatePayload,
      updatedAt: new Date().toISOString()
    };
    this.save();
    return this.data.invoices[index];
  }

  deleteInvoice(id) {
    const index = this.data.invoices.findIndex(inv => inv._id === id);
    if (index === -1) return false;
    this.data.invoices.splice(index, 1);
    this.save();
    return true;
  }

  // Customers
  getCustomers() {
    return this.data.customers;
  }

  getCustomerById(id) {
    return this.data.customers.find(c => c._id === id || c.customerId === id);
  }

  createCustomer(payload) {
    const custCount = this.data.customers.length + 1001;
    const newCust = {
      _id: 'cust_' + Date.now(),
      customerId: payload.customerId || `CUST-${custCount}`,
      stats: {
        totalInvoices: 0,
        totalBilled: 0,
        totalPaid: 0,
        outstandingBalance: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...payload
    };
    this.data.customers.push(newCust);
    this.save();
    return newCust;
  }

  updateCustomer(id, payload) {
    const index = this.data.customers.findIndex(c => c._id === id);
    if (index === -1) return null;
    this.data.customers[index] = {
      ...this.data.customers[index],
      ...payload,
      updatedAt: new Date().toISOString()
    };
    this.save();
    return this.data.customers[index];
  }

  deleteCustomer(id) {
    const index = this.data.customers.findIndex(c => c._id === id);
    if (index === -1) return false;
    this.data.customers.splice(index, 1);
    this.save();
    return true;
  }

  // Services
  getServices() {
    return this.data.services;
  }

  getServiceById(id) {
    return this.data.services.find(s => s._id === id || s.serviceCode === id);
  }

  createService(payload) {
    const newService = {
      _id: 'srv_' + Date.now(),
      serviceCode: payload.serviceCode || `TEST-${Date.now().toString().slice(-4)}`,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...payload
    };
    this.data.services.push(newService);
    this.save();
    return newService;
  }

  createServices(payloadArray) {
    const createdList = [];
    let counter = Date.now();
    for (const payload of payloadArray) {
      counter++;
      const newService = {
        _id: 'srv_' + counter,
        serviceCode: payload.serviceCode || `TEST-${counter.toString().slice(-4)}`,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...payload
      };
      this.data.services.push(newService);
      createdList.push(newService);
    }
    this.save();
    return createdList;
  }

  updateService(id, payload) {
    const index = this.data.services.findIndex(s => s._id === id);
    if (index === -1) return null;
    this.data.services[index] = {
      ...this.data.services[index],
      ...payload,
      updatedAt: new Date().toISOString()
    };
    this.save();
    return this.data.services[index];
  }

  deleteService(id) {
    const index = this.data.services.findIndex(s => s._id === id);
    if (index === -1) return false;
    this.data.services.splice(index, 1);
    this.save();
    return true;
  }

  // Employees
  getEmployees() {
    return this.data.employees;
  }

  createEmployee(payload) {
    const newEmp = {
      _id: 'emp_' + Date.now(),
      employeeId: payload.employeeId || `EMP-0${this.data.employees.length + 1}`,
      status: 'Active',
      ...payload
    };
    this.data.employees.push(newEmp);
    this.save();
    return newEmp;
  }

  updateEmployee(id, payload) {
    const index = this.data.employees.findIndex(e => e._id === id);
    if (index === -1) return null;
    this.data.employees[index] = { ...this.data.employees[index], ...payload };
    this.save();
    return this.data.employees[index];
  }

  deleteEmployee(id) {
    const index = this.data.employees.findIndex(e => e._id === id);
    if (index === -1) return false;
    this.data.employees.splice(index, 1);
    this.save();
    return true;
  }
}

export const store = new MemoryStore();
