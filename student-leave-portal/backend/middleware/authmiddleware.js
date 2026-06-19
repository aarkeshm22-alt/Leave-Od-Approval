import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      if (!token || token === 'undefined' || token === 'null' || token.split('.').length !== 3) {
        return res.status(401).json({ message: 'Bearer token string format is empty or corrupted.' });
      }

      // Decrypt using the same key signed by your login controller
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_super_secret_key_change_this');
      
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ message: 'User belonging to this token no longer exists.' });
      }

      return next();
    } catch (error) {
      console.error('Token Verification Error:', error);
      return res.status(401).json({ message: 'Not authorized, access token invalid or expired.' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no security token found.' });
  }
};

// Path: backend/middleware/authMiddleware.js
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: 'User reference missing execution role parameters.' });
    }

    // 🚀 LOWERCASE NORMALIZATION: Bypasses strict casing mismatches completely
    const userRoleNormalized = req.user.role.toLowerCase();
    const allowedRolesNormalized = roles.map(role => role.toLowerCase());

    if (!allowedRolesNormalized.includes(userRoleNormalized)) {
      return res.status(403).json({ 
        message: `Role [${req.user.role}] is unauthorized to pass this route gateway layer.` 
      });
    }
    next();
  };
};