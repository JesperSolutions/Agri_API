const express = require('express');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { User } = require('../models/user');
const { Token, TokenRequest } = require('../models/token');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// JWT Secret - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const TOKEN_EXPIRY = process.env.TOKEN_EXPIRY || '30d'; // Token expiry time

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticates a user and returns a JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: admin
 *               password:
 *                 type: string
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json(global.createResponse(false, 'Login failed', null, 'Username and password are required'));
    }
    
    const user = await User.verify(username, password);
    
    if (!user) {
      return res.status(401).json(global.createResponse(false, 'Login failed', null, 'Invalid credentials'));
    }
    
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );
    
    // Add token to valid tokens list
    await Token.create({
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });
    
    res.status(200).json(global.createResponse(true, 'Login successful', {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    }));
  } catch (error) {
    const response = global.createResponse(false, 'Login failed', null, error.message);
    res.status(500).json(response);
  }
});

/**
 * @swagger
 * /auth/token/request:
 *   post:
 *     summary: Request API access token
 *     description: Submit a request for an API access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TokenRequest'
 *     responses:
 *       200:
 *         description: Token request submitted successfully
 *       400:
 *         description: Invalid request data
 */
router.post('/token/request', async (req, res) => {
  try {
    const { company, email, purpose, company_id, address } = req.body;
    
    if (!company || !email || !purpose) {
      return res.status(400).json(global.createResponse(false, 'Token request failed', null, 'Company, email, and purpose are required'));
    }
    
    const request = await TokenRequest.create({
      company,
      email,
      purpose,
      company_id,
      address
    });
    
    res.status(200).json(global.createResponse(true, 'Token request submitted successfully', {
      requestId: request.id,
      message: 'Your request has been submitted and is pending approval. You will be notified via email when approved.'
    }));
  } catch (error) {
    const response = global.createResponse(false, 'Token request failed', null, error.message);
    res.status(500).json(response);
  }
});

/**
 * @swagger
 * /auth/token:
 *   get:
 *     summary: List all tokens
 *     description: Returns a list of all API tokens (admin only)
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tokens
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/token', authenticate, requireAdmin, async (req, res) => {
  try {
    const tokens = await Token.getAll();
    res.status(200).json(global.createResponse(true, 'Tokens retrieved successfully', { tokens }));
  } catch (error) {
    const response = global.createResponse(false, 'Failed to retrieve tokens', null, error.message);
    res.status(500).json(response);
  }
});

/**
 * @swagger
 * /auth/token/requests:
 *   get:
 *     summary: List all token requests
 *     description: Returns a list of all token requests (admin only)
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of token requests
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/token/requests', authenticate, requireAdmin, async (req, res) => {
  try {
    const requests = await TokenRequest.getAll();
    res.status(200).json(global.createResponse(true, 'Token requests retrieved successfully', { requests }));
  } catch (error) {
    const response = global.createResponse(false, 'Failed to retrieve token requests', null, error.message);
    res.status(500).json(response);
  }
});

/**
 * @swagger
 * /auth/token/{id}/approve:
 *   post:
 *     summary: Approve token request
 *     description: Approves a token request and generates an API token (admin only)
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Token request ID
 *     responses:
 *       200:
 *         description: Token request approved
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Token request not found
 */
router.post('/token/:id/approve', authenticate, requireAdmin, async (req, res) => {
  try {
    const requestId = req.params.id;
    const request = await TokenRequest.findById(requestId);
    
    if (!request) {
      return res.status(404).json(global.createResponse(false, 'Approval failed', null, 'Token request not found'));
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json(global.createResponse(false, 'Approval failed', null, `Request is already ${request.status}`));
    }
    
    // Approve the request
    await TokenRequest.approve(requestId, req.user.id);
    
    // Generate API token
    const apiToken = jwt.sign(
      { 
        id: uuidv4(),
        company: request.company,
        email: request.email,
        purpose: request.purpose,
        type: 'api_token'
      },
      JWT_SECRET,
      { expiresIn: '365d' } // API tokens valid for 1 year
    );
    
    // Add token to valid tokens list
    const token = await Token.create({
      userId: req.user.id,
      requestId,
      token: apiToken,
      company: request.company,
      email: request.email,
      purpose: request.purpose,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
    });
    
    res.status(200).json(global.createResponse(true, 'Token request approved', {
      token: apiToken,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    }));
  } catch (error) {
    const response = global.createResponse(false, 'Approval failed', null, error.message);
    res.status(500).json(response);
  }
});

/**
 * @swagger
 * /auth/token/{id}/revoke:
 *   post:
 *     summary: Revoke token
 *     description: Revokes an API token (admin only)
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Token ID
 *     responses:
 *       200:
 *         description: Token revoked
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Token not found
 */
router.post('/token/:id/revoke', authenticate, requireAdmin, async (req, res) => {
  try {
    const tokenId = req.params.id;
    const token = await Token.findById(tokenId);
    
    if (!token) {
      return res.status(404).json(global.createResponse(false, 'Revocation failed', null, 'Token not found'));
    }
    
    if (token.revoked) {
      return res.status(400).json(global.createResponse(false, 'Revocation failed', null, 'Token is already revoked'));
    }
    
    await Token.revoke(tokenId, req.user.id);
    
    res.status(200).json(global.createResponse(true, 'Token revoked successfully', { tokenId }));
  } catch (error) {
    const response = global.createResponse(false, 'Revocation failed', null, error.message);
    res.status(500).json(response);
  }
});

module.exports = router;