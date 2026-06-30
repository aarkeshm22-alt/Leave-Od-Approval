// controllers/userController.js
import User from '../models/User.js';
import Leave from '../models/Leave.js'; // Import the Leave model to count leave and OD records 
import OnDuty from '../models/OnDuty.js';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// 1. Fetch HODs for selection dropdown
export const getHods = async (req, res) => {
  try {
    const hods = await User.find({ role: 'HOD' }).select('_id firstName lastName department');
    return res.status(200).json(hods);
  } catch (error) {
    return res.status(500).json({ message: 'Server error pulling HOD database records.' });
  }
};

// 2. Fetch Mentors for selection dropdown - UPGRADED TO INCLUDE CONTACT INFRASTRUCTURE & CATEGORY
export const getAllMentors = async (req, res) => {
  try {
    const mentors = await User.find({ role: 'Mentor' }).select('_id firstName lastName department email mobileNo role category');
    return res.status(200).json(mentors);
  } catch (error) {
    return res.status(500).json({ message: 'Server error pulling Mentor database records.' });
  }
};

// 3. Sample controller to pull complete student profiles
// Check your auth or user controller (e.g., getStudentProfile)
export const getStudentProfile = async (req, res) => {
  try {
    // 🫵 FIX THIS ONE TOO! Ensure it doesn't have mixed selection statements.
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Process Account Registration Pipeline
export const registerUser = async (req, res) => {
  try {
    const {
      role, firstName, lastName, gender, department,
      email, mobileNo, password, year, section, studentType,
      firstmentorName, secondmentorName, hodName, category,
      registerNo // CAPTURE REGISTRATION NUMBER FROM FRONTEND
    } = req.body;

    // Check email duplication
    const userExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (userExists) {
      return res.status(400).json({ message: 'This email address is already registered.' });
    }

    // EXCLUSIVE STUDENT REGISTER NUMBER DUPLICATION CHECK
    if (role === 'Student' && registerNo) {
      const regNoExists = await User.findOne({ registerNo: registerNo.trim() });
      if (regNoExists) {
        return res.status(400).json({ message: `Conflict: Register Number "${registerNo}" is already assigned to an existing student account.` });
      }
    }

    // Encrypt security password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Dynamic payload building mapping string targets
    const newUserPayload = {
      role, firstName, lastName, gender, department,
      email: email.toLowerCase().trim(),
      mobileNo,
      password: hashedPassword,
      // MAP FIELD IN EXCLUSIVE STUDENT STRUCTURAL SPREAD
      ...(role === 'Student' && { registerNo: registerNo?.trim(), year, section, studentType, firstmentorName, secondmentorName }),
      ...(role === 'Mentor' && { hodName, category }) // Persists CA1 / CA2 categorization fields natively
    };

    const newUser = new User(newUserPayload);
    await newUser.save();

    return res.status(201).json({ message: 'User profile created successfully!' });
  } catch (error) {
    console.error("Detailed DB Save Error:", error);

    // Handle manual Mongo Duplicate Key Index error (#11000) gracefully
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyValue)[0];
      return res.status(400).json({ message: `The provided ${duplicateField} is already registered on our servers.` });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: `Validation Failed: ${messages.join(', ')}` });
    }

    return res.status(500).json({ message: 'Registration failure. Validate payload constraints.' });
  }
};

// 5. Secure Session Generation Pipeline
export const loginUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validate explicit input presence
    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Please provide email, password, and role.' });
    }

    // Locate the user by institutional email address
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid institutional credentials.' });
    }

    // Prevent cross-role spoofing
    if (user.role.toLowerCase() !== role.toLowerCase()) {
      return res.status(403).json({
        message: `Access denied. Your profile is registered as a ${user.role}, not an ${role}.`
      });
    }

    // Verify password encryption integrity
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid institutional credentials.' });
    }

    // Generate a secure signing token (JWT)
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'fallback_super_secret_key_change_this',
      { expiresIn: '1d' }
    );

    // Strip the encrypted password hash from the return payload
    const userResponse = {
      _id: user._id,
      name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      email: user.email,
      role: user.role,
      department: user.department,
      studentType: user.studentType || 'Regular Track',
      mobile: user.mobileNo || 'Not Provided',
      ...(user.role === 'Mentor' && { category: user.category }),
      ...(user.role === 'Student' && { registerNo: user.registerNo, year: user.year, section: user.section })
    };

    return res.status(200).json({
      message: 'Session authenticated successfully.',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Core Login Pipeline Exception:', error);
    return res.status(500).json({ message: 'Internal server authorization loop failure.' });
  }
};

// 6. Get all registered mentors assigned to the logged-in HOD with accurate dynamic allocation routing
export const getMentorsByHod = async (req, res) => {
  try {
    const currentHodName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.name;

    if (!currentHodName) {
      return res.status(400).json({
        success: false,
        message: 'Authentication token is missing valid HOD name attributes.'
      });
    }

    // Force inclusion of critical fields just in case they are marked select: false on User Schema
    const mentors = await User.find({
      role: 'Mentor',
      hodName: { $regex: currentHodName, $options: 'i' }
    }).select('+email +mobileNo +role +hodName -password +category').lean();

    const synchronizedMentors = await Promise.all(
      mentors.map(async (mentor) => {
        const mentorFullName = mentor.name || `${mentor.firstName || ''} ${mentor.lastName || ''}`.trim();
        const mentorCategory = mentor.category; // Labeled as 'CA1' or 'CA2' natively

        // Precise assignment query routing based on mentor category attribute mapping
        let studentCountQuery = { role: 'Student' };
        if (mentorCategory === 'CA1') {
          studentCountQuery.firstmentorName = mentorFullName;
        } else if (mentorCategory === 'CA2') {
          studentCountQuery.secondmentorName = mentorFullName;
        } else {
          // Robust system fallback parameters if categories aren't configured yet
          studentCountQuery.$or = [
            { firstmentorName: mentorFullName },
            { secondmentorName: mentorFullName }
          ];
        }

        const realStudentCount = await User.countDocuments(studentCountQuery);

        return {
          ...mentor,
          capacity: realStudentCount
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: synchronizedMentors
    });

  } catch (error) {
    console.error('Error calculating dynamic mentor allocation statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Server failed aggregating real-time allocation records.',
      error: error.message
    });
  }
};

export const getStudentsByMentor = async (req, res) => {
  try {
    // 🌟 1. COMPLETELY BULLETPROOF CHECK: Safe extraction using Optional Chaining (?.)
    const userFirstName = req.user?.firstName || '';
    const userLastName = req.user?.lastName || '';
    let loggedInMentorName = `${userFirstName} ${userLastName}`.trim();

    // Fallback if firstName/lastName aren't populated but 'name' property is present
    if (!loggedInMentorName && req.user?.name) {
      loggedInMentorName = req.user.name.trim();
    }

    // 🌟 2. EXPLICIT STATUS HANDLING: Fail with a clear 401 instead of crashing with a 500
    if (!req.user || !loggedInMentorName) {
      return res.status(401).json({
        success: false,
        message: "Authentication failure. The route middleware is missing 'protect', or the logged-in user profile has no name attributes."
      });
    }

    // 3. REGEX & DATABASE SEARCH
    const escapedMentorName = loggedInMentorName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const mentorRegex = new RegExp(`^${escapedMentorName}$`, 'i');

    const studentFindQuery = {
      role: 'Student',
      $or: [
        { firstmentorName: { $regex: mentorRegex } },
        { secondmentorName: { $regex: mentorRegex } }
      ]
    };

    // Keep the rest of your User.find() and map tracking blocks exactly the same...

    // Execute Mongo query using .lean() for rapid rendering speeds
    const students = await User.find(studentFindQuery)
      .select('firstName lastName name registerNo studentType email mobileNo firstmentorName secondmentorName year yr section sec role')
      .lean();

    if (!students || students.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }

    // 4. METRICS AGGREGATION: Loop safely without throwing undefined property crashes
    const structuredStudentsPayload = await Promise.all(
      students.map(async (student) => {
        // Double-check element allocation to prevent loop execution blocks
        if (!student) return null;

        // Extract values safely casting to string wrappers
        const currentFirstMentor = student.firstmentorName ? String(student.firstmentorName).trim().toLowerCase() : '';
        const targetSearchString = loggedInMentorName.toLowerCase();

        // Label if this student belongs to them as a CA1 or CA2 advisor
        const isFirstMentor = currentFirstMentor === targetSearchString;
        const assignedRoleContext = isFirstMentor ? "CA1" : "CA2";

        let liveLeaveCount = 0;
        let liveOdCount = 0;

        // Fetch leave records safely wrapped away
        try {
          const LeaveModel = mongoose.models.Leave || global.Leave;
          if (LeaveModel) {
            const leaveRecords = await LeaveModel.find({ student: student._id });
            if (Array.isArray(leaveRecords)) {
              liveLeaveCount = leaveRecords.filter(item => item.type && String(item.type).toLowerCase() === 'leave').length;
              liveOdCount = leaveRecords.filter(item => item.type && String(item.type).toLowerCase() === 'od').length;
            }
          }
        } catch (dbErr) {
          console.error(`Sub-metrics tracing skipped for student ID ${student._id}:`, dbErr.message);
        }

        return {
          ...student,
          mentorType: assignedRoleContext,
          leaveCount: liveLeaveCount,
          odCount: liveOdCount
        };
      })
    );

    // Remove any unexpected null entries
    const polishedPayload = structuredStudentsPayload.filter(Boolean);

    return res.status(200).json({
      success: true,
      count: polishedPayload.length,
      data: polishedPayload
    });

  } catch (error) {
    console.error('🔴 EXPLICIT BACKEND CRASH LOG:', error);
    return res.status(500).json({
      success: false,
      message: 'Server failed compiling context matrix counters.',
      error: error.message
    });
  }
};