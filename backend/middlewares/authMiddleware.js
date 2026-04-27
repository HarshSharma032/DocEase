const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const logger = require('../utils/logger');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

      let user = await User.findById(decoded.id).select('-password');
      if (!user) {
        user = await Doctor.findById(decoded.id).select('-password');
      }

      if (!user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      req.user = user;
      req.user.isDoctor = !!user.specialization;

      next();
    } catch (error) {
      logger.warn(`Auth failed: ${error.message}`);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: Admin access only' });
  }
};

const doctorOnly = (req, res, next) => {
  if (req.user && req.user.role === 'Doctor') {
    if (req.user.status !== 'approved') {
      return res.status(403).json({ message: 'Forbidden: Your account is pending approval or has been rejected.' });
    }
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: Doctor access only' });
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission' });
    }
    next();
  };
};

module.exports = { protect, admin: adminOnly, adminOnly, doctorOnly, restrictTo };
