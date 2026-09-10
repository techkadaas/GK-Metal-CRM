import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true
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
    required: true
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
  avatar: {
    type: String,
    default: ''
  }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
