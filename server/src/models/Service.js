import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  _id: { type: String },
  serviceCode: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  hsnSac: {
    type: String,
    required: true,
    default: '998346' // Technical testing and analysis services
  },
  defaultRate: {
    type: Number,
    required: true,
    default: 0
  },
  unit: {
    type: String,
    required: true,
    default: 'No.' // No., Per Sample, Per Joint, Per Meter, Per Hour, Per Lot
  },
  category: {
    type: String,
    enum: ['Chemical', 'Mechanical', 'NDT', 'Metallography', 'Corrosion', 'Other'],
    default: 'NDT'
  },
  taxRate: {
    type: Number,
    default: 18 // Standard GST 18%
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

export const Service = mongoose.model('Service', serviceSchema);
