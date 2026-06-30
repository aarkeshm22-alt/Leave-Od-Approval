import express from 'express';
import { getMyStudents, getMentorsWithStudents } from '../controllers/mentorController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protects the route, ensuring only users logged in as a 'Mentor' can query this student list
router.get('/my-students', protect, authorize('Mentor'), getMyStudents);
router.get('/mentors-with-students', protect, getMentorsWithStudents);

export default router; 