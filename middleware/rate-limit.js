/**
 * Rate limiting middleware
 * Protects the API from abuse by limiting request rates
 */
const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Create a limiter for general API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    meta: {
      success: false,
      message: 'Too many requests',
      version: require('../package.json').version,
      timestamp: Math.floor(Date.now() / 1000)
    },
    error: 'Too many requests, please try again later.'
  },
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json(options.message);
  }
});

// Create a stricter limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 login attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    meta: {
      success: false,
      message: 'Too many login attempts',
      version: require('../package.json').version,
      timestamp: Math.floor(Date.now() / 1000)
    },
    error: 'Too many login attempts, please try again later.'
  },
  handler: (req, res, next, options) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json(options.message);
  }
});

module.exports = {
  apiLimiter,
  authLimiter
};