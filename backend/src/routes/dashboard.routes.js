const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { authenticate } = require('../middleware/auth.middleware');
const db = require('../models');

router.get('/overview', authenticate, async (req, res) => {
  try {
    const now = new Date();
    const last24h = new Date(now - 24 * 60 * 60 * 1000);

    const stats = {
      traffic: {
        total: await db.TrafficLog.count({ where: { timestamp: { [Op.gte]: last24h } } }),
        attacks: await db.TrafficLog.count({ where: { timestamp: { [Op.gte]: last24h }, isAttack: true } })
      },
      alerts: {
        open: await db.Alert.count({ where: { status: 'open' } }),
        critical: await db.Alert.count({ where: { severity: 5, status: { [Op.ne]: 'resolved' } } })
      },
      blocked: await db.BlockedIP.count({ where: { unblockedAt: null } })
    };

    // Traffic over time (last 30 minutes in 5-minute intervals)
    const trafficTimeline = [];
    for (let i = 5; i >= 0; i--) {
      const intervalStart = new Date(now - i * 5 * 60 * 1000);
      const intervalEnd = new Date(now - (i - 1) * 5 * 60 * 1000);
      
      // Format as HH:MM
      const timeLabel = intervalStart.getHours().toString().padStart(2, '0') + ':' + 
                        intervalStart.getMinutes().toString().padStart(2, '0');
      
      const total = await db.TrafficLog.count({ 
        where: { timestamp: { [Op.between]: [intervalStart, intervalEnd] } } 
      });
      const attacks = await db.TrafficLog.count({ 
        where: { timestamp: { [Op.between]: [intervalStart, intervalEnd] }, isAttack: true } 
      });
      
      trafficTimeline.push({ time: timeLabel, normal: total - attacks, attacks });
    }

    // Attack types distribution
    const attackTypes = await db.TrafficLog.findAll({
      where: { isAttack: true, timestamp: { [Op.gte]: last24h } },
      attributes: ['attackType', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']],
      group: ['attackType'],
      raw: true
    });

    const attackDistribution = attackTypes.map(item => ({
      name: item.attackType || 'Unknown',
      value: parseInt(item.count)
    }));

    res.json({ ...stats, trafficTimeline, attackDistribution });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

module.exports = router;
