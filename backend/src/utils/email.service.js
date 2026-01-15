/**
 * Email Service
 * Sends email notifications for critical security alerts
 */

const nodemailer = require('nodemailer');
const logger = require('./logger');

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

/**
 * Send alert email
 */
async function sendAlertEmail({ to, subject, alert, trafficLog }) {
  // Skip if email not configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    logger.warn('Email not configured - skipping alert email');
    return false;
  }

  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 20px; border: 1px solid #dee2e6; border-top: none; }
          .alert-box { background: ${alert.severity >= 4 ? '#dc3545' : '#fd7e14'}; color: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .details { background: white; padding: 15px; border-radius: 8px; margin: 10px 0; }
          .label { font-weight: bold; color: #495057; }
          .value { color: #212529; }
          .footer { text-align: center; padding: 20px; color: #6c757d; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🚨 Security Alert</h1>
            <p style="margin: 5px 0 0 0;">AI-Powered Intrusion Detection System</p>
          </div>
          <div class="content">
            <div class="alert-box">
              <h2 style="margin: 0 0 10px 0;">${alert.title}</h2>
              <p style="margin: 0;"><strong>Severity:</strong> ${alert.severity}/5 - ${alert.alertType}</p>
            </div>
            
            <div class="details">
              <h3>Attack Details</h3>
              <p><span class="label">Attack Type:</span> <span class="value">${alert.attackCategory}</span></p>
              <p><span class="label">Source IP:</span> <span class="value">${trafficLog.srcIp}</span></p>
              <p><span class="label">Destination IP:</span> <span class="value">${trafficLog.dstIp}</span></p>
              <p><span class="label">Port:</span> <span class="value">${trafficLog.dstPort}</span></p>
              <p><span class="label">Protocol:</span> <span class="value">${trafficLog.protocol}</span></p>
              <p><span class="label">Confidence:</span> <span class="value">${(trafficLog.confidenceScore * 100).toFixed(2)}%</span></p>
            </div>
            
            <div class="details">
              <h3>Description</h3>
              <p>${alert.description}</p>
            </div>
            
            ${alert.autoBlocked ? `
              <div class="details" style="background: #d4edda; border: 1px solid #c3e6cb;">
                <h3 style="color: #155724;">✓ Automatic Response Taken</h3>
                <p style="color: #155724;">Source IP has been automatically blocked to prevent further attacks.</p>
              </div>
            ` : ''}
            
            <div class="details">
              <p style="margin: 0;"><span class="label">Detected at:</span> <span class="value">${new Date(alert.createdAt).toLocaleString()}</span></p>
              <p style="margin: 0;"><span class="label">Alert ID:</span> <span class="value">${alert.id}</span></p>
            </div>
          </div>
          <div class="footer">
            <p>This is an automated alert from your AI-Powered IDS</p>
            <p>Please review the dashboard for more details</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: `"AI-IDS Alert System" <${process.env.SMTP_USER}>`,
      to: to || process.env.ADMIN_EMAIL || process.env.SMTP_USER,
      subject: subject || `🚨 Critical Security Alert: ${alert.attackCategory}`,
      html: htmlContent
    });

    logger.info(`Alert email sent: ${info.messageId}`);
    return true;

  } catch (error) {
    logger.error('Failed to send alert email:', error);
    return false;
  }
}

/**
 * Send daily summary email
 */
async function sendDailySummary({ to, stats }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    return false;
  }

  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 20px; border: 1px solid #dee2e6; border-top: none; }
          .stat-card { background: white; padding: 15px; border-radius: 8px; margin: 10px 0; text-align: center; }
          .stat-number { font-size: 32px; font-weight: bold; color: #667eea; }
          .stat-label { color: #6c757d; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">📊 Daily Security Summary</h1>
            <p style="margin: 5px 0 0 0;">${new Date().toLocaleDateString()}</p>
          </div>
          <div class="content">
            <div class="stat-card">
              <div class="stat-number">${stats.totalTraffic || 0}</div>
              <div class="stat-label">Total Traffic Analyzed</div>
            </div>
            <div class="stat-card">
              <div class="stat-number" style="color: #dc3545;">${stats.totalAttacks || 0}</div>
              <div class="stat-label">Attacks Detected</div>
            </div>
            <div class="stat-card">
              <div class="stat-number" style="color: #fd7e14;">${stats.blockedIPs || 0}</div>
              <div class="stat-label">IPs Blocked</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"AI-IDS System" <${process.env.SMTP_USER}>`,
      to: to || process.env.ADMIN_EMAIL || process.env.SMTP_USER,
      subject: `📊 Daily Security Summary - ${new Date().toLocaleDateString()}`,
      html: htmlContent
    });

    logger.info('Daily summary email sent');
    return true;

  } catch (error) {
    logger.error('Failed to send summary email:', error);
    return false;
  }
}

module.exports = {
  sendAlertEmail,
  sendDailySummary
};
