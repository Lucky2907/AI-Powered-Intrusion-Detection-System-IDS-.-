const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const db = require('../models');
const { Op } = require('sequelize');

/**
 * GET /api/export/traffic
 * Export traffic logs as CSV
 */
router.get('/traffic', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, isAttack, format = 'csv' } = req.query;

    const where = {};
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp[Op.gte] = new Date(startDate);
      if (endDate) where.timestamp[Op.lte] = new Date(endDate);
    }
    if (isAttack !== undefined) {
      where.isAttack = isAttack === 'true';
    }

    const logs = await db.TrafficLog.findAll({
      where,
      order: [['timestamp', 'DESC']],
      limit: 10000 // Max export limit
    });

    if (format === 'csv') {
      // Generate CSV
      const csvHeader = 'Timestamp,Source IP,Destination IP,Source Port,Dest Port,Protocol,Packet Size,Is Attack,Attack Type,Confidence,State\n';
      const csvRows = logs.map(log => 
        `${log.timestamp},${log.srcIp},${log.dstIp},${log.srcPort},${log.dstPort},${log.protocol},${log.packetSize},${log.isAttack},${log.attackType || 'N/A'},${log.confidenceScore || 0},${log.trafficState}`
      ).join('\n');
      
      const csv = csvHeader + csvRows;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=traffic-logs-${Date.now()}.csv`);
      res.send(csv);
    } else {
      res.json({ data: logs, count: logs.length });
    }

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Export failed', message: error.message });
  }
});

/**
 * GET /api/export/alerts
 * Export alerts as CSV
 */
router.get('/alerts', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, severity, format = 'csv' } = req.query;

    const where = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }
    if (severity) {
      where.severity = parseInt(severity);
    }

    const alerts = await db.Alert.findAll({
      where,
      include: [{
        model: db.TrafficLog,
        as: 'trafficLog',
        attributes: ['srcIp', 'dstIp', 'dstPort']
      }],
      order: [['createdAt', 'DESC']],
      limit: 10000
    });

    if (format === 'csv') {
      const csvHeader = 'Date,Alert Type,Severity,Title,Attack Category,Source IP,Destination IP,Port,Status,Auto Blocked\n';
      const csvRows = alerts.map(alert => 
        `${alert.createdAt},${alert.alertType},${alert.severity},${alert.title.replace(/,/g, ';')},${alert.attackCategory},${alert.trafficLog?.srcIp || 'N/A'},${alert.trafficLog?.dstIp || 'N/A'},${alert.trafficLog?.dstPort || 'N/A'},${alert.status},${alert.autoBlocked}`
      ).join('\n');
      
      const csv = csvHeader + csvRows;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=alerts-${Date.now()}.csv`);
      res.send(csv);
    } else {
      res.json({ data: alerts, count: alerts.length });
    }

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Export failed', message: error.message });
  }
});

/**
 * GET /api/export/report
 * Generate security report
 */
router.get('/report', authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.timestamp = {};
      if (startDate) dateFilter.timestamp[Op.gte] = new Date(startDate);
      if (endDate) dateFilter.timestamp[Op.lte] = new Date(endDate);
    }

    // Get statistics
    const [totalTraffic, totalAttacks, openAlerts, blockedIPs, attacksByType] = await Promise.all([
      db.TrafficLog.count({ where: dateFilter }),
      db.TrafficLog.count({ where: { ...dateFilter, isAttack: true } }),
      db.Alert.count({ where: { status: 'open' } }),
      db.BlockedIP.count({ where: { unblockedAt: null } }),
      db.TrafficLog.findAll({
        where: { ...dateFilter, isAttack: true },
        attributes: [
          'attackType',
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
        ],
        group: ['attackType'],
        raw: true
      })
    ]);

    // Generate HTML report
    const reportHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Security Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #667eea; border-bottom: 3px solid #667eea; padding-bottom: 10px; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 30px 0; }
    .stat-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
    .stat-number { font-size: 36px; font-weight: bold; }
    .stat-label { font-size: 14px; margin-top: 5px; }
    .section { margin: 30px 0; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #667eea; color: white; padding: 12px; text-align: left; }
    td { padding: 10px; border-bottom: 1px solid #ddd; }
    tr:hover { background: #f8f9fa; }
    .footer { margin-top: 50px; text-align: center; color: #6c757d; font-size: 12px; }
  </style>
</head>
<body>
  <h1>🛡️ Security Report</h1>
  <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
  <p><strong>Period:</strong> ${startDate ? new Date(startDate).toLocaleDateString() : 'All time'} - ${endDate ? new Date(endDate).toLocaleDateString() : 'Present'}</p>
  
  <div class="stats">
    <div class="stat-card">
      <div class="stat-number">${totalTraffic}</div>
      <div class="stat-label">Total Traffic</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${totalAttacks}</div>
      <div class="stat-label">Attacks Detected</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${openAlerts}</div>
      <div class="stat-label">Open Alerts</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${blockedIPs}</div>
      <div class="stat-label">Blocked IPs</div>
    </div>
  </div>
  
  <div class="section">
    <h2>Attack Distribution</h2>
    <table>
      <thead>
        <tr>
          <th>Attack Type</th>
          <th>Count</th>
          <th>Percentage</th>
        </tr>
      </thead>
      <tbody>
        ${attacksByType.map(a => `
          <tr>
            <td>${a.attackType}</td>
            <td>${a.count}</td>
            <td>${((a.count / totalAttacks) * 100).toFixed(2)}%</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  
  <div class="footer">
    <p>AI-Powered Intrusion Detection System</p>
    <p>This report was automatically generated</p>
  </div>
</body>
</html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename=security-report-${Date.now()}.html`);
    res.send(reportHTML);

  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ error: 'Report generation failed', message: error.message });
  }
});

module.exports = router;
