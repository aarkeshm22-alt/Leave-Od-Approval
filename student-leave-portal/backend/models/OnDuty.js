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
  duration: {
    type: String,
    enum: ['Full Day', 'Half Day'],
    default: 'Full Day',
    required: true
  },
  halfDaySession: {
    type: String,
    enum: ['Morning Session', 'Afternoon Session', ''], 
    default: ''
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

// Pre-save schema middleware validation layer
OnDutySchema.pre('save', function () {
  if (this.duration === 'Half Day') {
    this.toDate = this.fromDate;
  } else {
    this.halfDaySession = '';
  }
});

// 🌟 FIX: Force Mongoose to query your explicit database collection name 'on-duties'
const OnDuty = mongoose.models.OnDuty || mongoose.model('OnDuty', OnDutySchema, 'on-duties');
export default OnDuty;