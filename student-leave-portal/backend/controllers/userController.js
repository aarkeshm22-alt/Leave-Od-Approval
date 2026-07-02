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
    // 1. Resolve logged-in HOD name safely
    const currentHodName = `${req.user?.firstName || ''} ${req.user?.lastName || ''}`.trim() || req.user?.name;

    if (!currentHodName) {
      return res.status(400).json({
        success: false,
        message: 'Authentication token is missing valid HOD name attributes.'
      });
    }

    // 2. Direct Raw Database Access Layer
    const rawUserCollection = mongoose.connection.db.collection('users');

    // Escaped loose case-insensitive matching rule for the HOD's name assignment
    const escapedHodName = currentHodName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const hodRegex = new RegExp(escapedHodName, 'i');

    // Fetch mentors under this HOD directly from raw MongoDB
    const mentors = await rawUserCollection.find({
      role: 'Mentor',
      hodName: hodRegex
    }).toArray();

    if (!mentors || mentors.length === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    // 3. Loop through mentors to synchronize student counts safely
    const synchronizedMentors = await Promise.all(
      mentors.map(async (mentor) => {
        const mentorFullName = mentor.name || `${mentor.firstName || ''} ${mentor.lastName || ''}`.trim();
        const mentorCategory = mentor.category; // 'CA1' or 'CA2'

        // Prepare safe, flexible regex matching for this specific mentor's name string
        const escapedMentorName = mentorFullName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const mentorRegexRule = new RegExp(`^${escapedMentorName}$`, 'i');
        const fallbackLooseRegexRule = new RegExp(escapedMentorName, 'i');

        let studentCountQuery = { role: 'Student' };

        // Precise query filtering following student assignment matrix paths
        if (mentorCategory === 'CA1') {
          studentCountQuery.firstmentorName = mentorRegexRule;
        } else if (mentorCategory === 'CA2') {
          studentCountQuery.secondmentorName = mentorRegexRule;
        } else {
          studentCountQuery.$or = [
            { firstmentorName: mentorRegexRule },
            { secondmentorName: mentorRegexRule }
          ];
        }

        // Count matching documents using direct collection operations
        let realStudentCount = await rawUserCollection.countDocuments(studentCountQuery);

        // Fallback loose match validation if the exact match comes up empty due to string irregularities
        if (realStudentCount === 0) {
          if (mentorCategory === 'CA1') {
            studentCountQuery.firstmentorName = fallbackLooseRegexRule;
          } else if (mentorCategory === 'CA2') {
            studentCountQuery.secondmentorName = fallbackLooseRegexRule;
          } else {
            studentCountQuery.$or = [
              { firstmentorName: fallbackLooseRegexRule },
              { secondmentorName: fallbackLooseRegexRule }
            ];
          }
          realStudentCount = await rawUserCollection.countDocuments(studentCountQuery);
        }

        return {
          ...mentor,
          _id: mentor._id.toString(), // Ensure Object ID parses seamlessly into React mapping keys
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
    const { mentorName, category } = req.query;

    // Build the base query
    let query = { role: 'Student' };

    // If mentorName is provided, filter by mentor fields
    if (mentorName && mentorName.trim() !== '') {
      const cleanName = mentorName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const caseInsensitiveRegex = new RegExp(`^${cleanName}$`, 'i');

      const mentorFields = [];
      if (category === 'CA1') {
        mentorFields.push('firstmentorName');
      } else if (category === 'CA2') {
        mentorFields.push('secondmentorName');
      } else {
        mentorFields.push('firstmentorName', 'secondmentorName');
      }

      query.$or = mentorFields.map(field => ({
        [field]: { $regex: caseInsensitiveRegex }
      }));
    }

    // If no mentorName, return all students (HOD view)
    // No additional filter needed

    console.log('[getStudentsByMentor] Query:', JSON.stringify(query));

    const students = await User.find(query)
      .select('firstName lastName name registerNo studentType mobileNo email firstmentorName secondmentorName year section')
      .lean();

    console.log(`[getStudentsByMentor] Found ${students.length} students`);

    // Enrich with leave/OD counts and document
    const enrichedStudents = await Promise.all(students.map(async (student) => {
      // Count leaves and ODs
      const leaveCount = await Leave.countDocuments({
        student: student._id,
        type: 'Leave',
        status: 'Approved'
      });

      const odCount = await OnDuty.countDocuments({
        student: student._id,
        type: { $in: ['On-Duty', 'OD'] },
        status: 'Approved'
      });

      // Fetch latest document
      let document = null;
      try {
        const docResult = await OnDuty.findOne({
          student: student._id,
          document: { $exists: true, $ne: null, $ne: "" }
        })
        .sort({ createdAt: -1 })
        .select('document')
        .lean();

        if (docResult) {
          document = docResult.document;
        }
      } catch (err) {
        console.warn(`Could not fetch document for student ${student._id}:`, err.message);
      }

      return {
        ...student,
        name: student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim(),
        leaveCount: leaveCount,
        odCount: odCount,
        document: document
      };
    }));

    return res.status(200).json({
      success: true,
      data: enrichedStudents
    });

  } catch (error) {
    console.error('Error in getStudentsByMentor:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching students.',
      error: error.message
    });
  }
};