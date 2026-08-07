import express from 'express';
import {
    getHods,
    getMentorsByHod,
    registerUser,
    loginUser,
    getStudentsByMentor,
    getStudentProfile,
    getAllMentors,
    forgotPassword,
    verifyOTP,
    resendOTP
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import Leave from '../models/Leave.js';
import OnDuty from '../models/OnDuty.js';

const router = express.Router();

// ==========================================
// ✅ PUBLIC ROUTES (No authentication required)
// ==========================================

// Dropdown routes
router.get('/users/hods', getHods);
router.get('/users/mentors', getAllMentors);

// ✅ Authentication routes
router.post('/auth/register', registerUser);
router.post('/auth/login', loginUser);
 
// ✅ Forgot Password routes - THESE ARE THE ONES WE NEED
router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/verify-otp', verifyOTP);
router.post('/auth/resend-otp', resendOTP);

// ==========================================
// ✅ PROTECTED ROUTES (Authentication required)
// ==========================================

router.get('/users/mentors-by-hod', protect, getMentorsByHod);
router.get('/users/students', protect, getStudentProfile);
router.get('/users/students-by-mentor', protect, getStudentsByMentor);

// ==========================================
// ✅ USER PROFILE ROUTES
// ==========================================
router.route('/users/profile')
    .get(protect, async (req, res) => {
        try {
            const user = await User.findById(req.user.id);

            if (!user) {
                return res.status(404).json({ message: 'User registry profile not found.' });
            }

            // Initialize default counters
            let totalLeavesCount = 0;
            let totalODCount = 0;
            let pendingCount = 0;
            let approvedCount = 0;
            let assignedStudentsCount = 0;

            // Recent applications (only for student role)
            let recentLeaves = [];
            let recentODs = [];

            const userRole = user.role?.toUpperCase() || 'STUDENT';
            const userFullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();

            try {
                // ==========================================
                // 🌟 CASE 1: LOGGED‑IN NODE IS A MENTOR
                // ==========================================
                if (userRole === 'MENTOR') {
                    const escapedMentorName = userFullName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                    const mentorRegexRule = new RegExp(`^${escapedMentorName}$`, 'i');

                    const assignedStudents = await User.find({
                        role: 'Student',
                        $or: [
                            { firstmentorName: mentorRegexRule },
                            { secondmentorName: mentorRegexRule }
                        ]
                    }).select('_id');

                    assignedStudentsCount = assignedStudents ? assignedStudents.length : 0;

                    if (assignedStudentsCount > 0) {
                        const studentIds = assignedStudents.map(s => s._id);

                        // Leave counts
                        const pendingLeaves = await Leave.countDocuments({
                            student: { $in: studentIds },
                            status: { $regex: /pending/i }
                        });
                        const approvedLeaves = await Leave.countDocuments({
                            student: { $in: studentIds },
                            status: { $regex: /approved/i }
                        });
                        pendingCount += pendingLeaves;
                        approvedCount += approvedLeaves;
                        totalLeavesCount = approvedLeaves;

                        // OD counts
                        const OdModel = mongoose.models.OnDuty || mongoose.models.Leave || global.OnDuty;
                        if (OdModel) {
                            const pendingOD = await OdModel.countDocuments({
                                student: { $in: studentIds },
                                status: { $regex: /pending/i },
                                ...(OdModel.modelName === 'Leave' && { type: { $regex: /od/i } })
                            });
                            const approvedOD = await OdModel.countDocuments({
                                student: { $in: studentIds },
                                status: { $regex: /approved/i },
                                ...(OdModel.modelName === 'Leave' && { type: { $regex: /od/i } })
                            });
                            pendingCount += pendingOD;
                            approvedCount += approvedOD;
                            totalODCount = approvedOD;
                        }
                    }
                }

                // ==========================================
                // 🌟 CASE 2: LOGGED‑IN NODE IS A STUDENT
                // ==========================================
                else if (userRole !== 'HOD') {
                    // --- Leave counts ---
                    if (Leave) {
                        totalLeavesCount = await Leave.countDocuments({
                            student: req.user.id,
                            status: { $regex: /approved/i },
                            ...(Leave.schema.paths.type && { type: { $regex: /leave/i } })
                        });
                        const pendingLeaves = await Leave.countDocuments({
                            student: req.user.id,
                            status: { $regex: /pending/i },
                            ...(Leave.schema.paths.type && { type: { $regex: /leave/i } })
                        });
                        pendingCount += pendingLeaves;
                        approvedCount += totalLeavesCount;

                        // --- Fetch recent 5 leave applications ---
                        recentLeaves = await Leave.find({
                            student: req.user.id,
                            ...(Leave.schema.paths.type && { type: { $regex: /leave/i } })
                        })
                            .sort({ createdAt: -1 })
                            .limit(5)
                            .select('fromDate toDate status duration halfDaySession createdAt')
                            .lean();
                    }

                    // --- OD counts & recent ---
                    const OdModel = mongoose.models.OnDuty || mongoose.models.Leave || global.OnDuty;
                    if (OdModel) {
                        totalODCount = await OdModel.countDocuments({
                            student: req.user.id,
                            status: { $regex: /approved/i },
                            ...(OdModel.modelName === 'Leave' && { type: { $regex: /od/i } })
                        });
                        const pendingOD = await OdModel.countDocuments({
                            student: req.user.id,
                            status: { $regex: /pending/i },
                            ...(OdModel.modelName === 'Leave' && { type: { $regex: /od/i } })
                        });
                        pendingCount += pendingOD;
                        approvedCount += totalODCount;

                        // --- Fetch recent 5 OD applications ---
                        recentODs = await OdModel.find({
                            student: req.user.id,
                            ...(OdModel.modelName === 'Leave' && { type: { $regex: /od/i } })
                        })
                            .sort({ createdAt: -1 })
                            .limit(5)
                            .select('fromDate toDate status duration halfDaySession createdAt')
                            .lean();
                    }
                }
            } catch (dbError) {
                console.warn("⚠️ Database integration lookup warning:", dbError.message);
            }

            // Build response object
            const responsePayload = {
                success: true,
                name: userFullName,
                email: user.email || 'Not Provided',
                year: user.year || 'Not Provided',
                section: user.section || 'Not Provided',
                department: user.department || 'Not Provided',
                role: user.role || 'Student',
                deptCode: user.department || 'CSE',
                registerNo: user.registerNo || 'Not Provided',
                studentType: user.studentType || 'Regular Track',
                mobile: user.mobileNo || 'Not Provided',
                firstmentorName: user.firstmentorName || 'Not Assigned',
                secondmentorName: user.secondmentorName || 'Not Assigned',
                hodName: user.hodName || 'Not Assigned',
                category: user.category,
                assignedStudentsCount,
                totalLeavesCount,
                totalODCount,
                pendingCount,
                approvedCount,
            };

            // Only attach recent applications for students
            if (userRole === 'STUDENT') {
                responsePayload.recentLeaves = recentLeaves;
                responsePayload.recentODs = recentODs;
            }

            return res.status(200).json(responsePayload);

        } catch (error) {
            console.error('❌ Profile Route Fetch Failure:', error);
            return res.status(500).json({
                message: 'Internal server error processing profile metrics.',
                error: error.message
            });
        }
    })
    .delete(protect, async (req, res) => {
        try {
            const deletedUser = await User.findByIdAndDelete(req.user.id);
            if (!deletedUser) {
                return res.status(404).json({ success: false, message: 'User not found.' });
            }
            res.status(200).json({ success: true, message: 'Account permanently deleted.' });
        } catch (error) {
            console.error('Delete account error:', error);
            res.status(500).json({ success: false, message: 'Failed to delete account.', error: error.message });
        }
    });

export default router;