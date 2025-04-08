/**
 * User model
 * Handles user-related database operations
 */
const db = require('../database/db');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

/**
 * Hash a password with a salt
 * @param {string} password - Password to hash
 * @param {string} salt - Salt for hashing (optional, will be generated if not provided)
 * @returns {object} Hash and salt
 */
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

/**
 * Verify a password against a hash and salt
 * @param {string} password - Password to verify
 * @param {string} hash - Stored hash
 * @param {string} salt - Stored salt
 * @returns {boolean} True if password is valid
 */
function verifyPassword(password, hash, salt) {
  const { hash: newHash } = hashPassword(password, salt);
  return newHash === hash;
}

const User = {
  /**
   * Create a new user
   * @param {object} userData - User data
   * @param {string} createdBy - ID of the user creating this user (optional)
   * @returns {Promise<object>} Created user object
   */
  create: (userData, createdBy = null) => {
    return new Promise((resolve, reject) => {
      const { username, password, role } = userData;
      
      if (!username || !password || !role) {
        return reject(new Error('Username, password, and role are required'));
      }
      
      const id = uuidv4();
      const { hash, salt } = hashPassword(password);
      
      db.run(
        'INSERT INTO users (id, username, password, salt, role, created_by) VALUES (?, ?, ?, ?, ?, ?)',
        [id, username, hash, salt, role, createdBy],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              id,
              username,
              role,
              createdAt: new Date()
            });
          }
        }
      );
    });
  },
  
  /**
   * Find a user by username
   * @param {string} username - Username to search for
   * @returns {Promise<object|null>} User object or null if not found
   */
  findByUsername: (username) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  },
  
  /**
   * Find a user by ID
   * @param {string} id - User ID to search for
   * @returns {Promise<object|null>} User object or null if not found
   */
  findById: (id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  },
  
  /**
   * Get all users
   * @returns {Promise<Array>} Array of user objects
   */
  getAll: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT id, username, role, created_at FROM users', (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  },
  
  /**
   * Verify a user's credentials
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Promise<object|null>} User object if verified, null otherwise
   */
  verify: (username, password) => {
    return new Promise((resolve, reject) => {
      User.findByUsername(username)
        .then(user => {
          if (!user) {
            resolve(null);
          } else {
            const isValid = verifyPassword(password, user.password, user.salt);
            if (isValid) {
              resolve({
                id: user.id,
                username: user.username,
                role: user.role
              });
            } else {
              resolve(null);
            }
          }
        })
        .catch(err => reject(err));
    });
  }
};

module.exports = {
  User,
  hashPassword,
  verifyPassword
};