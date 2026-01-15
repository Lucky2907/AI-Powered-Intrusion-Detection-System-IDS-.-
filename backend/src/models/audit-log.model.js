/**
 * Audit Log Model
 * Tracks all system actions for compliance
 */

module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define('AuditLog', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    eventType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'event_type'
    },
    userId: {
      type: DataTypes.UUID,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    action: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    resourceType: {
      type: DataTypes.STRING(50),
      field: 'resource_type'
    },
    resourceId: {
      type: DataTypes.STRING(255),
      field: 'resource_id'
    },
    ipAddress: {
      type: DataTypes.INET,
      field: 'ip_address'
    },
    userAgent: {
      type: DataTypes.TEXT,
      field: 'user_agent'
    },
    blockchainHash: {
      type: DataTypes.STRING(64),
      field: 'blockchain_hash'
    },
    previousHash: {
      type: DataTypes.STRING(64),
      field: 'previous_hash'
    },
    metadata: {
      type: DataTypes.JSONB
    }
  }, {
    tableName: 'audit_logs',
    underscored: true,
    timestamps: false,
    indexes: [
      { fields: ['timestamp'] },
      { fields: ['user_id'] },
      { fields: ['event_type'] }
    ]
  });

  // Associations
  AuditLog.associate = (models) => {
    AuditLog.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return AuditLog;
};
