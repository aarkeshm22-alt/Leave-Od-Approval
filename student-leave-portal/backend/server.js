// server.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js'; // 1. Import your newly created leave routes
import { protect } from './middleware/authMiddleware.js'; // 2. Import your auth middleware
import User from './models/User.js'; // 3. Import User model to fetch profile data
import mentorRoutes from './routes/mentorRoutes.js'; // Import mentor routes
import odRoutes from './routes/odRoutes.js'; // Import OD routes

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

// Route Mount Setup
app.use('/api', authRoutes);
app.use('/api/leaves', leaveRoutes); // 4. Mount your leave requests under /api/leaves
app.use('/api/od', odRoutes); // Mount OD routes under /api/od
app.use('/api/mentor', mentorRoutes); // 6. Mount mentor routes under /api/mentors
// 5. Explicitly mount the user profile route that your frontend form is calling
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