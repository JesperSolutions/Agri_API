/**
 * Error handling middleware
 * Provides consistent error handling for the application
 */
const logger = require('../utils/logger');

/**
 * Not found middleware
 * Handles 404 errors
 */
function notFound(req, res, next) {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
}

/**
 * Error handler middleware
 * Handles all errors in the application
 */
function errorHandler(err, req, res, next) {
  const statusCode = err.status || 500;
  
  // Log the error
  if (statusCode === 500) {
    logger.error(`Internal Server Error: ${err.message}`, { 
      error: err.stack,
      path: req.path,
      method: req.method,
      ip: req.ip,
      user: req.user ? req.user.id : 'unauthenticated'
    });
  } else {
    logger.warn(`${statusCode} error: ${err.message}`, {
      path: req.path,
      method: req.method,
      ip: req.ip
    });
  }
  
  // Create standardized error response
  const response = {
    meta: {
      success: false,
      message: statusCode === 500 ? 'Internal Server Error' : err.message,
      version: require('../package.json').version,
      timestamp: Math.floor(Date.now() / 1000)
    },
    error: statusCode === 500 && process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message
  };
  
  res.status(statusCode).json(response);
}

module.exports = {
  notFound,
  errorHandler
};