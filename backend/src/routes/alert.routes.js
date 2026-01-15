const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const db = require('../models');
const logger = require('../utils/logger');

/**
 * GET /api/alerts
 * Get all alerts with filtering and pagination
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      severity,
      assignedTo,
      startDate,
      endDate
    } = req.query;

    const where = {};

    if (status) where.status = status;
    if (severity) where.severity = parseInt(severity);
    if (assignedTo) where.assignedTo = assignedTo;

    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at[Op.gte] = new Date(startDate);
      if (endDate) where.created_at[Op.lte] = new Date(endDate);
    }

    const { count, rows } = await db.Alert.findAndCountAll({
      where,
      include: [
        {
          model: db.TrafficLog,
          as: 'trafficLog',
          attributes: ['srcIp', 'dstIp', 'protocol', 'attackType']
        },
        {
          model: db.User,
          as: 'assignedUser',
          attributes: ['id', 'username', 'fullName']
        }
      ],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['created_at', 'DESC']]
    });

    res.json({
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    logger.error('Error fetching alerts:', error);
    res.status(500).json({
      error: 'FetchError',
      message: 'Failed to fetch alerts'
    });
  }
});

/**
 * GET /api/alerts/:id
 * Get single alert by ID
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const alert = await db.Alert.findByPk(req.params.id, {
      include: [
        { model: db.TrafficLog, as: 'trafficLog' },
        { model: db.User, as: 'assignedUser' }
      ]
    });

    if (!alert) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Alert not found'
      });
    }

    res.json(alert);

  } catch (error) {
    logger.error('Error fetching alert:', error);
    res.status(500).json({
      error: 'FetchError',
      message: 'Failed to fetch alert'
    });
  }
});

/**
 * PATCH /api/alerts/:id/assign
 * Assign alert to a user
 */
router.patch('/:id/assign', authenticate, authorize('admin', 'analyst'), async (req, res) => {
  try {
    const { userId } = req.body;

    const alert = await db.Alert.findByPk(req.params.id);
    if (!alert) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Alert not found'
      });
    }

    await alert.update({
      assignedTo: userId,
      status: 'investigating'
    });

    // Log audit event
    await db.AuditLog.create({
      eventType: 'ALERT_ASSIGNED',
      userId: req.userId,
      action: `Alert ${alert.id} assigned to user ${userId}`,
      resourceType: 'alert',
      resourceId: alert.id
    });

    const updatedAlert = await db.Alert.findByPk(req.params.id, {
      include: [{ model: db.User, as: 'assignedUser' }]
    });

    res.json(updatedAlert);

  } catch (error) {
    logger.error('Error assigning alert:', error);
    res.status(500).json({
      error: 'AssignError',
      message: 'Failed to assign alert'
    });
  }
});

/**
 * PATCH /api/alerts/:id/resolve
 * Resolve an alert
 */
router.patch('/:id/resolve', authenticate, authorize('admin', 'analyst'), async (req, res) => {
  try {
    const { resolutionNotes } = req.body;

    const alert = await db.Alert.findByPk(req.params.id);
    if (!alert) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Alert not found'
      });
    }

    await alert.update({
      status: 'resolved',
      resolvedAt: new Date(),
      resolutionNotes
    });

    // Log audit event
    await db.AuditLog.create({
      eventType: 'ALERT_RESOLVED',
      userId: req.userId,
      action: `Alert ${alert.id} resolved`,
      resourceType: 'alert',
      resourceId: alert.id
    });

    logger.info(`Alert ${alert.id} resolved by ${req.user.username}`);

    res.json(alert);

  } catch (error) {
    logger.error('Error resolving alert:', error);
    res.status(500).json({
      error: 'ResolveError',
      message: 'Failed to resolve alert'
    });
  }
});

/**
 * GET /api/alerts/stats/summary
 * Get alert statistics
 */
router.get('/stats/summary', authenticate, async (req, res) => {
  try {
    const totalAlerts = await db.Alert.count();
    const openAlerts = await db.Alert.count({ where: { status: 'open' } });
    const investigating = await db.Alert.count({ where: { status: 'investigating' } });
    const resolved = await db.Alert.count({ where: { status: 'resolved' } });

    const alertsBySeverity = await db.Alert.findAll({
      attributes: [
        'severity',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
      ],
      group: ['severity'],
      order: [['severity', 'DESC']]
    });

    res.json({
      totalAlerts,
      openAlerts,
      investigating,
      resolved,
      alertsBySeverity
    });

  } catch (error) {
    logger.error('Error fetching alert stats:', error);
    res.status(500).json({
      error: 'StatsError',
      message: 'Failed to fetch alert statistics'
    });
  }
});

module.exports = router;
