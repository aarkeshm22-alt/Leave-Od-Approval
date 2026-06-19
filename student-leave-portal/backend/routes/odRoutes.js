import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware.js'; 
import { uploadODDocument } from '../middleware/upload.js'; // Secure memoryStorage engine with a strict 300KB constraint
import { 
  applyOnDuty, 
  getStudentODHistory, 
  uploadODProofImage, 
  updateODStatusMatrix,
  getMentorPendingODs, // 🚀 Imported Mentor Fetching Controller
  getHodPendingODs     // 🚀 Imported HOD Fetching Controller
} from '../controllers/odController.js';

const router = express.Router();

// =========================================================================
// STUDENT PIPELINES
// =========================================================================

/**
 * @route   POST /api/od/apply-od
 * @desc    Phase 1: Create an initial On-Duty application (Inputs Only, Starts as 'Pending')
 * @access  Private (Student)
 */
router.post('/apply-od', protect, uploadODDocument.none(), applyOnDuty);

/**
 * @route   GET /api/od/student-history
 * @desc    Phase 2: Fetch log lists of all OD requests submitted by the logged-in student
 * @access  Private (Student)
 */
router.get('/student-history', protect, getStudentODHistory);

/**
 * @route   PATCH /api/od/upload-proof/:odId
 * @desc    Phase 3: Edit option to upload proof (Strictly allowed ONLY when status is 'Approved')
 * @access  Private (Student)
 * @note    Intercepts multipart form-data payload safely. Restricts to images under 300 KB.
 */
router.patch('/upload-proof/:odId', protect, (req, res, next) => {
  // Looks specifically for FormData key matching 'document'
  uploadODDocument.single('document')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          success: false, 
          message: 'Image size is higher than the 300 KB backend limit.' 
        });
      }
      return res.status(400).json({ success: false, message: err.message });
    } else if (err) {
      // Handles custom errors thrown by our file type mime filter (e.g., trying to upload a PDF/Zip)
      return res.status(400).json({ success: false, message: err.message });
    }
    // Proceed safely to controller if validation passes completely
    next();
  });
}, uploadODProofImage);


// =========================================================================
// AUTHORIZATION MANAGEMENT PIPELINE (Faculty / Staff)
// =========================================================================

/**
 * @route   GET /api/od/mentor/pending
 * @desc    Retrieves all initial applications matching this mentor's assigned student roster
 * @access  Private (Mentor)
 */
router.get('/mentor/pending', protect, getMentorPendingODs);

/**
 * @route   GET /api/od/hod/pending
 * @desc    Retrieves all records with 'Approved By Mentor' matching the HOD's department index
 * @access  Private (HOD)
 */
router.get('/hod/pending', protect, getHodPendingODs);

/**
 * @route   PATCH /api/od/:odId/action
 * @desc    Phase 4: Multi-tier centralized clearance gate action
 * @access  Private (Mentor / HOD)
 * @payload Expects body value: { "action": "APPROVE", "remarks": "Text string context..." }
 * @rules   Mentors advance status to 'Approved By Mentor'. HOD then advances it to 'Approved'.
 */
router.patch('/:odId/action', protect, updateODStatusMatrix);

export default router;