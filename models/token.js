/**
 * Token model
 * Handles token-related database operations
 */
const db = require('../database/db');
const { v4: uuidv4 } = require('uuid');

const Token = {
  /**
   * Create a new token
   * @param {object} tokenData - Token data
   * @returns {Promise<object>} Created token object
   */
  create: (tokenData) => {
    return new Promise((resolve, reject) => {
      const {
        userId,
        requestId = null,
        token,
        company = null,
        email = null,
        purpose = null,
        expiresAt
      } = tokenData;

      const id = uuidv4();

      db.run(
        `INSERT INTO tokens (
          id, user_id, request_id, token, company, email, purpose, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, userId, requestId, token, company, email, purpose, expiresAt],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              id,
              userId,
              requestId,
              token,
              company,
              email,
              purpose,
              expiresAt,
              createdAt: new Date(),
              revoked: false
            });
          }
        }
      );
    });
  },

  /**
   * Find a token by token string
   * @param {string} token - Token string to search for
   * @returns {Promise<object|null>} Token object or null if not found
   */
  findByToken: (token) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM tokens WHERE token = ? AND revoked = 0', [token], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  },

  /**
   * Find a token by ID
   * @param {string} id - Token ID to search for
   * @returns {Promise<object|null>} Token object or null if not found
   */
  findById: (id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM tokens WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  },

  /**
   * Get all tokens
   * @returns {Promise<Array>} Array of token objects
   */
  getAll: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM tokens', (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  },

  /**
   * Revoke a token
   * @param {string} id - Token ID
   * @param {string} revokedBy - ID of the user revoking the token
   * @returns {Promise<boolean>} True if successful
   */
  revoke: (id, revokedBy) => {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE tokens SET revoked = 1, revoked_at = CURRENT_TIMESTAMP, revoked_by = ? WHERE id = ?',
        [revokedBy, id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes > 0);
          }
        }
      );
    });
  }
};

const TokenRequest = {
  /**
   * Create a new token request
   * @param {object} requestData - Request data
   * @returns {Promise<object>} Created request object
   */
  create: (requestData) => {
    return new Promise((resolve, reject) => {
      const {
        company,
        email,
        purpose,
        company_id = null,
        address = null
      } = requestData;

      const id = uuidv4();

      db.run(
        `INSERT INTO token_requests (
          id, company, email, purpose, company_id, address, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, company, email, purpose, company_id, address, 'pending'],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              id,
              company,
              email,
              purpose,
              company_id,
              address,
              status: 'pending',
              createdAt: new Date()
            });
          }
        }
      );
    });
  },

  /**
   * Find a token request by ID
   * @param {string} id - Request ID to search for
   * @returns {Promise<object|null>} Request object or null if not found
   */
  findById: (id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM token_requests WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  },

  /**
   * Get all token requests
   * @returns {Promise<Array>} Array of request objects
   */
  getAll: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM token_requests', (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  },

  /**
   * Approve a token request
   * @param {string} id - Request ID
   * @param {string} approvedBy - ID of the user approving the request
   * @returns {Promise<boolean>} True if successful
   */
  approve: (id, approvedBy) => {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE token_requests SET status = ?, approved_at = CURRENT_TIMESTAMP, approved_by = ? WHERE id = ?',
        ['approved', approvedBy, id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes > 0);
          }
        }
      );
    });
  }
};

module.exports = {
  Token,
  TokenRequest
};