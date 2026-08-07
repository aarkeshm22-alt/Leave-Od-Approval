import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    studentYear: {
      type: String,
      required: true,
      enum: ['I', 'II', 'III', 'IV'],
    },
    studentSection: {
      type: String,
      default: '',
    },
    studentDepartment: {
      type: String,
      default: '',
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    isAnonymous: {
      type: Boolean,
      default: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isReplied: {
      type: Boolean,
      default: false,
    },
    reply: {
      type: String,
      default: null,
    },
    repliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    repliedAt: {
      type: Date,
      default: null,
    },
    category: {
      type: String,
      enum: ['academic', 'administrative', 'faculty', 'infrastructure', 'general', 'other'],
      default: 'general',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'resolved', 'closed'],
      default: 'pending',
    },
    attachments: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
chatSchema.index({ student: 1, createdAt: -1 });
chatSchema.index({ studentYear: 1, status: 1 });
chatSchema.index({ isRead: 1, createdAt: -1 });

const Chat = mongoose.model('Chat', chatSchema);
export default Chat;