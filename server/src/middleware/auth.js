const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes with JWT verification
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided',
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'pg_complaint_management_secret_key_2026_super_secure'
    );
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token validation failed',
    });
  }
};

// Authorize roles middleware
const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.user ? req.user.role : 'none'}) is not authorized to access this resource`,
      });
    }
    next();
  };
};

// Middleware: For Editors, require accepted invite to view PG data or perform manipulations
const requireAcceptedInvite = (req, res, next) => {
  if (req.user && req.user.role === 'editor' && req.user.inviteStatus !== 'accepted') {
    return res.status(403).json({
      success: false,
      needsInviteAcceptance: true,
      message: 'Please accept your staff invite first to access PG details and operations.',
    });
  }
  if (req.user && req.user.role === 'tenant' && req.user.inviteStatus !== 'accepted') {
    return res.status(403).json({
      success: false,
      needsTenantApproval: true,
      inviteStatus: req.user.inviteStatus,
      message: req.user.inviteStatus === 'rejected'
        ? 'Your student enrollment request was rejected by the PG Owner.'
        : 'Your student enrollment is pending approval by the PG Owner.',
    });
  }
  next();
};

module.exports = {
  protect,
  authorizeRole,
  requireAcceptedInvite,
};
