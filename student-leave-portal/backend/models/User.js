// backend/models/User.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    role: {
        type: String,
        required: true,
        enum: ['Student', 'Mentor', 'HOD']
    },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    gender: { type: String, required: true },
    department: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobileNo: { type: String, required: true },
    password: { type: String, required: true },

    registerNo: {
        type: String,
        required: function () { return this.role === 'Student'; },
        sparse: true,
        unique: true,
        trim: true
    },

    // Student Specific Fields
    year: { type: String, required: function () { return this.role === 'Student'; } },
    section: { type: String, required: function () { return this.role === 'Student'; } },
    studentType: { type: String, required: function () { return this.role === 'Student'; } },
    firstmentorName: { type: String, required: function () { return this.role === 'Student'; } },
    secondmentorName: { type: String, required: function () { return this.role === 'Student'; } },
    
    // Mentor Specific Fields
    hodName: { type: String, required: function () { return this.role === 'Mentor'; } },
    
    /* 🚀 CRUCIAL BACKEND FIX: Ensure this exact structural block is inside your UserSchema */
    category: {
        type: String,
        enum: ['CA1', 'CA2'],
        required: function () { return this.role === 'Mentor'; }
    },

    // ✅ Reset Password Fields
    resetToken: {
        type: String,
        default: null
    },
    resetTokenExpiry: {
        type: Date,
        default: null
    }
}, { timestamps: true });

// Avoid model recompilation errors during hot reloads
export default mongoose.models.User || mongoose.model('User', UserSchema);