// server.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js'; 
import { protect } from './middleware/authMiddleware.js'; 
import User from './models/User.js'; 
import mentorRoutes from './routes/mentorRoutes.js'; 
import odRoutes from './routes/odRoutes.js'; 

dotenv.config(); 

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Reference connection URI from system environment safely
const MONGO_URI = process.env.MONGODB_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log('✓ Successfully locked into MongoDB Instance Database.'))
  .catch((err) => console.error('✗ Core Database synchronization failure:', err));

/**
 * Route Mount Setup
 */

// 1. Root Route (Fixes the "Cannot GET /" error)
app.get('/', (req, res) => {
  res.json({
    status: 'active',
    message: '🚀 Gateway Server is running smoothly and ready to accept requests.'
  });
});

// 2. API Routes
app.use('/api', authRoutes);
app.use('/api/leaves', leaveRoutes); 
app.use('/api/od', odRoutes); 
app.use('/api/mentor', mentorRoutes); 

// 3. User Profile Protected Route
app.get('/api/users/profile', protect, async (req, res) => {
  try {
    // Look up the logged-in user using the ID stored in the JWT token
    // and populate their mentor's name automatically
    const user = await User.findById(req.user.id).populate('mentorId', 'name');
    
    if (!user) {
      return res.status(404).json({ message: 'User reference missing.' });
    }

    // Return the fields exactly as your React frontend expects them
    res.json({
      name: user.name,
      studentType: user.studentType || 'Regular Track',
      mobile: user.mobile || 'Not Provided',
      mentorName: user.mentorId ? user.mentorId.name : 'Not Assigned'
    });
  } catch (error) {
    console.error('Profile Retrieval Error:', error);
    res.status(500).json({ message: 'Error retrieving user profile from the database.' });
  }
});

// Pull deployment target gateway port dynamically 
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Gateway Server active and serving requests on port: ${PORT}`);
});