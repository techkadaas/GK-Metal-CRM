import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  _id: { type: String },
  employeeId: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    sparse: true,
    trim: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['Admin', 'Manager', 'Billing Employee', 'Viewer'],
    default: 'Billing Employee'
  },
  department: {
    type: String,
    default: 'Accounts & Billing'
  },
  phone: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Suspended'],
    default: 'Active'
  },
  allowedPages: {
    type: [String],
    default: ['dashboard', 'invoices', 'customers', 'services', 'reports']
  },
  avatar: {
    type: String,
    default: ''
  }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
