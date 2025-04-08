/**
 * Calculation model
 * Handles calculation-related database operations
 */
const db = require('../database/db');
const { v4: uuidv4 } = require('uuid');

const Calculation = {
  /**
   * Save a calculation
   * @param {object} calculationData - Calculation data
   * @returns {Promise<object>} Saved calculation object
   */
  save: (calculationData) => {
    return new Promise((resolve, reject) => {
      const {
        userId,
        type = 'standard',
        parameters,
        results
      } = calculationData;

      const id = uuidv4();
      const parametersJson = JSON.stringify(parameters);
      const resultsJson = JSON.stringify(results);

      db.run(
        'INSERT INTO calculations (id, user_id, type, parameters, results) VALUES (?, ?, ?, ?, ?)',
        [id, userId, type, parametersJson, resultsJson],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              id,
              userId,
              type,
              parameters,
              results,
              createdAt: new Date()
            });
          }
        }
      );
    });
  },

  /**
   * Find a calculation by ID
   * @param {string} id - Calculation ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<object|null>} Calculation object or null if not found
   */
  findById: (id, userId) => {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM calculations WHERE id = ? AND user_id = ?',
        [id, userId],
        (err, row) => {
          if (err) {
            reject(err);
          } else if (!row) {
            resolve(null);
          } else {
            try {
              const calculation = {
                id: row.id,
                userId: row.user_id,
                type: row.type,
                parameters: JSON.parse(row.parameters),
                results: JSON.parse(row.results),
                createdAt: new Date(row.created_at)
              };
              resolve(calculation);
            } catch (parseError) {
              reject(parseError);
            }
          }
        }
      );
    });
  },

  /**
   * Get all calculations for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of calculation objects
   */
  getAllForUser: (userId) => {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM calculations WHERE user_id = ? ORDER BY created_at DESC',
        [userId],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            try {
              const calculations = rows.map(row => ({
                id: row.id,
                userId: row.user_id,
                type: row.type,
                parameters: JSON.parse(row.parameters),
                results: JSON.parse(row.results),
                createdAt: new Date(row.created_at)
              }));
              resolve(calculations);
            } catch (parseError) {
              reject(parseError);
            }
          }
        }
      );
    });
  }
};

module.exports = {
  Calculation
};