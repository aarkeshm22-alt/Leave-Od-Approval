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
import ca2Routes from './routes/ca2Routes.js';

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
app.use('/api/ca2', ca2Routes);

// Pull deployment target gateway port dynamically 
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Gateway Server active and serving requests on port: ${PORT}`);
});