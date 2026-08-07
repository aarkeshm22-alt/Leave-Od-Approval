import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  sendAnonymousMessage,
  getMyMessages,
  getHodMessages,
  viewMessage,
  getHodMessageById,
  getHodStats,
  deleteMessage
} from '../controllers/chatController.js';

const router = express.Router();

// ==========================================
// STUDENT ROUTES
// ==========================================
router.post('/send', protect, sendAnonymousMessage);
router.get('/my-messages', protect, getMyMessages);
router.delete('/message/:id', protect, deleteMessage);

// ==========================================
// HOD ROUTES
// ==========================================
router.get('/hod/messages', protect, getHodMessages);
router.get('/hod/message/:id', protect, getHodMessageById);
router.put('/hod/view/:id', protect, viewMessage);
router.get('/hod/stats', protect, getHodStats);

export default router;

