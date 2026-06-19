import express from 'express';
import { getMyStudents } from '../controllers/mentorController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protects the route, ensuring only users logged in as a 'Mentor' can query this student list
router.get('/my-students', protect, authorize('Mentor'), getMyStudents);

export default router;