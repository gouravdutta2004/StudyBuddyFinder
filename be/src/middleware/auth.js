const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ message: 'Not authorized, no token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role === 'admin') {
      req.user = await Admin.findById(decoded.id).select('-password');
    } else {
      req.user = await User.findById(decoded.id).select('-password');
    }
    
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    req.user.role = decoded.role; // Stamp locally
    next();
  } catch {
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

const isOrgAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'ORG_ADMIN') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an Organization Admin' });
  }
};

module.exports = { protect, admin, isOrgAdmin };
