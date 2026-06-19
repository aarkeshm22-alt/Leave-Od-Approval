import User from '../models/User.js';
import Leave from '../models/Leave.js';

// @desc    Fetch students matching the mentor's string name with calculated Leave and OD aggregates
// @route   GET /api/mentor/my-students
export const getMyStudents = async (req, res) => {
  try {
    // 1. Fetch the logged-in mentor's profile to extract their exact string name field
    const mentorProfile = await User.findById(req.user.id);
    
    if (!mentorProfile) {
      return res.status(404).json({ message: 'Mentor profile registry not found.' });
    }

    // Combine firstName and lastName to get the full name string if stored separately,
    // or use a direct 'name' property depending on your exact User schema design.
    const structuredMentorName = `${mentorProfile.firstName || ''} ${mentorProfile.lastName || ''}`.trim() || mentorProfile.name;

    if (!structuredMentorName) {
      return res.status(400).json({ message: 'Mentor identity string signature is unassigned or incomplete.' });
    }

    // 2. Query the user collection for students matching the mentor's string name explicitly
    const students = await User.find({ 
      role: 'Student', 
      mentorName: structuredMentorName // Matches the text field directly in your User schema!
    }).select('firstName lastName name registerNo studentType mobileNo email mentorName');

    // 3. Loop through matched students to compute their active Leave and OD duration metrics
    const updatedStudentArray = await Promise.all(students.map(async (student) => {
      
      // Calculate approved leave counts (Total number of days taken)
      const leaveAgg = await Leave.aggregate([
        { $match: { student: student._id, type: 'Leave', status: 'Approved' } },
        {
          $project: {
            days: {
              $add: [
                { $divide: [{ $subtract: ["$toDate", "$fromDate"] }, 1000 * 60 * 60 * 24] },
                1
              ]
            }
          }
        },
        { $group: { _id: null, totalDays: { $sum: "$days" } } }
      ]);

      // Calculate approved OD counts (Total number of institutional days taken)
      const odAgg = await Leave.aggregate([
        { $match: { student: student._id, type: { $in: ['On-Duty', 'OD'] }, status: 'Approved' } },
        {
          $project: {
            days: {
              $add: [
                { $divide: [{ $subtract: ["$toDate", "$fromDate"] }, 1000 * 60 * 60 * 24] },
                1
              ]
            }
          }
        },
        { $group: { _id: null, totalDays: { $sum: "$days" } } }
      ]);

      return {
        ...student._doc,
        // Fallback to 0 if the student doesn't have any approved records yet
        leaveCount: leaveAgg[0]?.totalDays || 0,
        odCount: odAgg[0]?.totalDays || 0
      };
    }));

    // Return the response package to feed into your StudentList.jsx layout table
    return res.status(200).json({ success: true, data: updatedStudentArray });
    
  } catch (error) {
    console.error('Mentor extraction execution string-loop failure:', error);
    return res.status(500).json({ 
      message: 'Error compiling assigned student matrices via string lookup parameters.', 
      error: error.message 
    });
  }
};