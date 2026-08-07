import express from 'express';
const router = express.Router();

// Named imports from our controllers
import { 
  applyLeave, 
  mentorApprove, 
  hodApprove, 
  getLeaveHistory,
  getMentorPendingLeaves,
  getHodPendingLeaves,
  mentorReject,
  hodReject
} from '../controllers/leaveController.js';

// 🔌 NOW CONNECTED: Import your fresh newly created middleware layer
import { protect, authorize } from '../middleware/authMiddleware.js';

// Student Facing Endpoints
router.post('/apply', protect, authorize('Student'), applyLeave);
router.get('/my-leaves', protect, authorize('Student'), getLeaveHistory);

// Multi-Tier Administrative Approval Matrix Checkpoints
router.get('/mentor/pending', protect, authorize('Mentor'), getMentorPendingLeaves);
router.get('/hod/pending', protect, authorize('HOD'), getHodPendingLeaves);
router.patch('/:id/mentor-approve', protect, authorize('Mentor'), mentorApprove);
router.patch('/:id/mentor-reject', protect, authorize('Mentor'), mentorReject);
router.patch('/:id/hod-approve', protect, authorize('HOD'), hodApprove);
router.patch('/:id/hod-reject', protect, authorize('HOD'), hodReject);

export default router;