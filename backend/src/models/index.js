/**
 * Sequelize Models Index
 * Initializes all database models
 */

const { Sequelize } = require('sequelize');
const config = require('../../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Initialize Sequelize
const sequelize = new Sequelize(dbConfig);

const db = {};

// Import models
db.User = require('./user.model')(sequelize, Sequelize.DataTypes);
db.TrafficLog = require('./traffic.model')(sequelize, Sequelize.DataTypes);
db.Alert = require('./alert.model')(sequelize, Sequelize.DataTypes);
db.BlockedIP = require('./blocked-ip.model')(sequelize, Sequelize.DataTypes);
db.SystemMetric = require('./system-metric.model')(sequelize, Sequelize.DataTypes);
db.AuditLog = require('./audit-log.model')(sequelize, Sequelize.DataTypes);

// Define associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
