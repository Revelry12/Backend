const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('Auth failed: No token provided');
      return res.status(401).json({ 
        success: false, 
        message: 'Akses ditolak. Token tidak ditemukan.' 
      });
    }

    console.log('Token received:', token.substring(0, 20) + '...'); // Log partial token
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded successfully, userId:', decoded.userId);
    
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      console.log('Auth failed: User not found for userId:', decoded.userId);
      return res.status(401).json({ 
        success: false, 
        message: 'Token tidak valid.' 
      });
    }

    console.log('Auth successful for user:', user.email);
    req.userId = decoded.userId;
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    if (error.name === 'JsonWebTokenError') {
      console.error('JWT Error: Invalid token signature');
    } else if (error.name === 'TokenExpiredError') {
      console.error('JWT Error: Token expired');
    }
    res.status(401).json({ 
      success: false, 
      message: 'Token tidak valid.' 
    });
  }
};

module.exports = auth;