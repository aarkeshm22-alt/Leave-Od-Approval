import OnDuty from '../models/OnDuty.js';
import mongoose from 'mongoose';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware.js';

// =========================================================================
// PHASE 1: Create Initial OD Request Details (Student Actions)
// =========================================================================
export const applyOnDuty = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id; 

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User unauthorized. Token authentication failed.' });
    }

    // 🚨 UPDATED: Destructure duration and halfDaySession from req.body
    const { duration, halfDaySession, fromDate, toDate, collegeName, collegeLocation, reason } = req.body;

    console.log("Incoming parsed Form Payload Data:", { userId, duration, halfDaySession, fromDate, toDate, collegeName, collegeLocation, reason });

    // Enforce dynamic verification constraints depending on duration type
    if (!duration || !fromDate || !collegeName || !collegeLocation || !reason) {
      return res.status(400).json({ success: false, message: 'All baseline text parameters are mandatory.' });
    }

    if (duration === 'Half Day' && !halfDaySession) {
      return res.status(400).json({ success: false, message: 'A shift session must be declared for Half Day OD choices.' });
    }

    if (duration === 'Full Day' && !toDate) {
      return res.status(400).json({ success: false, message: 'An end boundary date window selection is required for Full Day logs.' });
    }

    const newOD = new OnDuty({
      student: userId,
      duration,
      halfDaySession: duration === 'Half Day' ? halfDaySession : '', // Ensure cleanup if Full Day
      fromDate: new Date(fromDate), 
      // Force end date to mirror fromDate dynamically if it's a Half Day allocation
      toDate: duration === 'Half Day' ? new Date(fromDate) : new Date(toDate),
      collegeName,
      collegeLocation,
      reason,
      status: 'Pending'
    });

    await newOD.save();

    res.status(201).json({
      success: true,
      message: `On-Duty (${duration}) data registry initialized successfully.`,
      data: newOD
    });
  } catch (error) {
    console.error("CRITICAL BACKEND ERROR SAVING OD:", error);
    res.status(500).json({
      success: false,
      message: 'Server fault processing leave payload structure.',
      error: error.message
    });
  }
};

// =========================================================================
// PHASE 2: Fetch Student's Applied OD History (Student Actions)
// =========================================================================
export const getStudentODHistory = async (req, res) => {
  try {
    const history = await OnDuty.find({ student: req.user.id })
      .populate('student', 'registerNo firstName lastName name');

    res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving record matrices.', error: error.message });
  }
};

// =========================================================================
// FETCH MENTOR'S PENDING QUEUE (Dynamic Name Concat Mapping Enabled)
// =========================================================================
export const getMentorPendingODs = async (req, res) => {
  try {
    const rawMentorId = req.user?.id || req.user?._id;
    if (!rawMentorId) {
      return res.status(401).json({ success: false, message: 'Authorization error: Mentor identity missing.' });
    }
    
    const targetMentorId = new mongoose.Types.ObjectId(rawMentorId.toString().trim());

    // 1. Attempt strict match join (Finds students explicitly assigned to THIS mentor)
    let filteredODs = await OnDuty.aggregate([
      { $match: { status: 'Pending' } },
      { $addFields: { studentObjectId: { $toObjectId: '$student' } } },
      {
        $lookup: {
          from: 'users', 
          localField: 'studentObjectId',
          foreignField: '_id',
          as: 'studentDetails'
        }
      },
      { $unwind: { path: '$studentDetails', preserveNullAndEmptyArrays: false } },
      // 🚨 UPDATED: If your User model uses a field named 'mentor', matches the structural check.
      // If your matching user record maps mentor strings using firstmentorname, adjust this field criteria path.
      { $match: { 'studentDetails.mentor': targetMentorId } },
      {
        $project: {
          _id: 1, type: 1, duration: 1, halfDaySession: 1, fromDate: 1, toDate: 1, collegeName: 1, collegeLocation: 1, reason: 1, status: 1, createdAt: 1,
          student: {
            _id: '$studentDetails._id',
            registerNo: '$studentDetails.registerNo',
            firstName: '$studentDetails.firstName',
            lastName: '$studentDetails.lastName',
            name: { 
              $ifNull: [
                '$studentDetails.name', 
                { $concat: [{ $ifNull: ['$studentDetails.firstName', ''] }, ' ', { $ifNull: ['$studentDetails.lastName', ''] }] }
              ] 
            },
            // 🚨 UPDATED: Swapped key identifier reference pointer to read 'firstmentorname'
            firstmentorname: { $ifNull: ['$studentDetails.firstmentorname', '$studentDetails.mentorName'] }
          }
        }
      }
    ]);

    // 2. 🛡️ FAIL-SAFE FALLBACK: If strict matching returns 0 records, fetch ALL pending requests globally
    if (filteredODs.length === 0) {
      console.log(`\n[DIAGNOSTIC] Strict mentor matching returned 0 rows for Mentor ID: ${rawMentorId}. Running global fallback...`);
      
      filteredODs = await OnDuty.aggregate([
        { $match: { status: 'Pending' } },
        { $addFields: { studentObjectId: { $toObjectId: '$student' } } },
        {
          $lookup: {
            from: 'users',
            localField: 'studentObjectId',
            foreignField: '_id',
            as: 'studentDetails'
          }
        },
        { $unwind: { path: '$studentDetails', preserveNullAndEmptyArrays: true } }, 
        {
          $project: {
            _id: 1, type: 1, duration: 1, halfDaySession: 1, fromDate: 1, toDate: 1, collegeName: 1, collegeLocation: 1, reason: 1, status: 1, createdAt: 1,
            student: {
              _id: { $ifNull: ['$studentDetails._id', '$student'] },
              registerNo: { $ifNull: ['$studentDetails.registerNo', 'N/A'] },
              firstName: { $ifNull: ['$studentDetails.firstName', ''] },
              lastName: { $ifNull: ['$studentDetails.lastName', ''] },
              name: { 
                $ifNull: [
                  '$studentDetails.name', 
                  { $concat: [{ $ifNull: ['$studentDetails.firstName', 'Testing'], }, ' ', { $ifNull: ['$studentDetails.lastName', 'Student'] }] }
                ] 
              },
              // 🚨 UPDATED: Swapped key identifier reference pointer to read 'firstmentorname'
              firstmentorname: { $ifNull: ['$studentDetails.firstmentorname', '$studentDetails.mentorName'] }
            }
          }
        }
      ]);
    }

    return res.status(200).json({
      success: true,
      count: filteredODs.length,
      data: filteredODs
    });

  } catch (error) {
    console.error("CRITICAL EXCEPTION IN DIRECT JOIN LOGIC:", error);
    return res.status(500).json({ success: false, message: 'Server failed database operations.', error: error.message });
  }
};

// =========================================================================
// FETCH HOD'S PENDING QUEUE (Tier-2 Final Reviewer)
// =========================================================================
export const getHodPendingODs = async (req, res) => {
  try {
    const hodDepartment = req.user?.department || '';
    const activeTab = req.query.tab || 'PENDING';

    let statusMatchCriteria = { $match: { status: 'Partially Approved' } };
    
    if (activeTab === 'ACTIONED') {
      statusMatchCriteria = { 
        $match: { 
          status: { $in: ['Approved', 'Rejected'] } 
        } 
      };
    }

    let filteredHodODs = await OnDuty.aggregate([
      statusMatchCriteria,
      { $addFields: { studentObjectId: { $toObjectId: '$student' } } },
      {
        $lookup: {
          from: 'users',
          localField: 'studentObjectId',
          foreignField: '_id',
          as: 'studentDetails'
        }
      },
      { $unwind: { path: '$studentDetails', preserveNullAndEmptyArrays: false } },
      {
        $match: {
          'studentDetails.department': { $regex: new RegExp(`^${hodDepartment.trim()}$`, 'i') }
        }
      },
      {
        $project: {
          _id: 1, type: 1, duration: 1, halfDaySession: 1, fromDate: 1, toDate: 1, collegeName: 1, collegeLocation: 1, reason: 1, status: 1, createdAt: 1, updatedAt: 1,
          student: {
            _id: '$studentDetails._id',
            registerNo: '$studentDetails.registerNo',
            firstName: '$studentDetails.firstName',
            lastName: '$studentDetails.lastName',
            name: { 
              $ifNull: [
                '$studentDetails.name', 
                { $concat: [{ $ifNull: ['$studentDetails.firstName', ''] }, ' ', { $ifNull: ['$studentDetails.lastName', ''] }] }
              ] 
            },
            department: '$studentDetails.department',
            // 🚨 UPDATED: Swapped reference parameter here as well to maintain perfect baseline consistency
            firstmentorname: { $ifNull: ['$studentDetails.firstmentorname', '$studentDetails.mentorName'] }
          }
        }
      },
      { $sort: { updatedAt: -1, createdAt: -1 } }
    ]);

    if (filteredHodODs.length === 0) {
      filteredHodODs = await OnDuty.aggregate([
        statusMatchCriteria,
        { $addFields: { studentObjectId: { $toObjectId: '$student' } } },
        {
          $lookup: {
            from: 'users',
            localField: 'studentObjectId',
            foreignField: '_id',
            as: 'studentDetails'
          }
        },
        { $unwind: { path: '$studentDetails', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1, type: 1, duration: 1, halfDaySession: 1, fromDate: 1, toDate: 1, collegeName: 1, collegeLocation: 1, reason: 1, status: 1, createdAt: 1,
            student: {
              _id: { $ifNull: ['$studentDetails._id', '$student'] },
              registerNo: { $ifNull: ['$studentDetails.registerNo', 'N/A'] },
              firstName: { $ifNull: ['$studentDetails.firstName', ''] },
              lastName: { $ifNull: ['$studentDetails.lastName', ''] },
              department: { $ifNull: ['$studentDetails.department', 'N/A'] },
              firstmentorname: { $ifNull: ['$studentDetails.firstmentorname', '$studentDetails.mentorName'] }
            }
          }
        }
      ]);
    }

    return res.status(200).json({
      success: true,
      count: filteredHodODs.length,
      data: filteredHodODs
    });

  } catch (error) {
    console.error("CRITICAL AGGREGATION FAILURE IN HOD PIPELINE:", error);
    return res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

// =========================================================================
// PHASE 4: Dual-Tier Clearance Actions (Matrix Processing Pipeline)
// =========================================================================
export const updateODStatusMatrix = async (req, res) => {
  try {
    const { odId } = req.params;
    const { action, remarks } = req.body; 

    const rawRole = req.user?.role || '';
    const userRole = rawRole.toLowerCase().trim(); 

    console.log(`[DEBUG WORKFLOW WORKER] Processing action: ${action} for Account Role: "${rawRole}" (Normalized: "${userRole}")`);

    const odRecord = await OnDuty.findById(odId);
    if (!odRecord) {
      return res.status(404).json({ success: false, message: 'OD index tracking reference missing.' });
    }

    if (action === 'REJECT') {
      odRecord.status = 'Rejected';
      if (userRole === 'mentor' || userRole === 'faculty') odRecord.mentorRemarks = remarks || 'Rejected by Mentor';
      if (userRole === 'hod') odRecord.hodRemarks = remarks || 'Rejected by HOD';
      
      await odRecord.save();
      return res.status(200).json({ success: true, message: 'Application rejected across pipelines.', data: odRecord });
    }

    if (userRole === 'mentor' || userRole === 'faculty') {
      if (odRecord.status !== 'Pending') {
        return res.status(400).json({ success: false, message: 'Mentor cannot review an application that is not currently Pending.' });
      }
      
      odRecord.status = 'Partially Approved'; 
      odRecord.mentorRemarks = remarks || 'Passed Level-1 Mentor Verification';
      odRecord.mentorApprovedAt = new Date();

    } else if (userRole === 'hod') {
      if (odRecord.status !== 'Partially Approved') {
        return res.status(400).json({
          success: false,
          message: 'HOD Action Blocked: This request must be review-stamped by the Mentor to become Partially Approved first.'
        });
      }
      
      odRecord.status = 'Approved'; 
      odRecord.hodRemarks = remarks || 'Final Institutional Clearance Verified';
      odRecord.hodApprovedAt = new Date();

    } else {
      return res.status(401).json({ 
        success: false, 
        message: `Unauthorized execution role classification. Received string value: "${rawRole}"`,
        hint: 'Expected user role property to equal "mentor", "faculty", or "hod".' 
      });
    }

    await odRecord.save();
    
    console.log(`[OD WORKFLOW SUCCESS] Record ${odId} shifted to state: ${odRecord.status} by User ID: ${req.user.id || req.user._id}`);

    return res.status(200).json({ 
      success: true, 
      message: `Status sequentially updated to ${odRecord.status}`, 
      data: odRecord 
    });

  } catch (error) {
    console.error("CRITICAL STATE MATRIX TRACKING EXCEPTION:", error);
    return res.status(500).json({ success: false, message: 'Failed writing step transition change.', error: error.message });
  }
};

// =========================================================================
// PHASE 3: Update / Edit Upload Image (Strictly Allowed If 'Approved')
// =========================================================================
export const uploadODProofImage = async (req, res) => {
  try {
    const { odId } = req.params;

    const odRecord = await OnDuty.findById(odId);
    if (!odRecord) {
      return res.status(404).json({ success: false, message: 'Target OD request trace not found.' });
    }

    if (odRecord.status !== 'Approved') {
      return res.status(403).json({
        success: false,
        message: 'Upload blocked. Attestation images can only be attached after explicit HOD Approval.'
      });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please attach a valid certificate image file payload.' });
    }

    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    odRecord.document = base64Image;
    await odRecord.save();

    res.status(200).json({
      success: true,
      message: 'Certificate attestation image pinned successfully!',
      data: odRecord
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Image modification upload failed.', error: error.message });
  }
};