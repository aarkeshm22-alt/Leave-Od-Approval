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
    enum: ['Morning Session', 'Afternoon Session', ''], // Empty string allows it to remain blank for Full Day ODs
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
  // Document proof remains null initially until form registration unlocks it
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
    // Force ending boundary parameters to match starting values for single-shift OD tracking
    this.toDate = this.fromDate;
  } else {
    // Sanitize session tracking if duration represents a full daytime window
    this.halfDaySession = '';
  }
});

export default mongoose.model('OnDuty', OnDutySchema);