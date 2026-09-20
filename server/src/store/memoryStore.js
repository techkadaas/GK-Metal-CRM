import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { Customer } from '../models/Customer.js';
import { Invoice } from '../models/Invoice.js';
import { Service } from '../models/Service.js';
import { CompanySettings } from '../models/CompanySettings.js';
import { User } from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'db_data.json');

// Initial seed data with default company settings and sample structures
export const initialData = {
  companySettings: {
    companyName: 'GK Metal Testing Lab',
    tagline: '',
    logo: '/logo-icon.png',
    address: {
      street: 'No.1, Parayadi Street, Sankaran Pillai Road',
      city: 'Trichy',
      state: 'Tamilnadu',
      stateCode: '33',
      pincode: '620 002'
    },
    phone: '',
    email: 'gkmetaltestinglab@gmail.com',
    website: '',
    gstin: '33CRZPV0007J1ZD',
    pan: 'CRZPV0007J',
    cin: '',
    nablAccreditationNo: '',
    bankDetails: {
      bankName: 'Karur Vysya Bank',
      accountName: 'GK Metal Testing Lab',
      accountNumber: '1195135000016609',
      branch: 'TRICHY MAIN BRANCH',
      ifscCode: 'KVBL0001195',
      accountType: 'Current Account',
      upiId: ''
    },
    invoiceConfig: {
      prefix: 'GK/INV/',
      financialYear: '26-27',
      startingNumber: 1,
      currentSequence: 4,
      defaultPaymentTerms: '30 Days',
      defaultNotes: '',
      declaration: '1) Cheque, DD / RTGS in favour of GK Metal Testing Lab Payable at Trichy.\n2) GST category: (998346) technical testing and analysis service.\n3) We hereby declare that, there is no transfer of property in goods involved in execution of this contract which is leviable to tax as sale of goods. "This is purely a service contract."\n4) All disputes Subject to Chennai Jurisdiction.',
      authorizedSignatoryName: '',
      signatoryTitle: 'Authorised Signatory',
      signatureImageUrl: '/signature.png'
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
  customers: [],
  employees: [],
  invoices: []
};

// Resilient Store: in-memory cache + local file backup + permanent MongoDB Atlas synchronization
class MemoryStore {
  constructor() {
    this.data = null;
    this.isMongoSynced = false;
    this.syncPromise = null;
    this.load();

    // Hook mongoose connection event
    if (mongoose.connection) {
      mongoose.connection.on('connected', () => {
        this.syncWithMongo();
      });
    }
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
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      console.error('Error saving data store file:', e.message);
    }
  }

  // Non-destructive bidirectional sync: merges MongoDB data with local cache without deleting any newly created records
  async syncWithMongo() {
    if (mongoose.connection.readyState !== 1) return;
    if (this.syncPromise) return this.syncPromise;

    this.syncPromise = (async () => {
      try {
        console.log('🔄 Synchronizing data with MongoDB Atlas cloud database...');

        const [mongoCustomers, mongoInvoices, mongoServices, mongoSettings, mongoUsers] = await Promise.all([
          Customer.find().lean().catch(() => []),
          Invoice.find().lean().catch(() => []),
          Service.find().lean().catch(() => []),
          CompanySettings.findOne().lean().catch(() => null),
          User.find().lean().catch(() => [])
        ]);

        // 1. Merge & Sync Settings
        if (mongoSettings) {
          this.data.companySettings = {
            ...this.data.companySettings,
            ...mongoSettings
          };
        } else if (this.data.companySettings) {
          const { _id, ...settingsData } = this.data.companySettings;
          await CompanySettings.findOneAndUpdate(
            {},
            { $set: settingsData, $setOnInsert: { _id: _id || 'settings_default' } },
            { upsert: true }
          ).catch(err => console.error('Settings cloud sync note:', err.message));
        }

        // 2. Non-destructive merge of Customers (Union by customerId or _id)
        const customerMap = new Map();
        (this.data.customers || []).forEach(c => {
          if (c.customerId) customerMap.set(c.customerId, c);
          else if (c._id) customerMap.set(c._id, c);
        });
        (mongoCustomers || []).forEach(mc => {
          const key = mc.customerId || mc._id;
          const local = customerMap.get(key);
          if (!local || new Date(mc.updatedAt || 0) >= new Date(local.updatedAt || 0)) {
            customerMap.set(key, { ...local, ...mc });
          }
        });
        this.data.customers = Array.from(customerMap.values());

        // Push any local customers to MongoDB
        for (const cust of this.data.customers) {
          const { _id, ...custFields } = cust;
          await Customer.findOneAndUpdate(
            { customerId: cust.customerId },
            { $set: custFields, $setOnInsert: { _id: cust._id || ('cust_' + Date.now()) } },
            { upsert: true }
          ).catch(err => console.error('Customer cloud sync note:', cust.customerId, err.message));
        }

        // 3. Non-destructive merge of Invoices (Union by invoiceNumber or _id)
        const invoiceMap = new Map();
        (this.data.invoices || []).forEach(inv => {
          if (inv.invoiceNumber) invoiceMap.set(inv.invoiceNumber, inv);
          else if (inv._id) invoiceMap.set(inv._id, inv);
        });
        (mongoInvoices || []).forEach(minv => {
          const key = minv.invoiceNumber || minv._id;
          const local = invoiceMap.get(key);
          if (!local || new Date(minv.updatedAt || 0) >= new Date(local.updatedAt || 0)) {
            invoiceMap.set(key, { ...local, ...minv });
          }
        });
        this.data.invoices = Array.from(invoiceMap.values());
        this.data.invoices.sort((a, b) => new Date(b.createdAt || b.invoiceDate || 0) - new Date(a.createdAt || a.invoiceDate || 0));

        // Push all invoices to MongoDB
        for (const inv of this.data.invoices) {
          const { _id, ...invFields } = inv;
          await Invoice.findOneAndUpdate(
            { invoiceNumber: inv.invoiceNumber },
            { $set: invFields, $setOnInsert: { _id: inv._id || ('inv_' + Date.now()) } },
            { upsert: true }
          ).catch(err => console.error('Invoice cloud sync note:', inv.invoiceNumber, err.message));
        }

        // 4. Non-destructive merge of Services (Union by serviceCode or _id)
        const serviceMap = new Map();
        (this.data.services || []).forEach(s => {
          if (s.serviceCode) serviceMap.set(s.serviceCode, s);
          else if (s._id) serviceMap.set(s._id, s);
        });
        (mongoServices || []).forEach(ms => {
          const key = ms.serviceCode || ms._id;
          const local = serviceMap.get(key);
          if (!local || new Date(ms.updatedAt || 0) >= new Date(local.updatedAt || 0)) {
            serviceMap.set(key, { ...local, ...ms });
          }
        });
        this.data.services = Array.from(serviceMap.values());

        // Push services to MongoDB
        for (const srv of this.data.services) {
          const { _id, ...srvFields } = srv;
          await Service.findOneAndUpdate(
            { serviceCode: srv.serviceCode },
            { $set: srvFields, $setOnInsert: { _id: srv._id || ('srv_' + Date.now()) } },
            { upsert: true }
          ).catch(err => console.error('Service cloud sync note:', srv.serviceCode, err.message));
        }

        // 5. Non-destructive merge of Employees
        const empMap = new Map();
        (this.data.employees || []).forEach(e => {
          if (e.email) empMap.set(e.email, e);
          else if (e.employeeId) empMap.set(e.employeeId, e);
        });
        (mongoUsers || []).forEach(mu => {
          const key = mu.email || mu.employeeId;
          const local = empMap.get(key);
          if (!local || new Date(mu.updatedAt || 0) >= new Date(local.updatedAt || 0)) {
            empMap.set(key, { ...local, ...mu });
          }
        });
        this.data.employees = Array.from(empMap.values());

        for (const emp of this.data.employees) {
          const { _id, ...empFields } = emp;
          await User.findOneAndUpdate(
            { email: emp.email },
            { $set: empFields, $setOnInsert: { _id: emp._id || ('emp_' + Date.now()) } },
            { upsert: true }
          ).catch(err => console.error('Employee cloud sync note:', emp.email, err.message));
        }

        this.save();
        this.isMongoSynced = true;
        console.log(`✓ Data successfully synchronized with MongoDB Atlas (${this.data.invoices.length} invoices, ${this.data.customers.length} customers, ${this.data.services.length} services).`);
      } catch (err) {
        console.error('! Error during MongoDB bidirectional sync:', err.message);
      } finally {
        this.syncPromise = null;
      }
    })();

    return this.syncPromise;
  }

  // Company Settings
  getSettings() {
    return this.data.companySettings;
  }

  async updateSettings(newSettings) {
    this.data.companySettings = {
      ...this.data.companySettings,
      ...newSettings,
      address: { ...this.data.companySettings.address, ...(newSettings.address || {}) },
      bankDetails: { ...this.data.companySettings.bankDetails, ...(newSettings.bankDetails || {}) },
      invoiceConfig: { ...this.data.companySettings.invoiceConfig, ...(newSettings.invoiceConfig || {}) },
      taxConfig: { ...this.data.companySettings.taxConfig, ...(newSettings.taxConfig || {}) }
    };
    this.save();

    if (mongoose.connection.readyState === 1) {
      try {
        const { _id, ...settingsData } = this.data.companySettings;
        await CompanySettings.findOneAndUpdate(
          {},
          { $set: settingsData, $setOnInsert: { _id: _id || 'settings_default' } },
          { upsert: true }
        );
      } catch (err) {
        console.error('Mongo sync error (settings):', err.message);
      }
    }

    return this.data.companySettings;
  }

  // Invoices
  getInvoices() {
    return this.data.invoices;
  }

  getInvoiceById(id) {
    return this.data.invoices.find(inv => inv._id === id || inv.invoiceNumber === id);
  }

  async createInvoice(payload) {
    const settings = this.getSettings();
    const currentSeq = settings?.invoiceConfig?.currentSequence || 1;
    const nextSeq = currentSeq + 1;
    const prefix = settings?.invoiceConfig?.prefix || 'GK/INV/';
    const fy = settings?.invoiceConfig?.financialYear || '26-27';
    const formattedSeq = String(nextSeq).padStart(3, '0');
    const autoInvoiceNumber = `${prefix}${fy}/${formattedSeq}`;

    const newInvoice = {
      _id: 'inv_' + Date.now(),
      invoiceNumber: payload.invoiceNumber || autoInvoiceNumber,
      financialYear: payload.financialYear || fy,
      sequenceNumber: payload.sequenceNumber || nextSeq,
      status: payload.status || 'Generated',
      paymentStatus: payload.paymentStatus || 'Unpaid',
      paidAmount: payload.paidAmount || 0,
      balanceDue: payload.balanceDue !== undefined ? payload.balanceDue : (payload.grandTotal || 0),
      payments: payload.payments || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...payload
    };

    // Update sequence in settings
    if (settings?.invoiceConfig) {
      settings.invoiceConfig.currentSequence = Math.max(currentSeq, nextSeq);
      await this.updateSettings(settings);
    }

    this.data.invoices.unshift(newInvoice);
    this.save();

    // Persist to MongoDB
    if (mongoose.connection.readyState === 1) {
      try {
        const { _id, ...invData } = newInvoice;
        await Invoice.findOneAndUpdate(
          { invoiceNumber: newInvoice.invoiceNumber },
          { $set: invData, $setOnInsert: { _id: newInvoice._id } },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.error('Mongo sync error (create invoice):', err.message);
      }
    }

    return newInvoice;
  }

  async updateInvoice(id, updatePayload) {
    const index = this.data.invoices.findIndex(inv => inv._id === id || inv.invoiceNumber === id);
    if (index === -1) return null;

    this.data.invoices[index] = {
      ...this.data.invoices[index],
      ...updatePayload,
      updatedAt: new Date().toISOString()
    };
    this.save();

    // Persist to MongoDB
    if (mongoose.connection.readyState === 1) {
      try {
        const { _id, ...updateData } = this.data.invoices[index];
        await Invoice.findOneAndUpdate(
          { $or: [{ _id: id }, { invoiceNumber: id }] },
          { $set: updateData },
          { new: true }
        );
      } catch (err) {
        console.error('Mongo sync error (update invoice):', err.message);
      }
    }

    return this.data.invoices[index];
  }

  async deleteInvoice(id) {
    const index = this.data.invoices.findIndex(inv => inv._id === id || inv.invoiceNumber === id);
    if (index === -1) return false;
    this.data.invoices.splice(index, 1);
    this.save();

    // Persist to MongoDB
    if (mongoose.connection.readyState === 1) {
      try {
        await Invoice.findOneAndDelete({ $or: [{ _id: id }, { invoiceNumber: id }] });
      } catch (err) {
        console.error('Mongo sync error (delete invoice):', err.message);
      }
    }

    return true;
  }

  // Customers
  getCustomers() {
    return this.data.customers;
  }

  getCustomerById(id) {
    return this.data.customers.find(c => c._id === id || c.customerId === id);
  }

  async createCustomer(payload) {
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

    // Persist to MongoDB
    if (mongoose.connection.readyState === 1) {
      try {
        const { _id, ...custData } = newCust;
        await Customer.findOneAndUpdate(
          { customerId: newCust.customerId },
          { $set: custData, $setOnInsert: { _id: newCust._id } },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.error('Mongo sync error (create customer):', err.message);
      }
    }

    return newCust;
  }

  async updateCustomer(id, payload) {
    const index = this.data.customers.findIndex(c => c._id === id || c.customerId === id);
    if (index === -1) return null;
    this.data.customers[index] = {
      ...this.data.customers[index],
      ...payload,
      updatedAt: new Date().toISOString()
    };
    this.save();

    // Persist to MongoDB
    if (mongoose.connection.readyState === 1) {
      try {
        const { _id, ...updateData } = this.data.customers[index];
        await Customer.findOneAndUpdate(
          { $or: [{ _id: id }, { customerId: id }] },
          { $set: updateData },
          { new: true }
        );
      } catch (err) {
        console.error('Mongo sync error (update customer):', err.message);
      }
    }

    return this.data.customers[index];
  }

  async deleteCustomer(id) {
    const index = this.data.customers.findIndex(c => c._id === id || c.customerId === id);
    if (index === -1) return false;
    this.data.customers.splice(index, 1);
    this.save();

    // Persist to MongoDB
    if (mongoose.connection.readyState === 1) {
      try {
        await Customer.findOneAndDelete({ $or: [{ _id: id }, { customerId: id }] });
      } catch (err) {
        console.error('Mongo sync error (delete customer):', err.message);
      }
    }

    return true;
  }

  // Services
  getServices() {
    return this.data.services;
  }

  getServiceById(id) {
    return this.data.services.find(s => s._id === id || s.serviceCode === id);
  }

  async createService(payload) {
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

    if (mongoose.connection.readyState === 1) {
      try {
        const { _id, ...srvData } = newService;
        await Service.findOneAndUpdate(
          { serviceCode: newService.serviceCode },
          { $set: srvData, $setOnInsert: { _id: newService._id } },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.error('Mongo sync error (create service):', err.message);
      }
    }

    return newService;
  }

  async createServices(payloadArray) {
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

      if (mongoose.connection.readyState === 1) {
        try {
          const { _id, ...srvData } = newService;
          await Service.findOneAndUpdate(
            { serviceCode: newService.serviceCode },
            { $set: srvData, $setOnInsert: { _id: newService._id } },
            { upsert: true, new: true }
          );
        } catch (err) {
          console.error('Mongo sync error (create services):', err.message);
        }
      }
    }
    this.save();
    return createdList;
  }

  async updateService(id, payload) {
    const index = this.data.services.findIndex(s => s._id === id || s.serviceCode === id);
    if (index === -1) return null;
    this.data.services[index] = {
      ...this.data.services[index],
      ...payload,
      updatedAt: new Date().toISOString()
    };
    this.save();

    if (mongoose.connection.readyState === 1) {
      try {
        const { _id, ...updateData } = this.data.services[index];
        await Service.findOneAndUpdate(
          { $or: [{ _id: id }, { serviceCode: id }] },
          { $set: updateData },
          { new: true }
        );
      } catch (err) {
        console.error('Mongo sync error (update service):', err.message);
      }
    }

    return this.data.services[index];
  }

  async deleteService(id) {
    const index = this.data.services.findIndex(s => s._id === id || s.serviceCode === id);
    if (index === -1) return false;
    this.data.services.splice(index, 1);
    this.save();

    if (mongoose.connection.readyState === 1) {
      try {
        await Service.findOneAndDelete({ $or: [{ _id: id }, { serviceCode: id }] });
      } catch (err) {
        console.error('Mongo sync error (delete service):', err.message);
      }
    }

    return true;
  }

  // Employees
  getEmployees() {
    return this.data.employees;
  }

  async createEmployee(payload) {
    const newEmp = {
      _id: 'emp_' + Date.now(),
      employeeId: payload.employeeId || `EMP-0${this.data.employees.length + 1}`,
      status: 'Active',
      ...payload
    };
    this.data.employees.push(newEmp);
    this.save();

    if (mongoose.connection.readyState === 1) {
      try {
        const { _id, ...empData } = newEmp;
        await User.findOneAndUpdate(
          { email: newEmp.email },
          { $set: empData, $setOnInsert: { _id: newEmp._id } },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.error('Mongo sync error (create employee):', err.message);
      }
    }

    return newEmp;
  }

  async updateEmployee(id, payload) {
    const index = this.data.employees.findIndex(e => e._id === id || e.employeeId === id);
    if (index === -1) return null;
    this.data.employees[index] = { ...this.data.employees[index], ...payload };
    this.save();

    if (mongoose.connection.readyState === 1) {
      try {
        const { _id, ...updateData } = this.data.employees[index];
        await User.findOneAndUpdate(
          { $or: [{ _id: id }, { employeeId: id }] },
          { $set: updateData },
          { new: true }
        );
      } catch (err) {
        console.error('Mongo sync error (update employee):', err.message);
      }
    }

    return this.data.employees[index];
  }

  async deleteEmployee(id) {
    const index = this.data.employees.findIndex(e => e._id === id || e.employeeId === id);
    if (index === -1) return false;
    this.data.employees.splice(index, 1);
    this.save();

    if (mongoose.connection.readyState === 1) {
      try {
        await User.findOneAndDelete({ $or: [{ _id: id }, { employeeId: id }] });
      } catch (err) {
        console.error('Mongo sync error (delete employee):', err.message);
      }
    }

    return true;
  }
}

export const store = new MemoryStore();
