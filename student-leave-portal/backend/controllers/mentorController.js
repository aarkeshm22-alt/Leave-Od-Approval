import User from '../models/User.js';
import Leave from '../models/Leave.js';

// @desc    Fetch students matching the logged-in mentor's name against firstmentorName with calculated Leave and OD aggregates
// @route   GET /api/mentor/my-students
export const getMyStudents = async (req, res) => {
  try {
    // 1. Fetch the logged-in mentor's profile to extract their exact string name field
    const mentorProfile = await User.findById(req.user.id);
    
    if (!mentorProfile) {
      return res.status(404).json({ message: 'Mentor profile registry not found.' });
    }

    // Safely structure the mentor name string to avoid unexpected spacer alignment gaps
    let structuredMentorName = "";
    if (mentorProfile.firstName || mentorProfile.lastName) {
      structuredMentorName = `${mentorProfile.firstName || ''} ${mentorProfile.lastName || ''}`.trim().replace(/\s+/g, ' ');
    } else {
      structuredMentorName = mentorProfile.name ? mentorProfile.name.trim() : "";
    }

    if (!structuredMentorName) {
      return res.status(400).json({ message: 'Mentor identity string signature is unassigned or incomplete.' });
    }

    // 2. Query the user collection: filter students where logged user name equals firstmentorName
    const students = await User.find({ 
      role: 'Student', 
      firstmentorName: structuredMentorName // 🌟 Fixed: Updated from mentorName to firstmentorName
    }).select('firstName lastName name registerNo studentType mobileNo email firstmentorName secondmentorName');

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

      // Calculate approved approved OD counts (Total number of institutional days taken)
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
    return res.status(200).json({ success: true, count: updatedStudentArray.length, data: updatedStudentArray });
    
  } catch (error) {
    console.error('Mentor extraction execution string-loop failure:', error);
    return res.status(500).json({ 
      message: 'Error compiling assigned student matrices via string lookup parameters.', 
      error: error.message 
    });
  }
};