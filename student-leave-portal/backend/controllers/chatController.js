import Chat from '../models/Chat.js';
import User from '../models/User.js';

// ==========================================
// STUDENT CONTROLLERS
// ==========================================

// @desc    Send anonymous message to HOD
// @route   POST /api/chat/send
// @access  Private (Student only)
export const sendAnonymousMessage = async (req, res) => {
  try {
    console.log('📩 Received message request:', req.body);
    console.log('👤 User ID:', req.user?.id);

    const { message, category, priority, attachments } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Message content is required' 
      });
    }

    const student = await User.findById(req.user.id);
    
    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: 'Student not found' 
      });
    }

    console.log('🎓 Student year from DB:', student.year);

    // ✅ FIX: Extract year properly
    let studentYear = 'I'; // Default
    
    if (student.year) {
      const yearStr = String(student.year).trim();
      
      // Check for exact matches first
      if (yearStr === 'I' || yearStr === '1' || yearStr === '1st' || yearStr === 'First' || yearStr === 'I Year' || yearStr === '1 Year') {
        studentYear = 'I';
      } else if (yearStr === 'II' || yearStr === '2' || yearStr === '2nd' || yearStr === 'Second' || yearStr === 'II Year' || yearStr === '2 Year') {
        studentYear = 'II';
      } else if (yearStr === 'III' || yearStr === '3' || yearStr === '3rd' || yearStr === 'Third' || yearStr === 'III Year' || yearStr === '3 Year') {
        studentYear = 'III';
      } else if (yearStr === 'IV' || yearStr === '4' || yearStr === '4th' || yearStr === 'Fourth' || yearStr === 'IV Year' || yearStr === '4 Year') {
        studentYear = 'IV';
      } else {
        // Check for numbers in the string
        if (yearStr.includes('1') || yearStr.includes('I')) studentYear = 'I';
        else if (yearStr.includes('2') || yearStr.includes('II')) studentYear = 'II';
        else if (yearStr.includes('3') || yearStr.includes('III')) studentYear = 'III';
        else if (yearStr.includes('4') || yearStr.includes('IV')) studentYear = 'IV';
      }
    }

    console.log('📅 Extracted studentYear:', studentYear);

    const chatMessage = new Chat({
      student: req.user.id,
      studentYear: studentYear,
      studentSection: student.section || '',
      studentDepartment: student.department || student.deptCode || '',
      message: message.trim(),
      category: category || 'general',
      priority: priority || 'medium',
      attachments: attachments || [],
      isAnonymous: true,
      isRead: false,
      isReplied: false,
      status: 'pending'
    });

    await chatMessage.save();
    console.log('✅ Message saved!');

    // Return simple response for student
    const response = {
      _id: chatMessage._id,
      message: chatMessage.message,
      section: chatMessage.studentSection,
      createdAt: chatMessage.createdAt,
      isRead: chatMessage.isRead,
      reply: chatMessage.reply,
      repliedAt: chatMessage.repliedAt
    };

    res.status(201).json({
      success: true,
      message: 'Message sent anonymously to HOD',
      data: response
    });
  } catch (error) {
    console.error('❌ Send message error:', error);
    console.error('❌ Error stack:', error.stack);
    
    res.status(500).json({ 
      success: false,
      message: 'Server Error: ' + error.message
    });
  }
};

// @desc    Get student's own messages
// @route   GET /api/chat/my-messages
// @access  Private (Student only)
export const getMyMessages = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const filter = { student: req.user.id };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await Chat.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('message isRead reply repliedAt createdAt');

    const formattedMessages = messages.map(msg => ({
      _id: msg._id,
      message: msg.message,
      section: msg.studentSection,
      isViewed: msg.isRead,
      reply: msg.reply || null,
      repliedAt: msg.repliedAt || null,
      createdAt: msg.createdAt
    }));

    const total = await Chat.countDocuments(filter);

    res.json({
      success: true,
      data: formattedMessages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server Error: ' + error.message 
    });
  }
};

// ==========================================
// HOD CONTROLLERS
// ==========================================

// @desc    Get all anonymous messages for HOD
// @route   GET /api/chat/hod/messages
// @access  Private (HOD only)
export const getHodMessages = async (req, res) => {
  try {
    const { year, page = 1, limit = 20 } = req.query;
    
    const filter = {};
    if (year && year !== 'all') filter.studentYear = year;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await Chat.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-student -__v -attachments -studentDepartment -category -priority -status -isReplied -reply -repliedAt');

    // ✅ Format response - Include full message when revealed
    const formattedMessages = messages.map(msg => ({
      _id: msg._id,
      studentYear: msg.studentYear,
      studentSection: msg.studentSection,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
      isRead: msg.isRead,
      message: msg.message  // ✅ Always send message content (but hidden in UI if not read)
    }));

    const total = await Chat.countDocuments(filter);

    const totalMessages = await Chat.countDocuments();
    const unreadMessages = await Chat.countDocuments({ isRead: false });
    const viewedMessages = await Chat.countDocuments({ isRead: true });

    res.json({
      success: true,
      data: formattedMessages,
      stats: {
        total: totalMessages,
        pending: unreadMessages,
        viewed: viewedMessages,
        unread: unreadMessages
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('❌ Get HOD messages error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server Error: ' + error.message 
    });
  }
};

// @desc    HOD views a specific message (make it visible)
// @route   PUT /api/chat/hod/view/:id
// @access  Private (HOD only)
export const viewMessage = async (req, res) => {
  try {
    const messageId = req.params.id;

    const message = await Chat.findById(messageId);

    if (!message) {
      return res.status(404).json({ 
        success: false,
        message: 'Message not found' 
      });
    }

    // ✅ Mark as read/viewed
    message.isRead = true;
    await message.save();

    // ✅ Return the full message content with all details
    res.json({
      success: true,
      message: 'Message viewed successfully',
      data: {
        _id: message._id,
        message: message.message,
        studentYear: message.studentYear,
        studentSection: message.studentSection,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
        isRead: message.isRead
      }
    });
  } catch (error) {
    console.error('❌ View message error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server Error: ' + error.message 
    });
  }
};
// @desc    Get single message details (for HOD after viewing)
// @route   GET /api/chat/hod/message/:id
// @access  Private (HOD only)
export const getHodMessageById = async (req, res) => {
  try {
    const message = await Chat.findById(req.params.id)
      .select('-student -__v -attachments -studentDepartment');

    if (!message) {
      return res.status(404).json({ 
        success: false,
        message: 'Message not found' 
      });
    }

    // ✅ Only return full message if it's been viewed
    res.json({
      success: true,
      data: {
        _id: message._id,
        message: message.isRead ? message.message : null,
        studentYear: message.studentYear,
        studentSection: message.studentSection,
        createdAt: message.createdAt,
        isRead: message.isRead
      }
    });
  } catch (error) {
    console.error('Get message error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server Error: ' + error.message 
    });
  }
};

// @desc    Get message statistics for HOD dashboard
// @route   GET /api/chat/hod/stats
// @access  Private (HOD only)
export const getHodStats = async (req, res) => {
  try {
    const total = await Chat.countDocuments();
    const unread = await Chat.countDocuments({ isRead: false });
    const viewed = await Chat.countDocuments({ isRead: true });

    // Year-wise distribution
    const yearStats = await Chat.aggregate([
      {
        $group: {
          _id: '$studentYear',
          section: { $first: '$studentSection' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          total,
          pending: unread,    // ✅ Pending = Unread messages
          viewed,
          unread
        },
        yearDistribution: yearStats
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server Error: ' + error.message 
    });
  }
};

// @desc    Delete message
// @route   DELETE /api/chat/message/:id
// @access  Private
export const deleteMessage = async (req, res) => {
  try {
    const message = await Chat.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ 
        success: false,
        message: 'Message not found' 
      });
    }

    const isStudent = req.user.role === 'Student' && message.student.toString() === req.user.id;
    const isHod = req.user.role === 'HOD';

    if (!isStudent && !isHod) {
      return res.status(403).json({ 
        success: false,
        message: 'Unauthorized to delete this message' 
      });
    }

    await message.deleteOne();

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server Error: ' + error.message 
    });
  }
};