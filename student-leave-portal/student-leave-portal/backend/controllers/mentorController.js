import User from '../models/User.js';
import Leave from '../models/Leave.js';
import OnDuty from '../models/OnDuty.js';
import mongoose from 'mongoose';

export const getMyStudents = async (req, res) => {
  try {
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

    const students = await User.find({
      role: 'Student',
      firstmentorName: structuredMentorName
    }).select('firstName lastName name year section registerNo studentType mobileNo email firstmentorName secondmentorName department');

    const updatedStudentArray = await Promise.all(
      students.map(async (student) => {
        console.log(`\n📌 Processing student: ${student.registerNo || student._id}`);

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

        // --- Fetch ALL ODs (for certificates and recent applications) ---
        const allODs = await OnDuty.find({ student: student._id })
          .sort({ createdAt: -1 })
          .select('certificate reason fromDate toDate status duration halfDaySession createdAt')
          .lean();

        // --- Fetch ALL Leaves (for recent applications) ---
        const allLeaves = await Leave.find({ student: student._id })
          .sort({ createdAt: -1 })
          .select('fromDate toDate status duration reason halfDaySession createdAt')
          .lean();

        // --- Pick the first certificate as legacy fallback ---
        let firstCertificate = null;
        for (const od of allODs) {
          if (od.certificate && od.certificate.length > 0) {
            firstCertificate = od.certificate;
            break;
          }
        }

        const studentObject = student.toObject();

        return {
          ...studentObject,
          leaveCount: leaveAgg[0]?.totalDays || 0,
          odCount: odAgg[0]?.totalDays || 0,
          certificate: firstCertificate,    // legacy – first OD’s certificate
          ods: allODs,                     // ✅ FULL OD array with all certificates
          leaves: allLeaves                // ✅ FULL leaves array
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
    }).select('firstName lastName name year section email mobileNo role  category department');

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