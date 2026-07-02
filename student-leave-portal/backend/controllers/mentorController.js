import User from '../models/User.js'; // Adjust paths as per your project setup
import Leave from '../models/Leave.js';
import OnDuty from '../models/OnDuty.js'; // 🌟 Added import for your separate OnDuty model
import mongoose from 'mongoose';

export const getMyStudents = async (req, res) => {
  try {
    // 1. Fetch mentor profile
    const mentorProfile = await User.findById(req.user.id);
    if (!mentorProfile) {
      return res.status(404).json({ message: 'Mentor profile not found.' });
    }

    let structuredMentorName = "";
    if (mentorProfile.firstName || mentorProfile.lastName) {
      structuredMentorName = `${mentorProfile.firstName || ''} ${mentorProfile.lastName || ''}`
        .trim()
        .replace(/\s+/g, ' ');
    } else {
      structuredMentorName = mentorProfile.name ? mentorProfile.name.trim() : "";
    }

    if (!structuredMentorName) {
      return res.status(400).json({ message: 'Mentor identity is incomplete.' });
    }

    // 2. Find students under this mentor
    const students = await User.find({
      role: 'Student',
      firstmentorName: structuredMentorName
    }).select('firstName lastName name registerNo studentType mobileNo email firstmentorName secondmentorName');

    // 3. Enrich each student
    const updatedStudentArray = await Promise.all(
      students.map(async (student) => {
        // --- Approved Leave Count ---
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

        // --- Approved OD Count ---
        const odAgg = await OnDuty.aggregate([
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

        // --- Latest certificate (field is `certificate` in the OD schema) ---
        const latestODWithCert = await OnDuty.findOne({
  student: student._id,
  certificate: { $exists: true, $ne: null, $ne: "" }
})
.sort({ createdAt: -1, fromDate: -1 })
.select('certificate');

        // --- Recent Leaves (last 5) ---
        const recentLeaves = await Leave.find({ student: student._id })
          .sort({ createdAt: -1 })
          .limit(5)
          .select('fromDate toDate status duration halfDaySession createdAt')
          .lean();

        // --- Recent ODs (last 5) ---
        const recentODs = await OnDuty.find({ student: student._id })
          .sort({ createdAt: -1 })
          .limit(5)
          .select('fromDate toDate status duration halfDaySession createdAt')
          .lean();

        // 🔍 Debug logging (remove after confirming)
        console.log(`📌 Student: ${student.registerNo || student._id}`);
        console.log(`   ✅ Leaves found: ${recentLeaves.length}`);
        console.log(`   ✅ ODs found: ${recentODs.length}`);

        const studentObject = student.toObject();

        return {
          ...studentObject,
          leaveCount: leaveAgg[0]?.totalDays || 0,
          odCount: odAgg[0]?.totalDays || 0,
          certificate: latestODWithCert ? latestODWithCert.certificate : null,  // ✅ fixed field name
          leaves: recentLeaves,
          ods: recentODs
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: updatedStudentArray.length,
      data: updatedStudentArray
    });

  } catch (error) {
    console.error('❌ Mentor extraction failure:', error);
    return res.status(500).json({
      message: 'Error compiling assigned student matrices.',
      error: error.message
    });
  }
};


export const getMentorsWithStudents = async (req, res) => {
  try {
    // Find all users with role 'Mentor' (or 'Faculty')
    const mentors = await User.find({ 
      role: { $in: ['Mentor', 'Faculty'] } 
    }).select('firstName lastName name email mobileNo role category department');

    // For each mentor, get student count and also the documents? No, we only need count at this stage.
    // We'll compute counts by querying the students collection.
    const mentorData = await Promise.all(mentors.map(async (mentor) => {
      const mentorName = mentor.name || `${mentor.firstName || ''} ${mentor.lastName || ''}`.trim();
      
      // Count students for this mentor (both first and second)
      const studentCount = await User.countDocuments({
        role: 'Student',
        $or: [
          { firstmentorName: mentorName },
          { secondmentorName: mentorName }
        ]
      });

      return {
        ...mentor.toObject(),
        studentCount,
        mentorName
      };
    }));

    res.status(200).json({ success: true, data: mentorData });
  } catch (error) {
    console.error('Error fetching mentors with students:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}; 