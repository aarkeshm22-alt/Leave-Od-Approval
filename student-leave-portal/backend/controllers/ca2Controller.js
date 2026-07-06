import User from '../models/User.js';
import Leave from '../models/Leave.js';
import OnDuty from '../models/OnDuty.js';

/**
 * GET /api/ca2/my-students
 * Returns all students where the logged-in CA2 is the second mentor (secondmentorName).
 * Includes leave/OD counts, certificate (from ODs), and full leave/OD history.
 */
export const getCA2Students = async (req, res) => {
  try {
    // 1. Get the logged-in CA2 mentor
    const mentor = await User.findById(req.user.id);
    if (!mentor) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Ensure the user is a mentor with CA2 category (optional but recommended)
    if (mentor.role !== 'Mentor' || mentor.category !== 'CA2') {
      return res.status(403).json({ message: 'Access denied. CA2 mentors only.' });
    }

    // Build mentor's full name (same format as stored in student documents)
    let structuredMentorName = "";
    if (mentor.firstName || mentor.lastName) {
      structuredMentorName = `${mentor.firstName || ''} ${mentor.lastName || ''}`
        .trim()
        .replace(/\s+/g, ' ');
    } else {
      structuredMentorName = mentor.name ? mentor.name.trim() : "";
    }

    if (!structuredMentorName) {
      return res.status(400).json({ message: 'Mentor name is missing.' });
    }

    // 2. Find students where secondmentorName matches (case-insensitive)
    const students = await User.find({
      role: 'Student',
      secondmentorName: { $regex: new RegExp(`^${structuredMentorName}$`, 'i') }
    }).select('firstName lastName name year section registerNo studentType mobileNo email firstmentorName secondmentorName department');

    // 3. Enrich each student with leave/OD counts, certificate, and full history
    const enrichedStudents = await Promise.all(
      students.map(async (student) => {
        console.log(`📌 Processing CA2 student: ${student.registerNo || student._id}`);

        // --- Leave count (approved) ---
        const leaveAgg = await Leave.aggregate([
          { $match: { student: student._id, type: 'Leave', status: 'Approved' } },
          {
            $project: {
              days: {
                $add: [
                  { $divide: [{ $subtract: ['$toDate', '$fromDate'] }, 1000 * 60 * 60 * 24] },
                  1
                ]
              }
            }
          },
          { $group: { _id: null, totalDays: { $sum: '$days' } } }
        ]);

        // --- OD count (approved) ---
        const odAgg = await OnDuty.aggregate([
          { $match: { student: student._id, type: { $in: ['On-Duty', 'OD'] }, status: 'Approved' } },
          {
            $project: {
              days: {
                $add: [
                  { $divide: [{ $subtract: ['$toDate', '$fromDate'] }, 1000 * 60 * 60 * 24] },
                  1
                ]
              }
            }
          },
          { $group: { _id: null, totalDays: { $sum: '$days' } } }
        ]);

        // --- Certificate: scan all ODs and pick the first with a certificate ---
        const allODs = await OnDuty.find({ student: student._id })
          .sort({ createdAt: -1 })
          .select('certificate')
          .lean();

        let certificate = null;
        for (const od of allODs) {
          if (od.certificate && od.certificate.length > 0) {
            certificate = od.certificate;
            break;
          }
        }

        // --- Full leave history (all leaves) ---
        const allLeaves = await Leave.find({ student: student._id })
          .sort({ createdAt: -1 })
          .select('fromDate toDate status duration reason halfDaySession createdAt')
          .lean();

        // --- Full OD history (all ODs) ---
        const allODsForList = await OnDuty.find({ student: student._id })
          .sort({ createdAt: -1 })
          .select('fromDate toDate status duration reason halfDaySession createdAt')
          .lean();

        const studentObject = student.toObject();
        return {
          ...studentObject,
          leaveCount: leaveAgg[0]?.totalDays || 0,
          odCount: odAgg[0]?.totalDays || 0,
          certificate,
          leaves: allLeaves,
          ods: allODsForList
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: enrichedStudents.length,
      data: enrichedStudents
    });
  } catch (error) {
    console.error('❌ CA2 student fetch error:', error);
    return res.status(500).json({
      message: 'Error fetching CA2 students.',
      error: error.message
    });
  }
};