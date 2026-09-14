import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  _id: { type: String },
  customerId: {
    type: String,
    required: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  contactPerson: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    trim: true,
    default: ''
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  gstin: {
    type: String,
    trim: true,
    uppercase: true,
    default: ''
  },
  pan: {
    type: String,
    trim: true,
    uppercase: true,
    default: ''
  },
  // Billing Address
  billingAddress: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: 'Tamil Nadu' },
    stateCode: { type: String, default: '33' },
    pincode: { type: String, default: '' }
  },
  // Shipping / Consignee Address
  shippingAddress: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    stateCode: { type: String, default: '' },
    pincode: { type: String, default: '' }
  },
  paymentTerms: {
    type: String,
    default: '30 Days Net'
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  // Aggregated Stats
  stats: {
    totalInvoices: { type: Number, default: 0 },
    totalBilled: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    outstandingBalance: { type: Number, default: 0 },
    lastInvoiceDate: { type: Date }
  }
}, { timestamps: true });

export const Customer = mongoose.model('Customer', customerSchema);
