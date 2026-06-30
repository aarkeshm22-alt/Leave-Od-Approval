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
      let assignedStudentsCount = 0; 

      const userRole = user.role?.toUpperCase() || 'STUDENT';
      const userFullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();

      try {
        // ==========================================
        // 🌟 CASE 1: LOGGED-IN NODE IS A MENTOR
        // ==========================================
        if (userRole === 'MENTOR') {
          // Clean name and set up case-insensitive matching rules
          const escapedMentorName = userFullName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          const mentorRegexRule = new RegExp(`^${escapedMentorName}$`, 'i');

          // ✅ FIXED: Removed the undefined 'category: category' property crash reference
          const assignedStudents = await User.find({
            role: 'Student', 
            $or: [
              { firstmentorName: mentorRegexRule },
              { secondmentorName: mentorRegexRule }
            ]
          }).select('_id');

          assignedStudentsCount = assignedStudents ? assignedStudents.length : 0;

          // Aggregate request tallies across all assigned students if any are found
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
              totalLeavesCount = approvedLeaves; 
            }

            // Support checking against both OnDuty or OD models safely
            const OdModel = mongoose.models.OnDuty || mongoose.models.Leave || global.OnDuty;
            if (OdModel) {
              const pendingOD = await OdModel.countDocuments({
                student: { $in: studentIds },
                status: { $regex: /pending/i },
                // If sharing Leave model schema collections, filter down to 'od' types
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
        // 🌟 CASE 2: LOGGED-IN NODE IS A STUDENT
        // ==========================================
        else if (userRole !== 'HOD') {
          if (Leave) {
            totalLeavesCount = await Leave.countDocuments({
              student: req.user.id,
              status: { $regex: /approved/i },
              // If type field is shared, ensure we filter for 'leave'
              ...(Leave.schema.paths.type && { type: { $regex: /leave/i } })
            });

            const pendingLeaves = await Leave.countDocuments({
              student: req.user.id,
              status: { $regex: /pending/i },
              ...(Leave.schema.paths.type && { type: { $regex: /leave/i } })
            });

            pendingCount += pendingLeaves;
            approvedCount += totalLeavesCount;
          }

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
          }
        }
      } catch (dbError) {
        console.warn("⚠️ Database integration lookup warning:", dbError.message);
      }

      // Send response back
      return res.status(200).json({
        success: true,
        name: userFullName,
        email: user.email || 'Not Provided',
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
        approvedCount
      });

    } catch (error) {
      console.error('❌ Profile Route Fetch Failure:', error);
      return res.status(500).json({ message: 'Internal server error processing profile metrics.', error: error.message });
    }
  });

// Core Authentication entry points
router.post('/auth/register', registerUser);
router.post('/auth/login', loginUser);

export default router; 