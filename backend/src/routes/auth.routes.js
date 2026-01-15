const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../models');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register',
  [
    body('username').isLength({ min: 3, max: 50 }).isAlphanumeric(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('fullName').optional().isLength({ max: 100 }),
    body('role').optional().isIn(['admin', 'analyst', 'viewer'])
  ],
  async (req, res) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, email, password, fullName, role } = req.body;

      // Check if user already exists
      const existingUser = await db.User.findOne({
        where: {
          [db.Sequelize.Op.or]: [{ username }, { email }]
        }
      });

      if (existingUser) {
        return res.status(409).json({
          error: 'User already exists',
          message: 'Username or email is already registered'
        });
      }

      // Create user
      const user = await db.User.create({
        username,
        email,
        password, // Will be hashed by beforeCreate hook
        fullName,
        role: role || 'viewer'
      });

      // Log audit event
      await db.AuditLog.create({
        eventType: 'USER_REGISTERED',
        userId: user.id,
        action: `User ${username} registered`,
        resourceType: 'user',
        resourceId: user.id,
        ipAddress: req.ip
      });

      logger.info(`New user registered: ${username}`);

      res.status(201).json({
        message: 'User registered successfully',
        user: user.toJSON()
      });

    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        error: 'RegistrationError',
        message: 'Failed to register user'
      });
    }
  }
);

/**
 * POST /api/auth/login
 * Login user and return JWT token
 */
router.post('/login',
  [
    body('username').notEmpty(),
    body('password').notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, password } = req.body;

      // Find user
      const user = await db.User.findOne({
        where: {
          [db.Sequelize.Op.or]: [
            { username },
            { email: username }
          ]
        }
      });

      if (!user) {
        return res.status(401).json({
          error: 'AuthenticationError',
          message: 'Invalid credentials'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json({
          error: 'AccountDisabled',
          message: 'Your account has been disabled'
        });
      }

      // Validate password
      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({
          error: 'AuthenticationError',
          message: 'Invalid credentials'
        });
      }

      // Update last login
      await user.update({ lastLogin: new Date() });

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          role: user.role
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      // Log audit event
      await db.AuditLog.create({
        eventType: 'USER_LOGIN',
        userId: user.id,
        action: `User ${user.username} logged in`,
        resourceType: 'user',
        resourceId: user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      logger.info(`User logged in: ${user.username}`);

      res.json({
        message: 'Login successful',
        token,
        user: user.toJSON(),
        expiresIn: JWT_EXPIRES_IN
      });

    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        error: 'LoginError',
        message: 'Failed to login'
      });
    }
  }
);

/**
 * GET /api/auth/verify
 * Verify JWT token
 */
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        error: 'NoToken',
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get user
    const user = await db.User.findByPk(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'InvalidToken',
        message: 'Token is invalid or user is disabled'
      });
    }

    res.json({
      valid: true,
      user: user.toJSON()
    });

  } catch (error) {
    res.status(401).json({
      error: 'InvalidToken',
      message: 'Token verification failed'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (client-side token removal)
 */
router.post('/logout', async (req, res) => {
  // Log audit event if authenticated
  if (req.user) {
    await db.AuditLog.create({
      eventType: 'USER_LOGOUT',
      userId: req.user.id,
      action: `User ${req.user.username} logged out`,
      resourceType: 'user',
      resourceId: req.user.id,
      ipAddress: req.ip
    });
  }

  res.json({ message: 'Logout successful' });
});

module.exports = router;
