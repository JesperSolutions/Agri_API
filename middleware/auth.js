const jwt = require('jsonwebtoken');
const { Token } = require('../models/token');
const logger = require('../utils/logger');

// JWT Secret - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Authentication middleware
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json(global.createResponse(false, 'Authentication required', null, 'No authorization header provided'));
  }
  
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json(global.createResponse(false, 'Authentication required', null, 'No token provided'));
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    
    // Check if token is in the valid tokens list
    const tokenExists = await Token.findByToken(token);
    if (!tokenExists) {
      logger.warn(`Invalid token attempt: ${token.substring(0, 10)}...`);
      return res.status(401).json(global.createResponse(false, 'Authentication failed', null, 'Token is not valid or has been revoked'));
    }
    
    next();
  } catch (error) {
    logger.warn(`JWT verification failed: ${error.message}`);
    return res.status(401).json(global.createResponse(false, 'Authentication failed', null, error.message));
  }
}

/**
 * Admin role middleware
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    logger.warn(`Admin access attempt by non-admin user: ${req.user ? req.user.username : 'unknown'}`);
    return res.status(403).json(global.createResponse(false, 'Access denied', null, 'Admin privileges required'));
  }
  next();
}

module.exports = {
  authenticate,
  requireAdmin
};