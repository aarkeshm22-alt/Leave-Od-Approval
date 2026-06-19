import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['Leave', 'On-Duty', 'OD'], // Enforces valid database writes
    default: 'Leave',
    required: true
  },
  fromDate: {
    type: Date,
    required: true
  },
  toDate: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Partially Approved', 'Approved', 'Rejected'],
    default: 'Pending'
  }
}, { timestamps: true });

const Leave = mongoose.model('Leave', leaveSchema);
export default Leave;