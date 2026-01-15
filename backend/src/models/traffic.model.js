/**
 * Traffic Log Model
 * Stores captured network traffic and ML predictions
 */

module.exports = (sequelize, DataTypes) => {
  const TrafficLog = sequelize.define('TrafficLog', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    
    // Network info
    srcIp: {
      type: DataTypes.INET,
      allowNull: false,
      field: 'src_ip'
    },
    dstIp: {
      type: DataTypes.INET,
      allowNull: false,
      field: 'dst_ip'
    },
    srcPort: {
      type: DataTypes.INTEGER,
      field: 'src_port'
    },
    dstPort: {
      type: DataTypes.INTEGER,
      field: 'dst_port'
    },
    protocol: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    
    // Packet details
    packetSize: {
      type: DataTypes.INTEGER,
      field: 'packet_size'
    },
    ttl: {
      type: DataTypes.INTEGER
    },
    tcpFlags: {
      type: DataTypes.STRING(20),
      field: 'tcp_flags'
    },
    
    // Flow features
    flowDuration: {
      type: DataTypes.FLOAT,
      field: 'flow_duration'
    },
    totalFwdPackets: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'total_fwd_packets'
    },
    totalBwdPackets: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'total_bwd_packets'
    },
    totalFwdBytes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'total_fwd_bytes'
    },
    totalBwdBytes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'total_bwd_bytes'
    },
    
    // Statistical features
    fwdPacketLengthMean: {
      type: DataTypes.FLOAT,
      field: 'fwd_packet_length_mean'
    },
    fwdPacketLengthStd: {
      type: DataTypes.FLOAT,
      field: 'fwd_packet_length_std'
    },
    flowBytesPerSec: {
      type: DataTypes.FLOAT,
      field: 'flow_bytes_per_sec'
    },
    flowPacketsPerSec: {
      type: DataTypes.FLOAT,
      field: 'flow_packets_per_sec'
    },
    
    // ML prediction results
    isAttack: {
      type: DataTypes.BOOLEAN,
      field: 'is_attack'
    },
    attackType: {
      type: DataTypes.STRING(50),
      field: 'attack_type'
    },
    confidenceScore: {
      type: DataTypes.FLOAT,
      field: 'confidence_score'
    },
    anomalyScore: {
      type: DataTypes.FLOAT,
      field: 'anomaly_score'
    },
    
    // State
    trafficState: {
      type: DataTypes.ENUM('normal', 'suspicious', 'attack', 'blocked'),
      defaultValue: 'normal',
      field: 'traffic_state'
    },
    
    // Metadata
    geoLocationSrc: {
      type: DataTypes.STRING(50),
      field: 'geo_location_src'
    },
    geoLocationDst: {
      type: DataTypes.STRING(50),
      field: 'geo_location_dst'
    }
  }, {
    tableName: 'traffic_logs',
    underscored: true,
    timestamps: false,
    indexes: [
      { fields: ['timestamp'] },
      { fields: ['src_ip'] },
      { fields: ['dst_ip'] },
      { fields: ['is_attack'] },
      { fields: ['traffic_state'] }
    ]
  });

  // Associations
  TrafficLog.associate = (models) => {
    TrafficLog.hasMany(models.Alert, {
      foreignKey: 'trafficLogId',
      as: 'alerts'
    });
  };

  return TrafficLog;
};
