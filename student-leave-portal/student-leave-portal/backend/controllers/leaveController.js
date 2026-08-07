import Leave from '../models/Leave.js'; // Note the explicit .js extension required by ES Modules
import User from '../models/User.js';
import mongoose from 'mongoose';

// @desc    Submit a new request (Automatically logs 'Leave' or 'On-Duty' via system typing)
// @route   POST /api/leaves/apply
export const applyLeave = async (req, res) => {
  try {
    // 🚨 UPDATED: Destructure 'duration' and 'halfDaySession' alongside existing properties
    const { type, duration, halfDaySession, fromDate, toDate, reason } = req.body;

    // Validate incoming baseline structures
    if (!type || !duration || !fromDate || !reason) {
      return res.status(400).json({ 
        message: 'Application type, duration style, starting date, and reason are mandatory fields.' 
      });
    }

    // Secondary layer validation if structural context is "Half Day"
    if (duration === 'Half Day' && !halfDaySession) {
      return res.status(400).json({ 
        message: 'A clear shift partition (Morning/Afternoon) must be defined for Half Day requests.' 
      });
    }

    // Full day applications must submit a valid ending boundary
    if (duration === 'Full Day' && !toDate) {
      return res.status(400).json({
        message: 'Full day applications require an end date window selection.'
      });
    }

    // Process instantiation using the authenticated student session passport id
    const newLeave = await Leave.create({
      student: req.user.id,
      type, 
      duration,
      halfDaySession: duration === 'Half Day' ? halfDaySession : '', // Enforce clean empty state if full day
      fromDate,
      // Fallback to fromDate if structural state selection is "Half Day"
      toDate: duration === 'Half Day' ? fromDate : toDate, 
      reason,
      status: 'Pending'
    });

    res.status(201).json({
      success: true,
      message: `${type} (${duration}) application registered successfully.`,
      data: newLeave
    });
  } catch (error) {
    res.status(500).json({ message: 'Server fault processing leave payload structure.', error: error.message });
  }
};

// @desc    Step 1: Mentor Review execution logic (Changes status to Partially Approved)
// @route   PATCH /api/leaves/:id/mentor-approve
export const mentorApprove = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ message: 'Target leave application trace not found.' });
    }

    if (leave.status !== 'Pending') {
      return res.status(400).json({ message: 'Document structure must be in [Pending] state to receive Mentor sign-off.' });
    }

    leave.status = 'Partially Approved';
    leave.mentorReview = {
      approvedBy: req.user.id, // Logged in Mentor ID
      reviewedAt: new Date()
    };

    await leave.save();
    res.status(200).json({ success: true, message: 'Application passed Level-1 verification. Moved to HOD buffer layout.', data: leave });
  } catch (error) {
    res.status(500).json({ message: 'Error writing Level-1 operational approval state.', error: error.message });
  }
};

// @desc    Step 2: HOD Review final confirmation signature (Changes status to Approved)
// @route   PATCH /api/leaves/:id/hod-approve
export const hodApprove = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ message: 'Target leave application trace not found.' });
    }

    if (leave.status !== 'Partially Approved') {
      return res.status(400).json({ message: 'HOD cannot approve until Mentor has marked application as Partially Approved.' });
    }

    leave.status = 'Approved';
    leave.hodReview = {
      approvedBy: req.user.id, // Logged in HOD ID
      reviewedAt: new Date()
    };

    await leave.save();
    res.status(200).json({ success: true, message: 'Application fully verified and closed out by structural HOD clearance.', data: leave });
  } catch (error) {
    res.status(500).json({ message: 'Error writing final structural validation state.', error: error.message });
  }
};

// @desc    Fetch Leave Requests with complete auto-populated relational details
// @route   GET /api/leaves/my-leaves (or /track)
export const getLeaveHistory = async (req, res) => {
  try {
    const history = await Leave.find({ student: req.user.id })
      .populate({
        path: 'student',
        select: 'firstName lastName registerNo studentType mobileNo mentorName firstmentorName secondmentorName', 
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: history }); 
  } catch (error) {
    console.error('Leave Tracking Pipeline Failure:', error);
    res.status(500).json({ 
      message: 'Error assembling relational parameters.', 
      error: error.message 
    });
  }
};

// @desc    Get all pending leave & OD applications assigned to the logged-in mentor
// @route   GET /api/leaves/mentor/pending
export const getMentorPendingLeaves = async (req, res) => {
  try {
    // 1. Grab logged mentor document context profile
    const mentorProfile = await User.findById(req.user.id);
    if (!mentorProfile) {
      return res.status(404).json({ message: 'Mentor profile registry not found.' });
    }

    // Clean up spaces to construct a precise identity query string
    let structuredMentorName = "";
    if (mentorProfile.firstName || mentorProfile.lastName) {
      structuredMentorName = `${mentorProfile.firstName || ''} ${mentorProfile.lastName || ''}`.trim().replace(/\s+/g, ' ');
    } else {
      structuredMentorName = mentorProfile.name ? mentorProfile.name.trim() : "";
    }

    if (!structuredMentorName) {
      return res.status(400).json({ message: 'Mentor signature could not be verified or is unassigned.' });
    }

    // 2. Fetch pending leave tickets, filtering sub-population matching 'firstmentorName'
    // Uses a case-insensitive regex check to bypass subtle user typing errors
    const pendingApplications = await Leave.find({ status: 'Pending' })
      .populate({
        path: 'student',
        select: 'firstName lastName name registerNo studentType firstmentorName secondmentorName',
        match: { 
          firstmentorName: { $regex: new RegExp(`^${structuredMentorName}$`, 'i') } // 🌟 Fixed: match against firstmentorName with safe regex filter
        } 
      })
      .sort({ createdAt: -1 });

    // 3. Purge unmatched elements out of array map cleanly
    const filteredResults = pendingApplications.filter(item => item.student !== null);

    return res.status(200).json({ success: true, count: filteredResults.length, data: filteredResults });
  } catch (error) {
    console.error('Error fetching mentor pending queue stream:', error);
    return res.status(500).json({ message: 'Internal server pipeline runtime compilation fault.', error: error.message });
  }
};

// @desc    Get all applications awaiting HOD review or historical records
// @route   GET /api/leaves/hod/pending
export const getHodPendingLeaves = async (req, res) => {
  try {
    const { tab } = req.query; 
    
    let statusQuery = { status: 'Partially Approved' };
    
    if (tab === 'ACTIONED') {
      statusQuery = { status: { $in: ['Approved', 'Rejected'] } };
    }

    // Fetch records using the status query and populate matching student entries
    const leaves = await Leave.find(statusQuery)
      .populate('student', 'firstName lastName name email registerNo year section firstmentorName') 
      .sort({ updatedAt: -1 }); 

    // FIXED: Changed 'data.map' to 'leaves.map' to match the database query variable above
    const formattedLeaves = leaves.map(item => {
      const studentObj = item.student || {};
      
      return {
        _id: item._id,
        id: item._id,
        type: item.type || 'Leave',
        duration: item.duration,
        halfDaySession: item.halfDaySession,
        fromDate: item.fromDate,
        toDate: item.toDate,
        reason: item.reason,
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        
        // Relational structural mappings
        registerNo: studentObj.registerNo || 'N/A',
        studentName: studentObj.name || `${studentObj.firstName || ''} ${studentObj.lastName || ''}`.trim() || 'Unknown Student',
        
        // Fallbacks if your database records contain blank attributes
        year: studentObj.year || 'IV Year',
        section: studentObj.section || 'A',
        firstMentorName: studentObj.firstmentorName || 'Dr. K. Mentor'
      };
    });

    // FIXED: Variables now correctly reference 'formattedLeaves'
    res.status(200).json({
      success: true,
      count: formattedLeaves.length,
      data: formattedLeaves
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching HOD clearance matrix queues',
      error: error.message
    });
  }
};

// @desc    Step 1b: Mentor Review rejection execution logic (Changes status to Rejected)
// @route   PATCH /api/leaves/:id/mentor-reject
export const mentorReject = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ message: 'Target leave application trace not found.' });
    }

    if (leave.status !== 'Pending') {
      return res.status(400).json({ message: 'Document structure must be in [Pending] state to be rejected by a Mentor.' });
    }

    // 🚨 Update status to Rejected
    leave.status = 'Rejected';
    leave.mentorReview = {
      approvedBy: req.user.id, // Logged in Mentor ID
      reviewedAt: new Date(),
      remarks: req.body.remarks || 'Rejected by Class Advisor' // Optional: captures text reasoning if provided
    };

    await leave.save();
    res.status(200).json({ success: true, message: 'Application has been rejected by the Mentor.', data: leave });
  } catch (error) {
    res.status(500).json({ message: 'Error writing Level-1 operational rejection state.', error: error.message });
  }
};

export const hodReject = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ message: 'Leave application not found.' });
    }

    // Only allow rejection of Partially Approved requests
    if (leave.status !== 'Partially Approved') {
      return res.status(400).json({
        message: 'HOD can only reject applications that are already Partially Approved by the mentor.'
      });
    }

    leave.status = 'Rejected';
    leave.hodReview = {
      approvedBy: req.user.id,
      reviewedAt: new Date(),
      remarks: req.body.remarks || 'Rejected by HOD'
    };

    await leave.save();

    res.status(200).json({
      success: true,
      message: 'Application rejected by HOD.',
      data: leave
    });
  } catch (error) {
    console.error('HOD reject error:', error);
    res.status(500).json({
      message: 'Error rejecting leave.',
      error: error.message
    });
  }
};