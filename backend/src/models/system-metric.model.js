/**
 * System Metric Model
 * Tracks system performance and health
 */

module.exports = (sequelize, DataTypes) => {
  const SystemMetric = sequelize.define('SystemMetric', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    
    // Traffic metrics
    totalPacketsProcessed: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
      field: 'total_packets_processed'
    },
    packetsPerSecond: {
      type: DataTypes.FLOAT,
      field: 'packets_per_second'
    },
    totalAttacksDetected: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'total_attacks_detected'
    },
    
    // System health
    cpuUsage: {
      type: DataTypes.FLOAT,
      field: 'cpu_usage'
    },
    memoryUsage: {
      type: DataTypes.FLOAT,
      field: 'memory_usage'
    },
    diskUsage: {
      type: DataTypes.FLOAT,
      field: 'disk_usage'
    },
    
    // ML model performance
    modelAccuracy: {
      type: DataTypes.FLOAT,
      field: 'model_accuracy'
    },
    modelLatencyMs: {
      type: DataTypes.FLOAT,
      field: 'model_latency_ms'
    },
    falsePositiveRate: {
      type: DataTypes.FLOAT,
      field: 'false_positive_rate'
    },
    falseNegativeRate: {
      type: DataTypes.FLOAT,
      field: 'false_negative_rate'
    },
    
    // Service availability
    backendStatus: {
      type: DataTypes.STRING(20),
      defaultValue: 'healthy',
      field: 'backend_status'
    },
    mlServiceStatus: {
      type: DataTypes.STRING(20),
      defaultValue: 'healthy',
      field: 'ml_service_status'
    },
    databaseStatus: {
      type: DataTypes.STRING(20),
      defaultValue: 'healthy',
      field: 'database_status'
    }
  }, {
    tableName: 'system_metrics',
    underscored: true,
    timestamps: false,
    indexes: [
      { fields: ['timestamp'] }
    ]
  });

  return SystemMetric;
};
