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

export const parseInvoiceSeq = (strOrInv) => {
  if (!strOrInv) return 0;
  const numStr = typeof strOrInv === 'string' ? strOrInv.trim() : String(strOrInv.invoiceNumber || '').trim();
  const m = numStr.match(/(?:^|\/)(\d+)\s*$/);
  if (m) {
    const val = parseInt(m[1], 10);
    if (val > 0 && val < 100000) return val;
  }
  return typeof strOrInv === 'object' ? (Number(strOrInv.sequenceNumber) || 0) : 0;
};

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

  async ensureMongoConnection(timeoutMs = 5000) {
    if (!process.env.MONGODB_URI) return true;
    if (mongoose.connection.readyState === 1) return true;

    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      if (mongoose.connection.readyState === 1) return true;
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    return mongoose.connection.readyState === 1;
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
        this.data.customers.sort((a, b) => {
          const timeA = new Date(a.createdAt || 0).getTime();
          const timeB = new Date(b.createdAt || 0).getTime();
          if (timeA !== timeB) return timeB - timeA;
          return (b.customerId || b._id || '').localeCompare(a.customerId || a._id || '');
        });

        // Push any local customers to MongoDB
        for (const cust of this.data.customers) {
          const custId = cust.customerId || cust._id;
          if (!custId) continue;
          const { _id: custDocId, ...custFields } = cust;
          await Customer.findOneAndUpdate(
            { $or: [{ _id: cust._id }, { customerId: cust.customerId }] },
            { $set: custFields, $setOnInsert: { _id: custDocId || ('cust_' + Date.now()) } },
            { upsert: true }
          ).catch(err => console.error('Customer cloud sync note:', custId, err.message));
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
        this.data.invoices.sort((a, b) => {
          const seqA = parseInvoiceSeq(a);
          const seqB = parseInvoiceSeq(b);
          if (seqA !== seqB) return seqB - seqA;
          const timeA = new Date(a.createdAt || a.invoiceDate || 0).getTime();
          const timeB = new Date(b.createdAt || b.invoiceDate || 0).getTime();
          return timeB - timeA;
        });

        // Push all invoices to MongoDB
        for (const inv of this.data.invoices) {
          const invNo = inv.invoiceNumber || inv._id;
          if (!invNo) continue;
          const { _id: invDocId, ...invFields } = inv;
          await Invoice.findOneAndUpdate(
            { $or: [{ _id: inv._id }, { invoiceNumber: inv.invoiceNumber }] },
            { $set: invFields, $setOnInsert: { _id: invDocId || ('inv_' + Date.now()) } },
            { upsert: true }
          ).catch(err => console.error('Invoice cloud sync note:', invNo, err.message));
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
  async getSettings() {
    if (mongoose.connection.readyState === 1) {
      try {
        const mongoSettings = await CompanySettings.findOne().lean();
        if (mongoSettings) {
          this.data.companySettings = {
            ...this.data.companySettings,
            ...mongoSettings
          };
          this.save();
        }
      } catch (err) {
        console.warn('Mongo getSettings fallback:', err.message);
      }
    }
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
        const saved = await CompanySettings.findOneAndUpdate(
          {},
          { $set: settingsData, $setOnInsert: { _id: _id || 'settings_default' } },
          { upsert: true, new: true }
        ).lean();
        if (saved) {
          this.data.companySettings = { ...this.data.companySettings, ...saved };
          this.save();
        }
      } catch (err) {
        console.error('Mongo sync error (settings):', err.message);
      }
    }

    return this.data.companySettings;
  }

  // Invoices
  async getInvoices() {
    if (mongoose.connection.readyState === 1) {
      try {
        const mongoInvoices = await Invoice.find().sort({ createdAt: -1, invoiceDate: -1 }).lean();
        if (mongoInvoices && Array.isArray(mongoInvoices)) {
          // Non-destructive merge: preserve local records that may not be in MongoDB yet
          const invoiceMap = new Map();
          (this.data.invoices || []).forEach(inv => {
            const key = inv.invoiceNumber || inv._id;
            if (key) invoiceMap.set(key, inv);
          });
          (mongoInvoices || []).forEach(minv => {
            const key = minv.invoiceNumber || minv._id;
            const local = invoiceMap.get(key);
            if (!local || new Date(minv.updatedAt || 0) >= new Date(local.updatedAt || 0)) {
              invoiceMap.set(key, { ...local, ...minv });
            }
          });
          this.data.invoices = Array.from(invoiceMap.values());
          this.data.invoices.sort((a, b) => {
            const seqA = parseInvoiceSeq(a);
            const seqB = parseInvoiceSeq(b);
            if (seqA !== seqB) return seqB - seqA;
            const timeA = new Date(a.createdAt || a.invoiceDate || 0).getTime();
            const timeB = new Date(b.createdAt || b.invoiceDate || 0).getTime();
            return timeB - timeA;
          });
          this.save();
          return this.data.invoices;
        }
      } catch (err) {
        console.warn('Mongo getInvoices fallback to cached data:', err.message);
      }
    }
    return this.data.invoices;
  }

  async getInvoiceById(id) {
    if (mongoose.connection.readyState === 1) {
      try {
        const mongoInvoice = await Invoice.findOne({
          $or: [{ _id: id }, { invoiceNumber: id }]
        }).lean();
        if (mongoInvoice) return mongoInvoice;
      } catch (err) {
        console.warn('Mongo getInvoiceById fallback:', err.message);
      }
    }
    return this.data.invoices.find(inv => inv._id === id || inv.invoiceNumber === id);
  }

  async createInvoice(payload) {
    const settings = await this.getSettings();
    let maxSeq = 0;
    let lastDigitsStr = '';
    (this.data.invoices || []).forEach(inv => {
      const numStr = String(inv.invoiceNumber || '').trim();
      const m = numStr.match(/(?:^|\/)(\d+)\s*$/);
      if (m) {
        const val = parseInt(m[1], 10);
        if (val > 0 && val < 100000 && val > maxSeq) {
          maxSeq = val;
          lastDigitsStr = m[1];
        }
      }
    });

    const currentSeq = Math.max(maxSeq, settings?.invoiceConfig?.currentSequence || 0);
    const nextSeq = Math.max(currentSeq + 1, settings?.invoiceConfig?.startingNumber || 1);
    const prefix = settings?.invoiceConfig?.prefix || 'GK/INV/';
    const fy = settings?.invoiceConfig?.financialYear || '26-27';

    let formattedSeq = String(nextSeq);
    if (lastDigitsStr && lastDigitsStr.startsWith('0')) {
      formattedSeq = String(nextSeq).padStart(lastDigitsStr.length, '0');
    } else if (!lastDigitsStr) {
      formattedSeq = String(nextSeq).padStart(3, '0');
    }

    const autoInvoiceNumber = `${prefix}${fy}/${formattedSeq}`;
    const invoiceNumber = (payload.invoiceNumber && payload.invoiceNumber.trim()) ? payload.invoiceNumber.trim() : autoInvoiceNumber;
    const customId = payload._id || ('inv_' + Date.now());

    const payloadSeq = parseInvoiceSeq(invoiceNumber) || payload.sequenceNumber || nextSeq;

    let newInvoice = {
      _id: customId,
      invoiceNumber: invoiceNumber,
      financialYear: payload.financialYear || fy,
      sequenceNumber: payloadSeq,
      status: payload.status || 'Generated',
      paymentStatus: payload.paymentStatus || 'Unpaid',
      paidAmount: payload.paidAmount || 0,
      balanceDue: payload.balanceDue !== undefined ? payload.balanceDue : (payload.grandTotal || 0),
      payments: payload.payments || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...payload,
      _id: customId,
      invoiceNumber: invoiceNumber,
      sequenceNumber: payloadSeq
    };

    // Update sequence in settings
    if (settings?.invoiceConfig) {
      settings.invoiceConfig.currentSequence = Math.max(currentSeq, payloadSeq, nextSeq);
      await this.updateSettings(settings).catch(() => {});
    }

    // Persist to MongoDB Atlas with guaranteed write check
    if (process.env.MONGODB_URI) {
      const isConnected = await this.ensureMongoConnection();
      if (!isConnected) {
        throw new Error('Database is disconnected. Invoice creation failed.');
      }
      try {
        const { _id, ...invoiceDataWithoutId } = newInvoice;
        const saved = await Invoice.findOneAndUpdate(
          { $or: [{ _id: newInvoice._id }, { invoiceNumber: newInvoice.invoiceNumber }] },
          { $set: invoiceDataWithoutId, $setOnInsert: { _id: newInvoice._id } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        ).lean();
        if (saved) {
          newInvoice = { ...newInvoice, ...saved };
        }
      } catch (err) {
        console.error('Mongo invoice create error:', err.message);
        throw new Error(`Failed to save invoice to database: ${err.message}`);
      }
    }

    // Update memory and local disk store
    const existingIdx = this.data.invoices.findIndex(i => (i._id && i._id === newInvoice._id) || (i.invoiceNumber && i.invoiceNumber === newInvoice.invoiceNumber));
    if (existingIdx !== -1) {
      this.data.invoices[existingIdx] = newInvoice;
    } else {
      this.data.invoices.unshift(newInvoice);
    }
    this.save();

    return newInvoice;
  }

  async updateInvoice(id, updatePayload) {
    let updatedInvoice = null;

    if (process.env.MONGODB_URI) {
      const isConnected = await this.ensureMongoConnection();
      if (!isConnected) {
        throw new Error('Database is disconnected. Invoice update failed.');
      }
      try {
        const { _id, updatedAt, ...updateData } = updatePayload;
        updatedInvoice = await Invoice.findOneAndUpdate(
          { $or: [{ _id: id }, { invoiceNumber: id }] },
          { $set: { ...updateData, updatedAt: new Date() } },
          { new: true }
        ).lean();
        if (!updatedInvoice) {
          return null;
        }
      } catch (err) {
        console.error('Mongo invoice update error:', err.message);
        throw new Error(`Failed to update invoice in database: ${err.message}`);
      }
    }

    const index = this.data.invoices.findIndex(inv => inv._id === id || inv.invoiceNumber === id);
    if (index !== -1) {
      this.data.invoices[index] = {
        ...this.data.invoices[index],
        ...updatePayload,
        ...(updatedInvoice || {}),
        updatedAt: new Date().toISOString()
      };
      this.save();
      return this.data.invoices[index];
    } else if (updatedInvoice) {
      this.data.invoices.unshift(updatedInvoice);
      this.save();
      return updatedInvoice;
    }

    return null;
  }

  async deleteInvoice(id) {
    if (process.env.MONGODB_URI) {
      const isConnected = await this.ensureMongoConnection();
      if (!isConnected) {
        throw new Error('Database is disconnected. Invoice deletion failed.');
      }
      try {
        await Invoice.findOneAndDelete({ $or: [{ _id: id }, { invoiceNumber: id }] });
      } catch (err) {
        console.error('Mongo invoice delete error:', err.message);
        throw new Error(`Failed to delete invoice from database: ${err.message}`);
      }
    }

    const index = this.data.invoices.findIndex(inv => inv._id === id || inv.invoiceNumber === id);
    if (index !== -1) {
      this.data.invoices.splice(index, 1);
      this.save();
      return true;
    }

    return true;
  }

  // Customers
  async getCustomers() {
    if (mongoose.connection.readyState === 1) {
      try {
        const mongoCustomers = await Customer.find().sort({ createdAt: -1 }).lean();
        if (mongoCustomers && Array.isArray(mongoCustomers)) {
          // Non-destructive merge: preserve local records that may not be in MongoDB yet
          const customerMap = new Map();
          (this.data.customers || []).forEach(c => {
            const key = c.customerId || c._id;
            if (key) customerMap.set(key, c);
          });
          (mongoCustomers || []).forEach(mc => {
            const key = mc.customerId || mc._id;
            const local = customerMap.get(key);
            if (!local || new Date(mc.updatedAt || 0) >= new Date(local.updatedAt || 0)) {
              customerMap.set(key, { ...local, ...mc });
            }
          });
          this.data.customers = Array.from(customerMap.values());
          this.data.customers.sort((a, b) => {
            const timeA = new Date(a.createdAt || 0).getTime();
            const timeB = new Date(b.createdAt || 0).getTime();
            if (timeA !== timeB) return timeB - timeA;
            return (b.customerId || b._id || '').localeCompare(a.customerId || a._id || '');
          });
          this.save();
          return this.data.customers;
        }
      } catch (err) {
        console.warn('Mongo getCustomers fallback to cached data:', err.message);
      }
    }
    return this.data.customers;
  }

  async getCustomerById(id) {
    if (mongoose.connection.readyState === 1) {
      try {
        const mongoCustomer = await Customer.findOne({
          $or: [{ _id: id }, { customerId: id }]
        }).lean();
        if (mongoCustomer) return mongoCustomer;
      } catch (err) {
        console.warn('Mongo getCustomerById fallback:', err.message);
      }
    }
    return this.data.customers.find(c => c._id === id || c.customerId === id);
  }

  async createCustomer(payload) {
    const custCount = (this.data.customers || []).length + 1001;
    const autoCustId = `CUST-${custCount}`;
    const customerId = (payload.customerId && payload.customerId.trim()) ? payload.customerId.trim() : autoCustId;
    const customId = payload._id || ('cust_' + Date.now());

    let newCust = {
      _id: customId,
      customerId: customerId,
      stats: {
        totalInvoices: 0,
        totalBilled: 0,
        totalPaid: 0,
        outstandingBalance: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...payload,
      _id: customId,
      customerId: customerId
    };

    // Persist to MongoDB Atlas with guaranteed write check
    if (process.env.MONGODB_URI) {
      const isConnected = await this.ensureMongoConnection();
      if (!isConnected) {
        throw new Error('Database is disconnected. Customer creation failed.');
      }
      try {
        const { _id, ...custDataWithoutId } = newCust;
        const saved = await Customer.findOneAndUpdate(
          { $or: [{ _id: newCust._id }, { customerId: newCust.customerId }] },
          { $set: custDataWithoutId, $setOnInsert: { _id: newCust._id } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        ).lean();
        if (saved) {
          newCust = { ...newCust, ...saved };
        }
      } catch (err) {
        console.error('Mongo customer create error:', err.message);
        throw new Error(`Failed to save customer to database: ${err.message}`);
      }
    }

    const existingIdx = this.data.customers.findIndex(c => (c._id && c._id === newCust._id) || (c.customerId && c.customerId === newCust.customerId));
    if (existingIdx !== -1) {
      this.data.customers[existingIdx] = newCust;
    } else {
      this.data.customers.unshift(newCust);
    }
    this.save();

    return newCust;
  }

  async updateCustomer(id, payload) {
    let updatedCustomer = null;

    if (process.env.MONGODB_URI) {
      const isConnected = await this.ensureMongoConnection();
      if (!isConnected) {
        throw new Error('Database is disconnected. Customer update failed.');
      }
      try {
        const { _id, updatedAt, ...updateData } = payload;
        updatedCustomer = await Customer.findOneAndUpdate(
          { $or: [{ _id: id }, { customerId: id }] },
          { $set: { ...updateData, updatedAt: new Date() } },
          { new: true }
        ).lean();
        if (!updatedCustomer) {
          return null;
        }
      } catch (err) {
        console.error('Mongo customer update error:', err.message);
        throw new Error(`Failed to update customer in database: ${err.message}`);
      }
    }

    const index = this.data.customers.findIndex(c => c._id === id || c.customerId === id);
    if (index !== -1) {
      this.data.customers[index] = {
        ...this.data.customers[index],
        ...payload,
        ...(updatedCustomer || {}),
        updatedAt: new Date().toISOString()
      };
      this.save();
      return this.data.customers[index];
    } else if (updatedCustomer) {
      this.data.customers.unshift(updatedCustomer);
      this.save();
      return updatedCustomer;
    }

    return null;
  }

  async deleteCustomer(id) {
    if (process.env.MONGODB_URI) {
      const isConnected = await this.ensureMongoConnection();
      if (!isConnected) {
        throw new Error('Database is disconnected. Customer deletion failed.');
      }
      try {
        await Customer.findOneAndDelete({ $or: [{ _id: id }, { customerId: id }] });
      } catch (err) {
        console.error('Mongo customer delete error:', err.message);
        throw new Error(`Failed to delete customer from database: ${err.message}`);
      }
    }

    const index = this.data.customers.findIndex(c => c._id === id || c.customerId === id);
    if (index !== -1) {
      this.data.customers.splice(index, 1);
      this.save();
      return true;
    }

    return true;
  }

  // Services
  async getServices() {
    if (mongoose.connection.readyState === 1) {
      try {
        const mongoServices = await Service.find().lean();
        if (mongoServices && Array.isArray(mongoServices)) {
          // Non-destructive merge: preserve local records that may not be in MongoDB yet
          const serviceMap = new Map();
          (this.data.services || []).forEach(s => {
            const key = s.serviceCode || s._id;
            if (key) serviceMap.set(key, s);
          });
          (mongoServices || []).forEach(ms => {
            const key = ms.serviceCode || ms._id;
            const local = serviceMap.get(key);
            if (!local || new Date(ms.updatedAt || 0) >= new Date(local.updatedAt || 0)) {
              serviceMap.set(key, { ...local, ...ms });
            }
          });
          this.data.services = Array.from(serviceMap.values());
          this.save();
          return this.data.services;
        }
      } catch (err) {
        console.warn('Mongo getServices fallback:', err.message);
      }
    }
    return this.data.services;
  }

  async getServiceById(id) {
    if (mongoose.connection.readyState === 1) {
      try {
        const mongoService = await Service.findOne({
          $or: [{ _id: id }, { serviceCode: id }]
        }).lean();
        if (mongoService) return mongoService;
      } catch (err) {
        console.warn('Mongo getServiceById fallback:', err.message);
      }
    }
    return this.data.services.find(s => s._id === id || s.serviceCode === id);
  }

  async createService(payload) {
    let newService = {
      _id: 'srv_' + Date.now(),
      serviceCode: payload.serviceCode || `TEST-${Date.now().toString().slice(-4)}`,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...payload
    };

    if (mongoose.connection.readyState === 1) {
      try {
        const { _id, ...srvData } = newService;
        const saved = await Service.findOneAndUpdate(
          { serviceCode: newService.serviceCode },
          { $set: srvData, $setOnInsert: { _id: newService._id } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        ).lean();
        if (saved) newService = { ...newService, ...saved };
      } catch (err) {
        console.error('Mongo sync error (create service):', err.message);
      }
    }

    this.data.services.push(newService);
    this.save();
    return newService;
  }

  async createServices(payloadArray) {
    const createdList = [];
    let counter = Date.now();
    for (const payload of payloadArray) {
      counter++;
      let newService = {
        _id: 'srv_' + counter,
        serviceCode: payload.serviceCode || `TEST-${counter.toString().slice(-4)}`,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...payload
      };

      if (mongoose.connection.readyState === 1) {
        try {
          const { _id, ...srvData } = newService;
          const saved = await Service.findOneAndUpdate(
            { serviceCode: newService.serviceCode },
            { $set: srvData, $setOnInsert: { _id: newService._id } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          ).lean();
          if (saved) newService = { ...newService, ...saved };
        } catch (err) {
          console.error('Mongo sync error (create services):', err.message);
        }
      }

      this.data.services.push(newService);
      createdList.push(newService);
    }
    this.save();
    return createdList;
  }

  async updateService(id, payload) {
    let updatedService = null;

    if (mongoose.connection.readyState === 1) {
      try {
        const { _id, updatedAt, ...updateData } = payload;
        updatedService = await Service.findOneAndUpdate(
          { $or: [{ _id: id }, { serviceCode: id }] },
          { $set: { ...updateData, updatedAt: new Date() } },
          { new: true }
        ).lean();
      } catch (err) {
        console.error('Mongo sync error (update service):', err.message);
      }
    }

    const index = this.data.services.findIndex(s => s._id === id || s.serviceCode === id);
    if (index !== -1) {
      this.data.services[index] = {
        ...this.data.services[index],
        ...payload,
        ...(updatedService || {}),
        updatedAt: new Date().toISOString()
      };
      this.save();
      return this.data.services[index];
    } else if (updatedService) {
      this.data.services.push(updatedService);
      this.save();
      return updatedService;
    }

    return null;
  }

  async deleteService(id) {
    if (mongoose.connection.readyState === 1) {
      try {
        await Service.findOneAndDelete({ $or: [{ _id: id }, { serviceCode: id }] });
      } catch (err) {
        console.error('Mongo sync error (delete service):', err.message);
      }
    }

    const index = this.data.services.findIndex(s => s._id === id || s.serviceCode === id);
    if (index !== -1) {
      this.data.services.splice(index, 1);
      this.save();
      return true;
    }

    return true;
  }

  // Employees
  async getEmployees() {
    if (mongoose.connection.readyState === 1) {
      try {
        const mongoUsers = await User.find().lean();
        if (mongoUsers && Array.isArray(mongoUsers)) {
          // Non-destructive merge: preserve local records that may not be in MongoDB yet
          const empMap = new Map();
          (this.data.employees || []).forEach(e => {
            const key = e.email || e.employeeId || e._id;
            if (key) empMap.set(key, e);
          });
          (mongoUsers || []).forEach(mu => {
            const key = mu.email || mu.employeeId || mu._id;
            const local = empMap.get(key);
            if (!local || new Date(mu.updatedAt || 0) >= new Date(local.updatedAt || 0)) {
              empMap.set(key, { ...local, ...mu });
            }
          });
          this.data.employees = Array.from(empMap.values());
          this.save();
          return this.data.employees;
        }
      } catch (err) {
        console.warn('Mongo getEmployees fallback:', err.message);
      }
    }
    return this.data.employees;
  }

  async createEmployee(payload) {
    let newEmp = {
      _id: 'emp_' + Date.now(),
      employeeId: payload.employeeId || `EMP-0${this.data.employees.length + 1}`,
      status: 'Active',
      ...payload
    };

    if (mongoose.connection.readyState === 1) {
      try {
        const { _id, ...empData } = newEmp;
        const saved = await User.findOneAndUpdate(
          { email: newEmp.email },
          { $set: empData, $setOnInsert: { _id: newEmp._id } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        ).lean();
        if (saved) newEmp = { ...newEmp, ...saved };
      } catch (err) {
        console.error('Mongo sync error (create employee):', err.message);
      }
    }

    this.data.employees.push(newEmp);
    this.save();
    return newEmp;
  }

  async updateEmployee(id, payload) {
    let updatedEmp = null;

    if (mongoose.connection.readyState === 1) {
      try {
        const { _id, updatedAt, ...updateData } = payload;
        updatedEmp = await User.findOneAndUpdate(
          { $or: [{ _id: id }, { employeeId: id }] },
          { $set: { ...updateData, updatedAt: new Date() } },
          { new: true }
        ).lean();
      } catch (err) {
        console.error('Mongo sync error (update employee):', err.message);
      }
    }

    const index = this.data.employees.findIndex(e => e._id === id || e.employeeId === id);
    if (index !== -1) {
      this.data.employees[index] = {
        ...this.data.employees[index],
        ...payload,
        ...(updatedEmp || {})
      };
      this.save();
      return this.data.employees[index];
    } else if (updatedEmp) {
      this.data.employees.push(updatedEmp);
      this.save();
      return updatedEmp;
    }

    return null;
  }

  async deleteEmployee(id) {
    if (mongoose.connection.readyState === 1) {
      try {
        await User.findOneAndDelete({ $or: [{ _id: id }, { employeeId: id }] });
      } catch (err) {
        console.error('Mongo sync error (delete employee):', err.message);
      }
    }

    const index = this.data.employees.findIndex(e => e._id === id || e.employeeId === id);
    if (index !== -1) {
      this.data.employees.splice(index, 1);
      this.save();
      return true;
    }

    return true;
  }
}

export const store = new MemoryStore();
