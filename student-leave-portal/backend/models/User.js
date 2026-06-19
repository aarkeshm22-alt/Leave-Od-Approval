// models/User.js
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

    // backend/models/User.js

    registerNo: {
        type: String,
        // CRUCIAL: It must be a function returning a boolean, NOT true
        required: function () { return this.role === 'Student'; },
        sparse: true,
        unique: true,
        trim: true
    },

    // Student Specific Fields
    year: { type: String, required: function () { return this.role === 'Student'; } },
    section: { type: String, required: function () { return this.role === 'Student'; } },
    studentType: { type: String, required: function () { return this.role === 'Student'; } },
    mentorName: {
        type: String, // Changed from ObjectId to String format
        required: function () { return this.role === 'Student'; }
    },

    // Mentor Specific Fields
    hodName: {
        type: String, // Changed from ObjectId to String format
        required: function () { return this.role === 'Mentor'; }
    }
}, { timestamps: true });

export default mongoose.model('User', UserSchema);