const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function protect(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'srh_jwt_secret_key_default');
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user) {
      return res.status(401).json({ message: 'User account no longer exists' });
    }
    if (user.isActive === false) {
      return res.status(403).json({ message: 'Account has been deactivated. Please contact support.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired session token' });
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin privileges required' });
  }
  next();
}

function mentorOnly(req, res, next) {
  if (req.user?.role !== 'mentor' && req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Mentor privileges required' });
  }
  next();
}

async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'srh_jwt_secret_key_default');
      const user = await User.findById(decoded.id).select('-passwordHash');
      if (user && user.isActive !== false) {
        req.user = user;
      }
    } catch (err) {
      // Proceed as anonymous
    }
  }
  next();
}

module.exports = { protect, adminOnly, mentorOnly, optionalAuth };
