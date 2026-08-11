import User from '../models/User.js';
import Leave from '../models/Leave.js';
import OnDuty from '../models/OnDuty.js';
import mongoose from 'mongoose';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../config/email.js';   // <-- NEW IMPORT

// ============================================
// 1. FETCH HODs
// ============================================
export const getHods = async (req, res) => {
    try {
        const hods = await User.find({ role: 'HOD' }).select('_id firstName lastName department');
        return res.status(200).json(hods);
    } catch (error) {
        return res.status(500).json({ message: 'Server error pulling HOD database records.' });
    }
};

// ============================================
// 2. FETCH MENTORS
// ============================================
export const getAllMentors = async (req, res) => {
    try {
        const mentors = await User.find({ role: 'Mentor' }).select('_id firstName lastName department email mobileNo role category');
        return res.status(200).json({
            success: true,
            data: mentors
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Server error pulling Mentor database records.'
        });
    }
};

// ============================================
// 3. GET STUDENT PROFILE
// ============================================
export const getStudentProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ============================================
// 4. REGISTER USER
// ============================================
export const registerUser = async (req, res) => {
    try {
        const {
            role, firstName, lastName, gender, department,
            email, mobileNo, password, year, section, studentType,
            firstmentorName, secondmentorName, hodName, category,
            registerNo
        } = req.body;

        const userExists = await User.findOne({ email: email.toLowerCase().trim() });
        if (userExists) {
            return res.status(400).json({ message: 'This email address is already registered.' });
        }

        if (role === 'Student' && registerNo) {
            const regNoExists = await User.findOne({ registerNo: registerNo.trim() });
            if (regNoExists) {
                return res.status(400).json({ message: `Conflict: Register Number "${registerNo}" is already assigned to an existing student account.` });
            }
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUserPayload = {
            role, firstName, lastName, gender, department,
            email: email.toLowerCase().trim(),
            mobileNo,
            password: hashedPassword,
            ...(role === 'Student' && { registerNo: registerNo?.trim(), year, section, studentType, firstmentorName, secondmentorName }),
            ...(role === 'Mentor' && { hodName, category })
        };

        const newUser = new User(newUserPayload);
        await newUser.save();

        return res.status(201).json({ message: 'User profile created successfully!' });
    } catch (error) {
        console.error("Detailed DB Save Error:", error);

        if (error.code === 11000) {
            const duplicateField = Object.keys(error.keyValue)[0];
            return res.status(400).json({ message: `The provided ${duplicateField} is already registered on our servers.` });
        }

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: `Validation Failed: ${messages.join(', ')}` });
        }

        return res.status(500).json({ message: 'Registration failure. Validate payload constraints.' });
    }
};

// ============================================
// 5. LOGIN USER
// ============================================
export const loginUser = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({ message: 'Please provide email, password, and role.' });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(401).json({ message: 'Invalid institutional credentials.' });
        }

        if (user.role.toLowerCase() !== role.toLowerCase()) {
            return res.status(403).json({
                message: `Access denied. Your profile is registered as a ${user.role}, not an ${role}.`
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid institutional credentials.' });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'fallback_super_secret_key_change_this',
            { expiresIn: '1d' }
        );

        const userResponse = {
            _id: user._id,
            name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            email: user.email,
            role: user.role,
            department: user.department,
            studentType: user.studentType || 'Regular Track',
            mobile: user.mobileNo || 'Not Provided',
            ...(user.role === 'Mentor' && { category: user.category }),
            ...(user.role === 'Student' && { registerNo: user.registerNo, year: user.year, section: user.section })
        };

        return res.status(200).json({
            message: 'Session authenticated successfully.',
            token,
            user: userResponse
        });
    } catch (error) {
        console.error('Core Login Pipeline Exception:', error);
        return res.status(500).json({ message: 'Internal server authorization loop failure.' });
    }
};

// ============================================
// 6. GET MENTORS BY HOD
// ============================================
export const getMentorsByHod = async (req, res) => {
    try {
        const currentHodName = `${req.user?.firstName || ''} ${req.user?.lastName || ''}`.trim() || req.user?.name;

        if (!currentHodName) {
            return res.status(400).json({
                success: false,
                message: 'Authentication token is missing valid HOD name attributes.'
            });
        }

        const rawUserCollection = mongoose.connection.db.collection('users');
        const escapedHodName = currentHodName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const hodRegex = new RegExp(escapedHodName, 'i');

        const mentors = await rawUserCollection.find({
            role: 'Mentor',
            hodName: hodRegex
        }).toArray();

        if (!mentors || mentors.length === 0) {
            return res.status(200).json({
                success: true,
                data: []
            });
        }

        const synchronizedMentors = await Promise.all(
            mentors.map(async (mentor) => {
                const mentorFullName = mentor.name || `${mentor.firstName || ''} ${mentor.lastName || ''}`.trim();
                const mentorCategory = mentor.category;

                const escapedMentorName = mentorFullName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                const mentorRegexRule = new RegExp(`^${escapedMentorName}$`, 'i');
                const fallbackLooseRegexRule = new RegExp(escapedMentorName, 'i');

                let studentCountQuery = { role: 'Student' };

                if (mentorCategory === 'CA1') {
                    studentCountQuery.firstmentorName = mentorRegexRule;
                } else if (mentorCategory === 'CA2') {
                    studentCountQuery.secondmentorName = mentorRegexRule;
                } else {
                    studentCountQuery.$or = [
                        { firstmentorName: mentorRegexRule },
                        { secondmentorName: mentorRegexRule }
                    ];
                }

                let realStudentCount = await rawUserCollection.countDocuments(studentCountQuery);

                if (realStudentCount === 0) {
                    if (mentorCategory === 'CA1') {
                        studentCountQuery.firstmentorName = fallbackLooseRegexRule;
                    } else if (mentorCategory === 'CA2') {
                        studentCountQuery.secondmentorName = fallbackLooseRegexRule;
                    } else {
                        studentCountQuery.$or = [
                            { firstmentorName: fallbackLooseRegexRule },
                            { secondmentorName: fallbackLooseRegexRule }
                        ];
                    }
                    realStudentCount = await rawUserCollection.countDocuments(studentCountQuery);
                }

                return {
                    ...mentor,
                    _id: mentor._id.toString(),
                    capacity: realStudentCount
                };
            })
        );

        return res.status(200).json({
            success: true,
            data: synchronizedMentors
        });
    } catch (error) {
        console.error('Error calculating dynamic mentor allocation statistics:', error);
        return res.status(500).json({
            success: false,
            message: 'Server failed aggregating real-time allocation records.',
            error: error.message
        });
    }
};

// ============================================
// 7. GET STUDENTS BY MENTOR
// ============================================
export const getStudentsByMentor = async (req, res) => {
    try {
        const { mentorName, category } = req.query;

        let query = { role: 'Student' };
        if (mentorName && mentorName.trim() !== '') {
            const cleanName = mentorName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const caseInsensitiveRegex = new RegExp(`^${cleanName}$`, 'i');
            const mentorFields = category === 'CA1' ? ['firstmentorName'] :
                category === 'CA2' ? ['secondmentorName'] :
                    ['firstmentorName', 'secondmentorName'];
            query.$or = mentorFields.map(field => ({ [field]: { $regex: caseInsensitiveRegex } }));
        }

        const students = await User.find(query)
            .select('firstName lastName name year section registerNo studentType mobileNo email firstmentorName secondmentorName')
            .lean();

        const enrichedStudents = await Promise.all(students.map(async (student) => {
            const leaveCount = await Leave.countDocuments({
                student: student._id,
                type: 'Leave',
                status: 'Approved'
            });

            const odCount = await OnDuty.countDocuments({
                student: student._id,
                type: { $in: ['On-Duty', 'OD'] },
                status: 'Approved'
            });

            const ods = await OnDuty.find({
                student: student._id,
                type: { $in: ['On-Duty', 'OD'] }
            })
                .select('certificate reason fromDate toDate status duration halfDaySession')
                .sort({ createdAt: -1 })
                .lean();

            const latestCert = ods.length > 0 ? ods[0].certificate : null;

            return {
                ...student,
                name: student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim(),
                leaveCount,
                odCount,
                ods,
                certificate: latestCert || 'No certificate available'
            };
        }));

        res.status(200).json({ success: true, data: enrichedStudents });
    } catch (error) {
        console.error('Error in getStudentsByMentor:', error);
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
};

// ============================================
// 8. FORGOT PASSWORD - SEND OTP (UPDATED)
// ============================================
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        console.log('📧 Forgot password request for:', email);

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email address'
            });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No account found with this email'
            });
        }

        // ✅ Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = Date.now() + 600000;

        user.resetToken = otp;
        user.resetTokenExpiry = new Date(otpExpiry);
        await user.save();

        console.log('✅ OTP generated for:', email);
        console.log('🔑 OTP:', otp);

        // ✅ Send OTP via Brevo SMTP
        const result = await sendOTPEmail(user, otp);

        if (!result.success) {
            console.error('❌ Email sending failed:', result.error);
            return res.status(500).json({
                success: false,
                message: 'Failed to send OTP email: ' + result.error
            });
        }

        console.log('✅ Email sent to:', user.email);

        res.status(200).json({
            success: true,
            message: 'OTP sent to your email successfully',
            email: user.email,
            otp: otp
        });
    } catch (error) {
        console.error('❌ Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: ' + error.message
        });
    }
};

// ============================================
// RESEND OTP
// ============================================
export const resendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email address'
            });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No account found with this email'
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = Date.now() + 600000;

        user.resetToken = otp;
        user.resetTokenExpiry = new Date(otpExpiry);
        await user.save();

        const result = await sendOTPEmail(user, otp);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to send OTP email: ' + result.error
            });
        }

        res.status(200).json({
            success: true,
            message: 'New OTP sent to your email successfully',
            email: user.email
        });
    } catch (error) {
        console.error('❌ Resend OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: ' + error.message
        });
    }
};

// ============================================
// VERIFY OTP AND RESET PASSWORD
// ============================================
export const verifyOTP = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        console.log('🔑 Verify OTP request for:', email);

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Email and OTP are required'
            });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!user.resetToken) {
            return res.status(400).json({
                success: false,
                message: 'No OTP found. Please request a new one.'
            });
        }

        if (user.resetToken !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP'
            });
        }

        if (new Date(user.resetTokenExpiry) < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'OTP has expired. Please request a new one.'
            });
        }

        if (!newPassword) {
            return res.status(200).json({
                success: true,
                message: 'OTP verified successfully!'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        user.resetToken = null;
        user.resetTokenExpiry = null;
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Password reset successfully!'
        });
    } catch (error) {
        console.error('❌ Verify OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: ' + error.message
        });
    }
};