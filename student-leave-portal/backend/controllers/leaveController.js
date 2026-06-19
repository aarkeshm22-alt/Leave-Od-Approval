import Leave from '../models/Leave.js'; // Note the explicit .js extension required by ES Modules
import User from '../models/User.js';

// @desc    Submit a new request (Automatically logs 'Leave' or 'On-Duty' via system typing)
// @route   POST /api/leaves/apply
export const applyLeave = async (req, res) => {
  try {
    // 🚨 UPDATE: destructure 'type' along with fromDate, toDate, and reason
    const { type, fromDate, toDate, reason } = req.body;

    // Validate manual student entry items (ensuring type is present)
    if (!type || !fromDate || !toDate || !reason) {
      return res.status(400).json({ 
        message: 'Application type, starting date, ending date, and reason are mandatory fields.' 
      });
    }

    // Process instantiation using the authenticated student session passport id
    const newLeave = await Leave.create({
      student: req.user.id,
      type, // 🚨 SAVES: 'Leave' or 'On-Duty' automatically based on frontend page state
      fromDate,
      toDate,
      reason,
      status: 'Pending'
    });

    res.status(201).json({
      success: true,
      message: `${type} application registered successfully.`,
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
// @route   GET /api/leaves/my-leaves (or /track - just keep it consistent with the router!)
export const getLeaveHistory = async (req, res) => {
  try {
    // Finds matching items, maps your specific fields, and cascades relational object tree lookups instantly
    const history = await Leave.find({ student: req.user.id })
      .populate({
        path: 'student',
        select: 'firstName lastName registerNo studentType mobileNo mentorName', // 🚨 ADDED registerNo here to serve MyRequests.jsx!
      })
      .sort({ createdAt: -1 });

    // Send wrapped array to remain perfectly matched with the updated front-end processor logic
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
    // 1. Find the logged-in mentor's profile to extract their name string signature
    const mentorProfile = await User.findById(req.user.id);
    if (!mentorProfile) {
      return res.status(404).json({ message: 'Mentor profile registry not found.' });
    }

    const structuredMentorName = `${mentorProfile.firstName || ''} ${mentorProfile.lastName || ''}`.trim() || mentorProfile.name;

    // 2. Query for applications where the student's mentor matches this string AND status is 'Pending'
    // We use .populate() to join the student's name and registration number from the User collection
    const pendingApplications = await Leave.find({ status: 'Pending' })
      .populate({
        path: 'student',
        select: 'firstName lastName name registerNo studentType',
        match: { mentorName: structuredMentorName } // Only pulls students assigned to this mentor
      });

    // Filter out records where the student doesn't match the mentor's name query condition
    const filteredResults = pendingApplications.filter(item => item.student !== null);

    return res.status(200).json({ success: true, data: filteredResults });
  } catch (error) {
    console.error('Error fetching mentor pending queue stream:', error);
    return res.status(500).json({ message: 'Internal server pipeline runtime compilation fault.', error: error.message });
  }
};

export const getHodPendingLeaves = async (req, res) => {
  try {
    const { tab } = req.query; // 🎯 Listen for the active tab from frontend
    
    let statusQuery = { status: 'Partially Approved' };
    
    // If frontend explicitly asks for history, grab both Approved and Rejected items
    if (tab === 'ACTIONED') {
      statusQuery = { status: { $in: ['Approved', 'Rejected'] } };
    }

    const leaves = await Leave.find(statusQuery)
      .populate('student', 'firstName lastName name email registerNo') 
      .sort({ updatedAt: -1 }); // Show recently changed items first in history

    res.status(200).json({
      success: true,
      count: leaves.length,
      data: leaves
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching HOD clearance matrix queues',
      error: error.message
    });
  }
};