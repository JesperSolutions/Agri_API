const express = require('express');
const { User } = require('../models/user');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: List all users
 *     description: Returns a list of all users (admin only)
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const users = await User.getAll();
    res.status(200).json(global.createResponse(true, 'Users retrieved successfully', { users }));
  } catch (error) {
    const response = global.createResponse(false, 'Failed to retrieve users', null, error.message);
    res.status(500).json(response);
  }
});

/**
 * @swagger
 * /admin/users:
 *   post:
 *     summary: Create new user
 *     description: Creates a new user (admin only)
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User created
 *       400:
 *         description: Invalid request data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const { username, password, role } = req.body;
    
    if (!username || !password || !role) {
      return res.status(400).json(global.createResponse(false, 'User creation failed', null, 'Username, password, and role are required'));
    }
    
    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json(global.createResponse(false, 'User creation failed', null, 'Role must be either "admin" or "user"'));
    }
    
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(400).json(global.createResponse(false, 'User creation failed', null, 'Username already exists'));
    }
    
    const user = await User.create({
      username,
      password,
      role
    }, req.user.id);
    
    res.status(201).json(global.createResponse(true, 'User created successfully', {
      id: user.id,
      username: user.username,
      role: user.role
    }));
  } catch (error) {
    const response = global.createResponse(false, 'User creation failed', null, error.message);
    res.status(500).json(response);
  }
});

module.exports = router;