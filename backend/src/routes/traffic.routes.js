const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const axios = require('axios');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const db = require('../models');
const logger = require('../utils/logger');

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:5000/api';

/**
 * GET /api/traffic
 * Get traffic logs with pagination and filtering
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      sortBy = 'timestamp',
      sortOrder = 'DESC',
      isAttack,
      attackType,
      trafficState,
      srcIp,
      dstIp,
      startDate,
      endDate
    } = req.query;

    // Build where clause
    const where = {};

    if (isAttack !== undefined) {
      where.isAttack = isAttack === 'true';
    }

    if (attackType) {
      where.attackType = attackType;
    }

    if (trafficState) {
      where.trafficState = trafficState;
    }

    if (srcIp) {
      where.srcIp = { [Op.eq]: srcIp };
    }

    if (dstIp) {
      where.dstIp = { [Op.eq]: dstIp };
    }

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp[Op.gte] = new Date(startDate);
      if (endDate) where.timestamp[Op.lte] = new Date(endDate);
    }

    // Get traffic logs
    const { count, rows } = await db.TrafficLog.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [[sortBy, sortOrder]]
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
    logger.error('Error fetching traffic logs:', error);
    res.status(500).json({
      error: 'FetchError',
      message: 'Failed to fetch traffic logs'
    });
  }
});

/**
 * GET /api/traffic/:id
 * Get single traffic log by ID
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const traffic = await db.TrafficLog.findByPk(req.params.id, {
      include: [{
        model: db.Alert,
        as: 'alerts'
      }]
    });

    if (!traffic) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Traffic log not found'
      });
    }

    res.json(traffic);

  } catch (error) {
    logger.error('Error fetching traffic log:', error);
    res.status(500).json({
      error: 'FetchError',
      message: 'Failed to fetch traffic log'
    });
  }
});

/**
 * POST /api/traffic/analyze
 * Analyze traffic data using ML model
 */
router.post('/analyze', authenticate, authorize('admin', 'analyst'), async (req, res) => {
  try {
    const trafficData = req.body;

    // Call ML prediction API
    const mlResponse = await axios.post(`${ML_API_URL}/predict`, trafficData, {
      timeout: 10000
    });

    const prediction = mlResponse.data;

    // Save traffic log to database
    const trafficLog = await db.TrafficLog.create({
      ...trafficData,
      isAttack: prediction.is_attack,
      attackType: prediction.attack_type,
      confidenceScore: prediction.confidence,
      anomalyScore: prediction.anomaly_score,
      trafficState: prediction.is_attack ? 'attack' : 'normal'
    });

    // Create alert if attack detected
    if (prediction.is_attack && prediction.confidence >= 0.85) {
      const alert = await db.Alert.create({
        trafficLogId: trafficLog.id,
        alertType: 'HIGH',
        severity: prediction.confidence >= 0.95 ? 5 : 4,
        title: `${prediction.attack_type} attack detected from ${trafficData.srcIp}`,
        description: `Confidence: ${prediction.confidence}, Anomaly Score: ${prediction.anomaly_score}`,
        attackCategory: prediction.attack_type
      });

      // Emit WebSocket event for real-time alert
      const io = req.app.get('io');
      io.to('alerts').emit('new_alert', alert);

      logger.warn(`Attack detected: ${prediction.attack_type} from ${trafficData.srcIp}`);
    }

    // Emit traffic update
    const io = req.app.get('io');
    io.to('traffic').emit('new_traffic', trafficLog);

    res.json({
      trafficLog,
      prediction
    });

  } catch (error) {
    logger.error('Error analyzing traffic:', error);
    res.status(500).json({
      error: 'AnalysisError',
      message: 'Failed to analyze traffic',
      details: error.message
    });
  }
});

/**
 * POST /api/traffic/log
 * Log traffic data directly (with pre-computed ML prediction)
 */
router.post('/log', authenticate, async (req, res) => {
  try {
    const {
      src_ip,
      dst_ip,
      src_port,
      dst_port,
      protocol,
      packet_size,
      is_attack,
      predicted_class,
      confidence,
      state
    } = req.body;

    // Save traffic log to database
    const trafficLog = await db.TrafficLog.create({
      srcIp: src_ip,
      dstIp: dst_ip,
      srcPort: src_port,
      dstPort: dst_port,
      protocol: protocol,
      packetSize: packet_size,
      isAttack: is_attack,
      attackType: predicted_class !== 'BENIGN' ? predicted_class : null,
      confidenceScore: confidence,
      trafficState: state ? (state.toLowerCase() === 'active' ? (is_attack ? 'attack' : 'normal') : state.toLowerCase()) : (is_attack ? 'attack' : 'normal')
    });

    // Create alert if attack detected
    if (is_attack && confidence >= 0.5) {
      const alert = await db.Alert.create({
        trafficLogId: trafficLog.id,
        alertType: confidence >= 0.8 ? 'CRITICAL' : 'HIGH',
        severity: confidence >= 0.9 ? 5 : (confidence >= 0.7 ? 4 : 3),
        title: `${predicted_class} detected from ${src_ip}`,
        description: `Attack type: ${predicted_class}, Confidence: ${(confidence * 100).toFixed(2)}%, Target: ${dst_ip}:${dst_port}`,
        attackCategory: predicted_class,
        status: 'open'
      });

      // Auto-block IP if confidence is high
      if (confidence >= 0.7) {
        const existingBlock = await db.BlockedIP.findOne({
          where: { ipAddress: src_ip, unblockedAt: null }
        });

        if (!existingBlock) {
          await db.BlockedIP.create({
            ipAddress: src_ip,
            reason: `Automated block: ${predicted_class} attack detected`,
            blockedBy: req.user.id,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
          });
          logger.warn(`IP ${src_ip} automatically blocked due to ${predicted_class} attack`);
        }
      }

      // Emit WebSocket event for real-time alert
      const io = req.app.get('io');
      io.to('alerts').emit('new_alert', alert);

      logger.warn(`Attack logged: ${predicted_class} from ${src_ip} (confidence: ${confidence})`);
    }

    // Emit traffic update
    const io = req.app.get('io');
    io.to('traffic').emit('new_traffic', trafficLog);

    res.json({
      success: true,
      trafficLog,
      alertCreated: is_attack && confidence >= 0.5
    });

  } catch (error) {
    logger.error('Error logging traffic:', error);
    res.status(500).json({
      error: 'LogError',
      message: 'Failed to log traffic',
      details: error.message
    });
  }
});

/**
 * GET /api/traffic/stats/summary
 * Get traffic statistics summary
 */
router.get('/stats/summary', authenticate, async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;

    // Calculate time filter
    const now = new Date();
    const timeMap = {
      '1h': 1,
      '24h': 24,
      '7d': 24 * 7,
      '30d': 24 * 30
    };
    const hours = timeMap[timeRange] || 24;
    const startTime = new Date(now - hours * 60 * 60 * 1000);

    // Get statistics
    const totalTraffic = await db.TrafficLog.count({
      where: { timestamp: { [Op.gte]: startTime } }
    });

    const totalAttacks = await db.TrafficLog.count({
      where: {
        timestamp: { [Op.gte]: startTime },
        isAttack: true
      }
    });

    const attacksByType = await db.TrafficLog.findAll({
      attributes: [
        'attackType',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
      ],
      where: {
        timestamp: { [Op.gte]: startTime },
        isAttack: true
      },
      group: ['attackType']
    });

    const topAttackers = await db.TrafficLog.findAll({
      attributes: [
        'srcIp',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
      ],
      where: {
        timestamp: { [Op.gte]: startTime },
        isAttack: true
      },
      group: ['srcIp'],
      order: [[db.sequelize.fn('COUNT', db.sequelize.col('id')), 'DESC']],
      limit: 10
    });

    res.json({
      timeRange,
      totalTraffic,
      totalAttacks,
      attackRate: totalTraffic > 0 ? (totalAttacks / totalTraffic * 100).toFixed(2) : 0,
      attacksByType,
      topAttackers
    });

  } catch (error) {
    logger.error('Error fetching traffic stats:', error);
    res.status(500).json({
      error: 'StatsError',
      message: 'Failed to fetch traffic statistics'
    });
  }
});

/**
 * DELETE /api/traffic/:id
 * Delete traffic log (admin only)
 */
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const traffic = await db.TrafficLog.findByPk(req.params.id);

    if (!traffic) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Traffic log not found'
      });
    }

    await traffic.destroy();

    logger.info(`Traffic log ${req.params.id} deleted by ${req.user.username}`);

    res.json({ message: 'Traffic log deleted successfully' });

  } catch (error) {
    logger.error('Error deleting traffic log:', error);
    res.status(500).json({
      error: 'DeleteError',
      message: 'Failed to delete traffic log'
    });
  }
});

module.exports = router;
