import mongoose from 'mongoose';

export const getMyStudents = async (req, res) => {
  try {
    const mentorProfile = await User.findById(req.user._id);
    if (!mentorProfile) {
      return res.status(404).json({ message: 'Mentor profile registry not found.' });
    }

    let structuredMentorName = "";
    if (mentorProfile.firstName || mentorProfile.lastName) {
      structuredMentorName = `${mentorProfile.firstName || ''} ${mentorProfile.lastName || ''}`.trim().replace(/\s+/g, ' ');
    } else {
      structuredMentorName = mentorProfile.name ? mentorProfile.name.trim() : "";
    }

    if (!structuredMentorName) {
      return res.status(400).json({ message: 'Mentor identity string signature is unassigned or incomplete.' });
    }

    const students = await User.find({
      role: 'Student',
      firstmentorName: structuredMentorName
    }).select('firstName lastName name registerNo studentType mobileNo email firstmentorName secondmentorName');

    console.log(`[Mentor] Found ${students.length} students for mentor "${structuredMentorName}"`);

    const updatedStudentArray = await Promise.all(students.map(async (student) => {
      console.log(`[Mentor] Processing student: ${student.registerNo} (ID: ${student._id})`);

      // --- Leave & OD counts (unchanged) ---
      const leaveAgg = await Leave.aggregate([
        { $match: { student: student._id, type: 'Leave', status: 'Approved' } },
        { $project: { days: { $add: [ { $divide: [{ $subtract: ["$toDate", "$fromDate"] }, 1000*60*60*24] }, 1 ] } } },
        { $group: { _id: null, totalDays: { $sum: "$days" } } }
      ]);

      const odAgg = await OnDuty.aggregate([
        { $match: { student: student._id, type: { $in: ['On-Duty', 'OD'] }, status: 'Approved' } },
        { $project: { days: { $add: [ { $divide: [{ $subtract: ["$toDate", "$fromDate"] }, 1000*60*60*24] }, 1 ] } } },
        { $group: { _id: null, totalDays: { $sum: "$days" } } }
      ]);

      // --- 🔍 DOCUMENT FETCHING WITH EXTENSIVE LOGGING ---
      let latestODWithDoc = null;

      // 1. Try direct ObjectId match
      console.log(`[Mentor]   Attempting ObjectId match with student._id: ${student._id}`);
      let found = await OnDuty.findOne({
        student: student._id,
        document: { $exists: true, $ne: null, $ne: "" }
      })
      .sort({ createdAt: -1 })
      .select('document')
      .lean();

      if (found) {
        console.log(`[Mentor]   ✅ Found document with ObjectId match`);
        latestODWithDoc = found;
      } else {
        // 2. Try string match (convert ObjectId to string)
        const idString = student._id.toString();
        console.log(`[Mentor]   Attempting string match with: "${idString}"`);
        found = await OnDuty.findOne({
          student: idString,
          document: { $exists: true, $ne: null, $ne: "" }
        })
        .sort({ createdAt: -1 })
        .select('document')
        .lean();

        if (found) {
          console.log(`[Mentor]   ✅ Found document with string match`);
          latestODWithDoc = found;
        } else {
          // 3. Fallback: try matching by registerNo (if the field exists in OnDuty)
          console.log(`[Mentor]   Attempting registerNo match: ${student.registerNo}`);
          found = await OnDuty.findOne({
            registerNo: student.registerNo,
            document: { $exists: true, $ne: null, $ne: "" }
          })
          .sort({ createdAt: -1 })
          .select('document')
          .lean();

          if (found) {
            console.log(`[Mentor]   ✅ Found document with registerNo match`);
            latestODWithDoc = found;
          }
        }
      }

      if (!latestODWithDoc) {
        console.log(`[Mentor]   ❌ No document found for student ${student.registerNo}`);
      }

      const studentObject = student.toObject();
      return {
        ...studentObject,
        leaveCount: leaveAgg[0]?.totalDays || 0,
        odCount: odAgg[0]?.totalDays || 0,
        document: latestODWithDoc ? latestODWithDoc.document : null
      };
    }));

    return res.status(200).json({ success: true, count: updatedStudentArray.length, data: updatedStudentArray });

  } catch (error) {
    console.error('[Mentor] Error:', error);
    return res.status(500).json({
      message: 'Error compiling assigned student matrices.',
      error: error.message
    });
  }
};