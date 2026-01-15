/**
 * Alert Model
 * Security alerts generated from detected attacks
 */

module.exports = (sequelize, DataTypes) => {
  const Alert = sequelize.define('Alert', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    trafficLogId: {
      type: DataTypes.BIGINT,
      field: 'traffic_log_id',
      references: {
        model: 'traffic_logs',
        key: 'id'
      }
    },
    
    // Alert details
    alertType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'alert_type'
    },
    severity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5
      }
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    
    // Attack classification
    attackCategory: {
      type: DataTypes.STRING(50),
      field: 'attack_category'
    },
    cveReference: {
      type: DataTypes.STRING(50),
      field: 'cve_reference'
    },
    
    // Status tracking
    status: {
      type: DataTypes.ENUM('open', 'investigating', 'resolved', 'false_positive'),
      defaultValue: 'open'
    },
    assignedTo: {
      type: DataTypes.UUID,
      field: 'assigned_to',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    resolvedAt: {
      type: DataTypes.DATE,
      field: 'resolved_at'
    },
    resolutionNotes: {
      type: DataTypes.TEXT,
      field: 'resolution_notes'
    },
    
    // Response actions
    autoBlocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'auto_blocked'
    },
    firewallRuleApplied: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'firewall_rule_applied'
    },
    notificationSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'notification_sent'
    }
  }, {
    tableName: 'alerts',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['status'] },
      { fields: ['severity'] },
      { fields: ['created_at'] },
      { fields: ['assigned_to'] }
    ]
  });

  // Associations
  Alert.associate = (models) => {
    Alert.belongsTo(models.TrafficLog, {
      foreignKey: 'trafficLogId',
      as: 'trafficLog'
    });
    
    Alert.belongsTo(models.User, {
      foreignKey: 'assignedTo',
      as: 'assignedUser'
    });
  };

  return Alert;
};
