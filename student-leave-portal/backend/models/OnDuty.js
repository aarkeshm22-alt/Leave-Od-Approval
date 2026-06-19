import mongoose from 'mongoose';

const OnDutySchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    default: 'On-Duty'
  },
  fromDate: {
    type: Date,
    required: true
  },
  toDate: {
    type: Date,
    required: true
  },
  collegeName: {
    type: String,
    required: true
  },
  collegeLocation: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  // Document proof remains null initially until form status sets to 'Approved'
  document: {
    type: String, 
    default: null
  },
  status: {
    type: String,
    enum: ['Pending', 'Partially Approved', 'Approved', 'Rejected'],
    default: 'Pending'
  }
}, { timestamps: true });

export default mongoose.model('OnDuty', OnDutySchema);