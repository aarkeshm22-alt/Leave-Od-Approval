import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js'; 
import mentorRoutes from './routes/mentorRoutes.js'; 
import odRoutes from './routes/odRoutes.js'; 
import ca2Routes from './routes/ca2Routes.js';
import chatRoutes from './routes/chatRoutes.js';

dotenv.config();

const app = express();

// ✅ Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'https://leave-od-approval.onrender.com', 'https://leave-od-approval.vercel.app'],
    credentials: true
}));
app.use(express.json());

// ✅ Health check
app.get('/', (req, res) => {
    res.json({ 
        status: 'active',
        message: '🚀 Gateway Server is running smoothly'
    });
});

// ✅ MongoDB Connection
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/leave_portal';

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Successfully connected to MongoDB'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));

// ============================================
// ✅ ROUTES
// ============================================

// ✅ Auth routes (login, register, forgot password, etc.)
app.use('/api', authRoutes);

// ✅ Other routes
app.use('/api/leaves', leaveRoutes); 
app.use('/api/od', odRoutes); 
app.use('/api/mentor', mentorRoutes); 
app.use('/api/ca2', ca2Routes);
app.use('/api/chat', chatRoutes);

// ❌ REMOVE: app.use('/api', apiRoutes); - This causes conflicts!

// ✅ Error handling
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'Internal Server Error'
    });
});

// ✅ 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Route not found' 
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port: ${PORT}`);
});