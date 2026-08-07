import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getCA2Students } from '../controllers/ca2Controller.js';

const ca2Router = express.Router();

// ✅ All routes in this file start with /api/ca2
ca2Router.get('/my-students', protect, getCA2Students);


export default ca2Router;