// controllers/userController.js
import User from '../models/User.js';
import Leave from '../models/Leave.js'; // Import the Leave model to count leave and OD records 
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

// Sample controller to match the route above
export const getAllStudents = async (req, res) => {
  try {
    const allStudents = await User.find({ role: 'Student' }).select('-password');
    res.status(200).json({ success: true, data: allStudents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Process Account Registration Pipeline
export const registerUser = async (req, res) => {
  try {
    const { 
      role, firstName, lastName, gender, department, 
      email, mobileNo, password, year, section, studentType, 
      mentorName, hodName,
      registerNo // <-- 1. CAPTURE REGISTRATION NUMBER FROM FRONTEND
    } = req.body;

    // Check email duplication
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'This email address is already registered.' });
    }

    // <-- 2. EXCLUSIVE STUDENT REGISTER NUMBER DUPLICATION CHECK
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
      role, firstName, lastName, gender, department, email, mobileNo,
      password: hashedPassword,
      // <-- 3. MAP FIELD IN EXCLUSIVE STUDENT STRUCTURAL SPREAD
      ...(role === 'Student' && { registerNo: registerNo?.trim(), year, section, studentType, mentorName }),
      ...(role === 'Mentor' && { hodName })
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

export const loginUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // 1. Validate explicit input presence
    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Please provide email, password, and role.' });
    }

    // 2. Locate the user by institutional email address
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid institutional credentials.' });
    }

    // 3. Prevent cross-role spoofing
    if (user.role !== role) {
      return res.status(403).json({ 
        message: `Access denied. Your profile is registered as a ${user.role}, not an ${role}.` 
      });
    }

    // 4. Verify password encryption integrity
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid institutional credentials.' });
    }

    // 5. Generate a secure signing token (JWT) using 'id' to match protect middleware
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'fallback_super_secret_key_change_this',
      { expiresIn: '1d' }
    );

    // 6. Strip the encrypted password hash from the return payload
    const userResponse = {
      _id: user._id,
      name: user.name, // Ensure this maps to user profile fields
      email: user.email,
      role: user.role,
      department: user.department,
      studentType: user.studentType || 'Regular Track',
      mobile: user.mobile || 'Not Provided',
      ...(user.role === 'Student' && { registerNo: user.registerNo, year: user.year, section: user.section })
    };

    // 7. Dispatch payload back to frontend
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
// @desc    Get all registered mentors assigned to the logged-in HOD
// @route   GET /api/users/mentors
// @desc    Get all registered mentors assigned to the logged-in HOD with live allocation counts
// @route   GET /api/users/mentors
// @desc    Get all registered mentors assigned to the logged-in HOD with live allocation counts
export const getMentorsByHod = async (req, res) => {
  try {
    const currentHodName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.name;

    if (!currentHodName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Authentication token is missing valid HOD name attributes.' 
      });
    }

    // Force inclusion of critical fields just in case they are marked select: false on your main User Schema
    const mentors = await User.find({
      role: 'Mentor',
      hodName: { $regex: currentHodName, $options: 'i' }
    }).select('+email +mobileNo +role +hodName -password').lean(); // Explicitly forcing +email +mobileNo inclusion here!

    const synchronizedMentors = await Promise.all(
      mentors.map(async (mentor) => {
        const mentorFullName = mentor.name || `${mentor.firstName || ''} ${mentor.lastName || ''}`.trim();

        const realStudentCount = await User.countDocuments({
          role: 'Student',
          mentorName: mentorFullName
        });

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
// @desc    Get all active registered students allocated under a specific mentor name string signature
// @route   GET /api/users/students-by-mentor
// @desc    Get all students assigned to a mentor with aggregated live Leave and OD counts
// @route   GET /api/users/students-by-mentor
export const getStudentsByMentor = async (req, res) => {
  try {
    const { mentorName } = req.query;

    if (!mentorName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mentor tracking parameter variable is required.' 
      });
    }

    // 1. Fetch all regular students matched to this mentor
    const students = await User.find({
      role: 'Student',
      mentorName: mentorName
    }).select('firstName lastName name registerNo studentType email mobileNo').lean();

    // 2. Map through students and aggregate their true live records from your Leave collection
    const structuredStudentsPayload = await Promise.all(
      students.map(async (student) => {
        
        // 🚀 THE FIX: Query using the 'student' field with the student's database _id
        const leaveRecords = await Leave.find({
          student: student._id
        });

        // Loop and count entries dynamically based on the application 'type' property
        // (Handles case-insensitive matches perfectly for "Leave" and "OD")
        const liveLeaveCount = leaveRecords.filter(item => item.type?.toLowerCase() === 'leave').length;
        const liveOdCount = leaveRecords.filter(item => item.type?.toLowerCase() === 'od').length;

        return {
          ...student,
          leaveCount: liveLeaveCount,
          odCount: liveOdCount
        };
      })
    );

    return res.status(200).json({ 
      success: true, 
      data: structuredStudentsPayload 
    });

  } catch (error) {
    console.error('Error calculating dynamic profile matrix metrics:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server failed compiling context matrix counters.', 
      error: error.message 
    });
  }
};

// 2. Fetch Mentors for selection dropdown - UPGRADED TO INCLUDE CONTACT INFRASTRUCTURE
export const getAllMentors = async (req, res) => {
  try {
    // ADDED: email and mobileNo explicitly to the selection string
    const mentors = await User.find({ role: 'Mentor' }).select('_id firstName lastName department email mobileNo role');
    return res.status(200).json(mentors);
  } catch (error) {
    return res.status(500).json({ message: 'Server error pulling Mentor database records.' });
  }
};