import User from '../models/User.js';
import Leave from '../models/Leave.js';
import OnDuty from '../models/OnDuty.js';

/**
 * GET /api/ca2/my-students
 * Returns all students where the logged-in CA2 is the second mentor (secondmentorName).
 * Includes leave/OD counts, full OD array (with certificates), and full leave/OD history.
 */
export const getCA2Students = async (req, res) => {
  try {
    const mentor = await User.findById(req.user.id);
    if (!mentor) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Optional: enforce CA2 role
    if (mentor.role !== 'Mentor' || mentor.category !== 'CA2') {
      return res.status(403).json({ message: 'Access denied. CA2 mentors only.' });
    }

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

    // Find students where secondmentorName matches (case-insensitive)
    const students = await User.find({
      role: 'Student',
      secondmentorName: { $regex: new RegExp(`^${structuredMentorName}$`, 'i') }
    }).select('firstName lastName name year section registerNo studentType mobileNo email firstmentorName secondmentorName department');

    const enrichedStudents = await Promise.all(
      students.map(async (student) => {
        console.log(`📌 Processing CA2 student: ${student.registerNo || student._id}`);

        // --- Approved Leave Count ---
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

        // --- Approved OD Count ---
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

        // --- Fetch ALL ODs with ALL needed fields (including certificate) ---
        const allODs = await OnDuty.find({ student: student._id })
          .sort({ createdAt: -1 })
          .select('certificate reason fromDate toDate status duration halfDaySession createdAt')
          .lean();

        // --- Fetch ALL Leaves ---
        const allLeaves = await Leave.find({ student: student._id })
          .sort({ createdAt: -1 })
          .select('fromDate toDate status duration reason halfDaySession createdAt')
          .lean();

        // --- Extract first certificate (legacy) from the same `allODs` array ---
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
          certificate: firstCertificate,   // legacy – first OD’s certificate
          leaves: allLeaves,               // ✅ full leaves array
          ods: allODs                      // ✅ full ODs array WITH certificates
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