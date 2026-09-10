import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema({
  slNo: { type: Number, required: true },
  serviceId: { type: String },
  description: { type: String, required: true },
  hsnSac: { type: String, required: true, default: '998346' },
  quantity: { type: Number, required: true, min: 0 },
  rate: { type: Number, required: true, min: 0 },
  per: { type: String, default: 'No.' },
  discountPercent: { type: Number, default: 0 },
  taxableAmount: { type: Number, required: true }
}, { _id: false });

const paymentRecordSchema = new mongoose.Schema({
  paymentDate: { type: Date, default: Date.now },
  amount: { type: Number, required: true },
  mode: { type: String, enum: ['NEFT', 'RTGS', 'IMPS', 'Cheque', 'UPI', 'Cash'], default: 'NEFT' },
  referenceNo: { type: String, default: '' },
  bankName: { type: String, default: '' },
  notes: { type: String, default: '' },
  recordedBy: { type: String, default: 'Accounts' }
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  financialYear: {
    type: String,
    required: true,
    default: '26-27'
  },
  sequenceNumber: {
    type: Number,
    required: true
  },
  invoiceDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Draft', 'Generated', 'Sent', 'Pending Payment', 'Partially Paid', 'Paid', 'Cancelled'],
    default: 'Generated'
  },
  paymentStatus: {
    type: String,
    enum: ['Unpaid', 'Partially Paid', 'Paid'],
    default: 'Unpaid'
  },

  // References & Logistics Metadata
  metadata: {
    deliveryNote: { type: String, default: '' },
    modeOfPayment: { type: String, default: '30 Days Net' },
    supplierRef: { type: String, default: '' },
    otherRef: { type: String, default: '' },
    buyerOrderNo: { type: String, default: '' },
    orderDate: { type: String, default: '' },
    despatchedThrough: { type: String, default: 'Hand Delivery / Courier' },
    destination: { type: String, default: '' },
    termsOfDelivery: { type: String, default: 'Ex-Works / Lab Premises' },
    sampleBatchRef: { type: String, default: '' },
    testReportRef: { type: String, default: '' }
  },

  // Customer Reference & Immutable Snapshot
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  buyerSnapshot: {
    companyName: { type: String, required: true },
    contactPerson: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    gstin: { type: String, default: '' },
    pan: { type: String, default: '' },
    billingAddress: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: 'Tamil Nadu' },
      stateCode: { type: String, default: '33' },
      pincode: { type: String, default: '' }
    },
    shippingAddress: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      stateCode: { type: String, default: '' },
      pincode: { type: String, default: '' }
    }
  },

  // Company Info Snapshot
  companySnapshot: {
    companyName: { type: String, default: 'GK METAL TESTING LAB' },
    address: { type: Object },
    phone: { type: String },
    email: { type: String },
    gstin: { type: String },
    pan: { type: String },
    bankDetails: { type: Object },
    nablAccreditationNo: { type: String }
  },

  // Line items
  items: [invoiceItemSchema],

  // Financial calculations
  subtotal: { type: Number, required: true, default: 0 },
  discountTotal: { type: Number, default: 0 },
  taxableTotal: { type: Number, required: true, default: 0 },
  
  // Tax details
  isInterstate: { type: Boolean, default: false },
  cgstRate: { type: Number, default: 9 },
  cgstAmount: { type: Number, default: 0 },
  sgstRate: { type: Number, default: 9 },
  sgstAmount: { type: Number, default: 0 },
  igstRate: { type: Number, default: 0 },
  igstAmount: { type: Number, default: 0 },
  totalTax: { type: Number, default: 0 },

  // Round off and Final
  roundOff: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true, default: 0 },
  amountInWords: { type: String, required: true },

  // Payments & balances
  paidAmount: { type: Number, default: 0 },
  balanceDue: { type: Number, default: 0 },
  payments: [paymentRecordSchema],

  // Notes & declarations
  notes: { type: String, default: '' },
  declaration: { type: String, default: '' },

  // System & Audit
  createdBy: { type: String, default: 'Admin User' },
  updatedBy: { type: String, default: 'Admin User' }
}, { timestamps: true });

export const Invoice = mongoose.model('Invoice', invoiceSchema);
