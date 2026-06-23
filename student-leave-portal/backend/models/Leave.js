import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    default: 'Leave',
    required: true
  },
  duration: {
    type: String,
    enum: ['Full Day', 'Half Day'],
    default: 'Full Day',
    required: true
  },
  halfDaySession: {
    type: String,
    enum: ['Morning Session', 'Afternoon Session', ''], // Empty string allows it to be blank for Full Day leaves
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

// Pre-save hook to ensure data consistency before writing to MongoDB
leaveSchema.pre('save', function (next) {
  if (this.duration === 'Half Day') {
    // Force end date to match start date for half-day requests
    this.toDate = this.fromDate; 
  } else {
    // Clear out session strings if it's a full-day leave
    this.halfDaySession = ''; 
  }
  next();
});

const Leave = mongoose.model('Leave', leaveSchema);
export default Leave;