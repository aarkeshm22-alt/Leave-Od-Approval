// routes/apiRoutes.js
import express from 'express';
import {
  getHods,
  getMentorsByHod,
  registerUser,
  loginUser,
  getStudentsByMentor,
  getStudentProfile,
  getAllMentors
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import User from '../models/User.js';

// 🚨 FIXED: Imported the actual split models from your file structure to prevent 500 runtime crashes
import Leave from '../models/Leave.js';
import OnDuty from '../models/OnDuty.js';

const router = express.Router();

// Dropdown synchronization routes
router.get('/users/hods', getHods);

// Unprotected route specifically for registration dropdowns
router.get('/users/mentors', getAllMentors);

// Filter mentors based on logged-in HOD
router.get('/users/mentors-by-hod', protect, getMentorsByHod);

router.get('/users/students', getStudentProfile);
router.get('/users/students-by-mentor', protect, getStudentsByMentor);

// ==========================================
// USER PROFILE: COMPREHENSIVE ROUTE LEDGER
// ==========================================
router.route('/users/profile')
  // 🔍 GET PROFILE METRICS (Updated with dynamic Mentor-Student linking)
  .get(protect, async (req, res) => {
    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({ message: 'User registry profile not found.' });
      }

      // Initialize default counter primitives safely
      let totalLeavesCount = 0;
      let totalODCount = 0;
      let pendingCount = 0;
      let approvedCount = 0;
      let assignedStudentsCount = 0; // Added for the mentor workspace console

      const userRole = user.role?.toUpperCase() || 'STUDENT';
      const userFullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();

      try {
        // ==========================================
        // 🌟 CASE 1: LOGGED-IN NODE IS A MENTOR
        // ==========================================
        if (userRole === 'MENTOR') {
          // 1. Find all students whose 'mentorName' matches the logged-in mentor's full name
          if (userRole === 'MENTOR') {
            const assignedStudents = await User.find({
              role: 'Student', // Matches your enum format exactly
              $or: [
                { firstmentorName: userFullName },
                { secondmentorName: userFullName },
                {document: document},
                { category: category }

              ]
            }).select('_id');

            assignedStudentsCount = assignedStudents.length;
            // ... rest of logic
          }

          assignedStudentsCount = assignedStudents.length;

          // 2. Aggregate request tallies across all assigned students if any are found
          if (assignedStudentsCount > 0) {
            const studentIds = assignedStudents.map(student => student._id);

            if (Leave) {
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
              totalLeavesCount = approvedLeaves; // ✨ FIXED: Assigned explicit approved leave count
            }

            if (OnDuty) {
              const pendingOD = await OnDuty.countDocuments({
                student: { $in: studentIds },
                status: { $regex: /pending/i }
              });
              const approvedOD = await OnDuty.countDocuments({
                student: { $in: studentIds },
                status: { $regex: /approved/i }
              });

              pendingCount += pendingOD;
              approvedCount += approvedOD;
              totalODCount = approvedOD; // ✨ FIXED: Explicitly maps the total approved OD items
            }
          }
        }
        // ==========================================
        // 🌟 CASE 2: LOGGED-IN NODE IS A STUDENT (Original Logic)
        // ==========================================
        else if (userRole !== 'HOD') {
          if (Leave) {
            totalLeavesCount = await Leave.countDocuments({
              student: req.user.id,
              status: { $regex: /approved/i }
            });

            const pendingLeaves = await Leave.countDocuments({
              student: req.user.id,
              status: { $regex: /pending/i }
            });

            pendingCount += pendingLeaves;
            approvedCount += totalLeavesCount;
          }

          if (OnDuty) {
            totalODCount = await OnDuty.countDocuments({
              student: req.user.id,
              status: { $regex: /approved/i }
            });

            const pendingOD = await OnDuty.countDocuments({
              student: req.user.id,
              status: { $regex: /pending/i }
            });

            pendingCount += pendingOD;
            approvedCount += totalODCount;
          }
        }
      } catch (dbError) {
        console.warn("⚠️ Database integration lookup warning:", dbError.message);
      }

      // Send everything back in a unified response signature
      res.status(200).json({
        success: true,
        name: userFullName,
        email: user.email || 'Not Provided',
        role: user.role || 'Student',
        deptCode: user.department || 'CSE', // Updated to match your schema's 'department'
        registerNo: user.registerNo || 'Not Provided',
        studentType: user.studentType || 'Regular Track',
        mobile: user.mobileNo || 'Not Provided',

        // ✨ FIXED EXTENSIONS:
        firstmentorName: user.firstmentorName || 'Not Assigned',
        secondmentorName: user.secondmentorName || 'Not Assigned',
        document: user.document || "Not Uploaded",
        // Fixed typo here
        hodName: user.hodName || 'Not Assigned', // Added safe fallback
        category: user.category,

        assignedStudentsCount,
        totalLeavesCount,
        totalODCount,
        pendingCount, 
        approvedCount
      });

    } catch (error) {
      console.error('❌ Profile Route Fetch Failure:', error);
      res.status(500).json({ message: 'Internal server error processing real database metrics.', error: error.message });
    }
  })
  // 🔥 DELETE USER ACCOUNT
  .delete(protect, async (req, res) => {
    try {
      const deletedUser = await User.findByIdAndDelete(req.user.id);

      if (!deletedUser) {
        return res.status(404).json({ success: false, message: 'User record not found for removal.' });
      }

      // Cascade delete application sheets if the record was an active student pointer
      if (deletedUser.role !== 'HOD') {
        if (Leave) await Leave.deleteMany({ student: req.user.id });
        if (OnDuty) await OnDuty.deleteMany({ student: req.user.id });
      }

      res.status(200).json({ success: true, message: 'Account permanently purged from database.' });
    } catch (error) {
      console.error('❌ Account Deletion Failure:', error);
      res.status(500).json({ message: 'Internal server error processing account deletion.', error: error.message });
    }
  });

// Core Authentication entry points
router.post('/auth/register', registerUser);
router.post('/auth/login', loginUser);

export default router; 