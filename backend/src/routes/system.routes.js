const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const db = require('../models');
const os = require('os');

router.get('/health', async (req, res) => {
  try {
    await db.sequelize.authenticate();
    res.json({
      status: 'healthy',
      database: 'connected',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: os.loadavg()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    });
  }
});

router.get('/metrics', authenticate, authorize('admin'), async (req, res) => {
  try {
    const latestMetrics = await db.SystemMetric.findOne({
      order: [['timestamp', 'DESC']]
    });

    res.json(latestMetrics || {});
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch system metrics' });
  }
});

module.exports = router;
