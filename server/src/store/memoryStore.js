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

// Initial seed data with clear settings, 1 employee, 1 customer, 1 invoice, and catalog items
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
      currentSequence: 3,
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

// Hybrid high-speed memory store with automatic MongoDB Atlas cloud persistence
class MemoryStore {
  constructor() {
    this.data = null;
    this.isMongoSynced = false;
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

  // Synchronize memory cache with MongoDB Atlas database
  async syncWithMongo() {
    if (mongoose.connection.readyState !== 1) return;

    try {
      console.log('🔄 Synchronizing data with MongoDB Atlas cloud database...');

      const [mongoCustomers, mongoInvoices, mongoServices, mongoSettings, mongoUsers] = await Promise.all([
        Customer.find().lean().catch(() => []),
        Invoice.find().lean().catch(() => []),
        Service.find().lean().catch(() => []),
        CompanySettings.findOne().lean().catch(() => null),
        User.find().lean().catch(() => [])
      ]);

      const hasCloudData = (mongoCustomers && mongoCustomers.length > 0) ||
                           (mongoInvoices && mongoInvoices.length > 0) ||
                           (mongoServices && mongoServices.length > 0);

      if (hasCloudData) {
        // Cloud has existing records — load them into memory cache
        if (mongoCustomers && mongoCustomers.length > 0) {
          this.data.customers = mongoCustomers;
        }
        if (mongoInvoices && mongoInvoices.length > 0) {
          this.data.invoices = mongoInvoices;
        }
        if (mongoServices && mongoServices.length > 0) {
          this.data.services = mongoServices;
        }
        if (mongoSettings) {
          this.data.companySettings = {
            ...this.data.companySettings,
            ...mongoSettings
          };
        }
        if (mongoUsers && mongoUsers.length > 0) {
          this.data.employees = mongoUsers;
        }

        this.save();
        this.isMongoSynced = true;
        console.log(`✓ Loaded ${this.data.customers.length} customers and ${this.data.invoices.length} invoices from MongoDB Atlas.`);
      } else {
        // MongoDB is clean/empty — seed it with current data so nothing is lost
        console.log('ℹ Cloud database is empty. Initializing MongoDB Atlas with local records...');

        if (this.data.customers && this.data.customers.length > 0) {
          for (const c of this.data.customers) {
            await Customer.findOneAndUpdate({ customerId: c.customerId }, c, { upsert: true });
          }
        }
        if (this.data.invoices && this.data.invoices.length > 0) {
          for (const inv of this.data.invoices) {
            await Invoice.findOneAndUpdate({ invoiceNumber: inv.invoiceNumber }, inv, { upsert: true });
          }
        }
        if (this.data.services && this.data.services.length > 0) {
          for (const s of this.data.services) {
            await Service.findOneAndUpdate({ serviceCode: s.serviceCode }, s, { upsert: true });
          }
        }
        if (this.data.companySettings) {
          await CompanySettings.findOneAndUpdate({}, this.data.companySettings, { upsert: true });
        }
        if (this.data.employees && this.data.employees.length > 0) {
          for (const emp of this.data.employees) {
            await User.findOneAndUpdate({ email: emp.email }, emp, { upsert: true });
          }
        }

        this.isMongoSynced = true;
        console.log('✓ Successfully seeded MongoDB Atlas cloud database.');
      }
    } catch (err) {
      console.error('! Error during MongoDB sync:', err.message);
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

    // Persist to MongoDB
    if (mongoose.connection.readyState === 1) {
      CompanySettings.findOneAndUpdate({}, this.data.companySettings, { upsert: true })
        .catch(err => console.error('Mongo sync error (settings):', err.message));
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

  createInvoice(payload) {
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
      this.updateSettings(settings);
    }

    this.data.invoices.unshift(newInvoice);
    this.save();

    // Persist to MongoDB
    if (mongoose.connection.readyState === 1) {
      Invoice.findOneAndUpdate({ invoiceNumber: newInvoice.invoiceNumber }, newInvoice, { upsert: true })
        .catch(err => console.error('Mongo sync error (create invoice):', err.message));
    }

    return newInvoice;
  }

  updateInvoice(id, updatePayload) {
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
      Invoice.findOneAndUpdate({ $or: [{ _id: id }, { invoiceNumber: id }] }, this.data.invoices[index], { new: true })
        .catch(err => console.error('Mongo sync error (update invoice):', err.message));
    }

    return this.data.invoices[index];
  }

  deleteInvoice(id) {
    const index = this.data.invoices.findIndex(inv => inv._id === id || inv.invoiceNumber === id);
    if (index === -1) return false;
    const deleted = this.data.invoices.splice(index, 1)[0];
    this.save();

    // Persist to MongoDB
    if (mongoose.connection.readyState === 1) {
      Invoice.findOneAndDelete({ $or: [{ _id: id }, { invoiceNumber: id }] })
        .catch(err => console.error('Mongo sync error (delete invoice):', err.message));
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

    // Persist to MongoDB
    if (mongoose.connection.readyState === 1) {
      Customer.findOneAndUpdate({ customerId: newCust.customerId }, newCust, { upsert: true })
        .catch(err => console.error('Mongo sync error (create customer):', err.message));
    }

    return newCust;
  }

  updateCustomer(id, payload) {
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
      Customer.findOneAndUpdate({ $or: [{ _id: id }, { customerId: id }] }, this.data.customers[index], { new: true })
        .catch(err => console.error('Mongo sync error (update customer):', err.message));
    }

    return this.data.customers[index];
  }

  deleteCustomer(id) {
    const index = this.data.customers.findIndex(c => c._id === id || c.customerId === id);
    if (index === -1) return false;
    this.data.customers.splice(index, 1);
    this.save();

    // Persist to MongoDB
    if (mongoose.connection.readyState === 1) {
      Customer.findOneAndDelete({ $or: [{ _id: id }, { customerId: id }] })
        .catch(err => console.error('Mongo sync error (delete customer):', err.message));
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

    // Persist to MongoDB
    if (mongoose.connection.readyState === 1) {
      Service.findOneAndUpdate({ serviceCode: newService.serviceCode }, newService, { upsert: true })
        .catch(err => console.error('Mongo sync error (create service):', err.message));
    }

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

      if (mongoose.connection.readyState === 1) {
        Service.findOneAndUpdate({ serviceCode: newService.serviceCode }, newService, { upsert: true })
          .catch(err => console.error('Mongo sync error (create services):', err.message));
      }
    }
    this.save();
    return createdList;
  }

  updateService(id, payload) {
    const index = this.data.services.findIndex(s => s._id === id || s.serviceCode === id);
    if (index === -1) return null;
    this.data.services[index] = {
      ...this.data.services[index],
      ...payload,
      updatedAt: new Date().toISOString()
    };
    this.save();

    // Persist to MongoDB
    if (mongoose.connection.readyState === 1) {
      Service.findOneAndUpdate({ $or: [{ _id: id }, { serviceCode: id }] }, this.data.services[index], { new: true })
        .catch(err => console.error('Mongo sync error (update service):', err.message));
    }

    return this.data.services[index];
  }

  deleteService(id) {
    const index = this.data.services.findIndex(s => s._id === id || s.serviceCode === id);
    if (index === -1) return false;
    this.data.services.splice(index, 1);
    this.save();

    // Persist to MongoDB
    if (mongoose.connection.readyState === 1) {
      Service.findOneAndDelete({ $or: [{ _id: id }, { serviceCode: id }] })
        .catch(err => console.error('Mongo sync error (delete service):', err.message));
    }

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

    if (mongoose.connection.readyState === 1) {
      User.findOneAndUpdate({ email: newEmp.email }, newEmp, { upsert: true })
        .catch(err => console.error('Mongo sync error (create employee):', err.message));
    }

    return newEmp;
  }

  updateEmployee(id, payload) {
    const index = this.data.employees.findIndex(e => e._id === id || e.employeeId === id);
    if (index === -1) return null;
    this.data.employees[index] = { ...this.data.employees[index], ...payload };
    this.save();

    if (mongoose.connection.readyState === 1) {
      User.findOneAndUpdate({ $or: [{ _id: id }, { employeeId: id }] }, this.data.employees[index], { new: true })
        .catch(err => console.error('Mongo sync error (update employee):', err.message));
    }

    return this.data.employees[index];
  }

  deleteEmployee(id) {
    const index = this.data.employees.findIndex(e => e._id === id || e.employeeId === id);
    if (index === -1) return false;
    this.data.employees.splice(index, 1);
    this.save();

    if (mongoose.connection.readyState === 1) {
      User.findOneAndDelete({ $or: [{ _id: id }, { employeeId: id }] })
        .catch(err => console.error('Mongo sync error (delete employee):', err.message));
    }

    return true;
  }
}

export const store = new MemoryStore();
