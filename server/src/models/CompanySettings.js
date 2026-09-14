import mongoose from 'mongoose';

const companySettingsSchema = new mongoose.Schema({
  _id: { type: String, default: 'settings_default' },
  companyName: {
    type: String,
    required: true,
    default: 'GK METAL TESTING LAB'
  },
  tagline: {
    type: String,
    default: 'Govt. Approved & NABL Accredited Material Testing Laboratory'
  },
  logo: {
    type: String,
    default: ''
  },
  address: {
    street: { type: String, default: 'Plot No. 48/B, Phase-II, Industrial Estate, Ambattur' },
    city: { type: String, default: 'Chennai' },
    state: { type: String, default: 'Tamil Nadu' },
    stateCode: { type: String, default: '33' },
    pincode: { type: String, default: '600058' }
  },
  phone: { type: String, default: '+91 94440 12345 / 044-2688 9900' },
  email: { type: String, default: 'testing@gkmetallab.com' },
  website: { type: String, default: 'www.gkmetallab.com' },
  gstin: { type: String, default: '33AAACG1234F1Z8' },
  pan: { type: String, default: 'AAACG1234F' },
  cin: { type: String, default: 'U74999TN2018PTC123456' },
  nablAccreditationNo: { type: String, default: 'TC-7890 (ISO/IEC 17025:2017)' },
  
  // Banking Details
  bankDetails: {
    bankName: { type: String, default: 'HDFC BANK LTD' },
    accountName: { type: String, default: 'GK METAL TESTING LAB' },
    accountNumber: { type: String, default: '50200034891278' },
    branch: { type: String, default: 'Ambattur Industrial Estate Branch' },
    ifscCode: { type: String, default: 'HDFC0001234' },
    accountType: { type: String, default: 'Current Account' },
    upiId: { type: String, default: 'gkmetallab@hdfcbank' }
  },

  // Invoice Configurations
  invoiceConfig: {
    prefix: { type: String, default: 'GK/INV/' },
    financialYear: { type: String, default: '26-27' },
    startingNumber: { type: Number, default: 66 },
    currentSequence: { type: Number, default: 66 },
    defaultPaymentTerms: { type: String, default: '30 Days Net from date of Invoice' },
    defaultNotes: { type: String, default: '1. Test reports will be handed over on full settlement of invoice.\n2. Interest @ 18% p.a. will be charged on overdue payments.' },
    declaration: { type: String, default: 'We declare that this invoice shows the actual price of the services described and that all particulars are true and correct.' },
    authorizedSignatoryName: { type: String, default: 'Authorized Signatory' },
    signatoryTitle: { type: String, default: 'For GK METAL TESTING LAB' },
    signatureImageUrl: { type: String, default: '' }
  },

  // Tax Configuration
  taxConfig: {
    defaultCgstRate: { type: Number, default: 9 },
    defaultSgstRate: { type: Number, default: 9 },
    defaultIgstRate: { type: Number, default: 18 },
    hsnSacDefault: { type: String, default: '998346' }, // Testing and analysis services
    enableRoundOff: { type: Boolean, default: true }
  }
}, { timestamps: true });

export const CompanySettings = mongoose.model('CompanySettings', companySettingsSchema);
