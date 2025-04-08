/**
 * Configuration validator
 * Validates environment variables on startup
 */
const logger = require('./logger');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Validates required environment variables
 * @returns {boolean} True if all required variables are present
 */
function validateConfig() {
  const requiredVars = [
    'JWT_SECRET'
  ];

  const recommendedVars = [
    'PORT',
    'ADMIN_USERNAME',
    'ADMIN_PASSWORD',
    'TOKEN_EXPIRY'
  ];

  let valid = true;
  const missing = [];

  // Check required variables
  for (const variable of requiredVars) {
    if (!process.env[variable]) {
      missing.push(variable);
    }
  }

  // If JWT_SECRET is missing, generate one and add it to .env
  if (missing.includes('JWT_SECRET')) {
    try {
      const envPath = path.join(__dirname, '..', '.env');
      const jwtSecret = crypto.randomBytes(32).toString('hex');
      
      // Check if .env exists
      if (fs.existsSync(envPath)) {
        // Append to existing file
        fs.appendFileSync(envPath, `\nJWT_SECRET=${jwtSecret}\n`);
      } else {
        // Create new .env file
        fs.writeFileSync(envPath, `JWT_SECRET=${jwtSecret}\n`);
      }
      
      // Set the environment variable for the current process
      process.env.JWT_SECRET = jwtSecret;
      
      logger.info('Generated and added JWT_SECRET to .env file');
      
      // Remove JWT_SECRET from missing list
      const index = missing.indexOf('JWT_SECRET');
      if (index > -1) {
        missing.splice(index, 1);
      }
    } catch (error) {
      logger.error(`Failed to generate JWT_SECRET: ${error.message}`);
    }
  }

  // Log missing required variables
  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
    logger.error('Please set these variables in your .env file or environment');
    valid = false;
  }

  // Check recommended variables
  const missingRecommended = [];
  for (const variable of recommendedVars) {
    if (!process.env[variable]) {
      missingRecommended.push(variable);
    }
  }

  // Log missing recommended variables
  if (missingRecommended.length > 0) {
    logger.warn(`Missing recommended environment variables: ${missingRecommended.join(', ')}`);
    logger.warn('Default values will be used, but it is recommended to set these variables');
  }

  // Log default values being used
  if (!process.env.PORT) {
    logger.info('Using default PORT: 3000');
  }
  if (!process.env.ADMIN_USERNAME) {
    logger.info('Using default ADMIN_USERNAME: admin');
  }
  if (!process.env.ADMIN_PASSWORD) {
    logger.warn('Using default ADMIN_PASSWORD: admin123 (not secure for production)');
  }
  if (!process.env.TOKEN_EXPIRY) {
    logger.info('Using default TOKEN_EXPIRY: 30d');
  }

  return valid;
}

module.exports = {
  validateConfig
};