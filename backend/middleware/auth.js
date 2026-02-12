const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Prefer Authorization header (API clients), fall back to httpOnly cookie (browser)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `User role ${req.user.role} is not authorized to access this route` 
      });
    }
    next();
  };
};

const checkPermission = (module, action) => {
  return (req, res, next) => {
    // Admin users have access to all modules and actions
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user has the specific permission
    const userPermissions = req.user.permissions;
    if (!userPermissions || !userPermissions[module] || !userPermissions[module][action]) {
      return res.status(403).json({ 
        message: `Access denied. You don't have permission to ${action} ${module}` 
      });
    }

    next();
  };
};

module.exports = { protect, authorize, checkPermission };