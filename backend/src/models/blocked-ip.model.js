/**
 * Blocked IP Model
 * Tracks blocked IP addresses
 */

module.exports = (sequelize, DataTypes) => {
  const BlockedIP = sequelize.define('BlockedIP', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    ipAddress: {
      type: DataTypes.INET,
      allowNull: false,
      unique: true,
      field: 'ip_address'
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    blockedBy: {
      type: DataTypes.UUID,
      field: 'blocked_by',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    blockType: {
      type: DataTypes.ENUM('temporary', 'permanent'),
      defaultValue: 'temporary',
      field: 'block_type'
    },
    blockedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'blocked_at'
    },
    expiresAt: {
      type: DataTypes.DATE,
      field: 'expires_at'
    },
    unblockedAt: {
      type: DataTypes.DATE,
      field: 'unblocked_at'
    },
    alertId: {
      type: DataTypes.UUID,
      field: 'alert_id',
      references: {
        model: 'alerts',
        key: 'id'
      }
    },
    totalAttacksFromIp: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      field: 'total_attacks_from_ip'
    },
    lastAttackType: {
      type: DataTypes.STRING(50),
      field: 'last_attack_type'
    }
  }, {
    tableName: 'blocked_ips',
    underscored: true,
    timestamps: false,
    indexes: [
      { fields: ['ip_address'] },
      { fields: ['expires_at'] }
    ]
  });

  return BlockedIP;
};
