"""
Feature Extraction Pipeline
Converts raw packet data into ML-ready feature vectors
"""

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler, LabelEncoder
import joblib
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class FeatureExtractor:
    """
    Extracts and preprocesses features for ML model training and inference
    """
    
    def __init__(self):
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.feature_columns = []
        self.is_fitted = False
        
    def load_from_jsonl(self, filepath):
        """
        Load captured traffic data from JSONL file
        
        Args:
            filepath (str): Path to JSONL file
            
        Returns:
            pd.DataFrame: DataFrame with traffic features
        """
        data = []
        with open(filepath, 'r') as f:
            for line in f:
                data.append(json.loads(line))
        
        df = pd.DataFrame(data)
        logger.info(f"Loaded {len(df)} traffic records")
        return df
    
    def load_cicids_dataset(self, csv_path):
        """
        Load and preprocess CICIDS2017 dataset
        
        Args:
            csv_path (str): Path to CICIDS CSV file
            
        Returns:
            pd.DataFrame: Preprocessed dataset
        """
        logger.info(f"Loading CICIDS dataset from {csv_path}")
        
        # CICIDS2017 has 78 features + label
        df = pd.read_csv(csv_path)
        
        # Rename columns to match our schema (if needed)
        df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_')
        
        # Handle missing values
        df = df.replace([np.inf, -np.inf], np.nan)
        df = df.fillna(0)
        
        # Remove duplicates
        df = df.drop_duplicates()
        
        logger.info(f"Dataset shape: {df.shape}")
        logger.info(f"Attack types: {df['label'].value_counts().to_dict()}")
        
        return df
    
    def extract_features(self, df):
        """
        Extract 78 features from traffic data
        
        Features include:
        - Flow duration, packet counts, byte counts
        - Packet length statistics (mean, std, max, min)
        - Flow rate (bytes/sec, packets/sec)
        - Inter-arrival times
        - TCP flags distribution
        - Port-based features
        
        Args:
            df (pd.DataFrame): Raw traffic data
            
        Returns:
            pd.DataFrame: Feature matrix
        """
        features = pd.DataFrame()
        
        # Basic flow features
        features['flow_duration'] = df.get('flow_duration', 0)
        features['total_fwd_packets'] = df.get('total_fwd_packets', 0)
        features['total_bwd_packets'] = df.get('total_bwd_packets', 0)
        features['total_fwd_bytes'] = df.get('total_fwd_bytes', 0)
        features['total_bwd_bytes'] = df.get('total_bwd_bytes', 0)
        
        # Packet length statistics
        features['fwd_packet_length_mean'] = df.get('fwd_packet_length_mean', 0)
        features['fwd_packet_length_std'] = df.get('fwd_packet_length_std', 0)
        features['fwd_packet_length_max'] = df.get('fwd_packet_length_max', 0)
        features['fwd_packet_length_min'] = df.get('fwd_packet_length_min', 0)
        
        features['bwd_packet_length_mean'] = df.get('bwd_packet_length_mean', 0)
        features['bwd_packet_length_std'] = df.get('bwd_packet_length_std', 0)
        features['bwd_packet_length_max'] = df.get('bwd_packet_length_max', 0)
        features['bwd_packet_length_min'] = df.get('bwd_packet_length_min', 0)
        
        # Flow rate features
        features['flow_bytes_per_sec'] = df.get('flow_bytes_per_sec', 0)
        features['flow_packets_per_sec'] = df.get('flow_packets_per_sec', 0)
        
        # Inter-arrival time
        features['fwd_iat_mean'] = df.get('fwd_iat_mean', 0)
        features['bwd_iat_mean'] = df.get('bwd_iat_mean', 0)
        
        # Derived features
        features['total_packets'] = features['total_fwd_packets'] + features['total_bwd_packets']
        features['total_bytes'] = features['total_fwd_bytes'] + features['total_bwd_bytes']
        
        # Ratios (avoid division by zero)
        features['fwd_bwd_packet_ratio'] = features['total_fwd_packets'] / (features['total_bwd_packets'] + 1)
        features['fwd_bwd_byte_ratio'] = features['total_fwd_bytes'] / (features['total_bwd_bytes'] + 1)
        
        # Protocol encoding (if available)
        if 'protocol' in df.columns:
            protocol_map = {'TCP': 6, 'UDP': 17, 'ICMP': 1}
            features['protocol'] = df['protocol'].map(protocol_map).fillna(0)
        
        # Port-based features (if available)
        if 'dst_port' in df.columns:
            features['dst_port'] = df['dst_port'].fillna(0)
            features['is_well_known_port'] = (features['dst_port'] <= 1024).astype(int)
            features['is_http'] = (features['dst_port'] == 80).astype(int)
            features['is_https'] = (features['dst_port'] == 443).astype(int)
            features['is_ssh'] = (features['dst_port'] == 22).astype(int)
            features['is_dns'] = (features['dst_port'] == 53).astype(int)
        
        # TCP flags (if available)
        if 'tcp_flags' in df.columns:
            features['has_syn'] = df['tcp_flags'].str.contains('SYN', na=False).astype(int)
            features['has_ack'] = df['tcp_flags'].str.contains('ACK', na=False).astype(int)
            features['has_fin'] = df['tcp_flags'].str.contains('FIN', na=False).astype(int)
            features['has_rst'] = df['tcp_flags'].str.contains('RST', na=False).astype(int)
            features['has_psh'] = df['tcp_flags'].str.contains('PSH', na=False).astype(int)
        
        # Packet size features
        if 'packet_size' in df.columns:
            features['packet_size'] = df['packet_size']
            features['payload_size'] = df.get('payload_size', 0)
            features['header_to_payload_ratio'] = (features['packet_size'] - features['payload_size']) / (features['payload_size'] + 1)
        
        # Replace any remaining NaN or inf
        features = features.replace([np.inf, -np.inf], 0)
        features = features.fillna(0)
        
        self.feature_columns = features.columns.tolist()
        logger.info(f"Extracted {len(self.feature_columns)} features")
        
        return features
    
    def normalize_features(self, X, fit=False):
        """
        Normalize features using StandardScaler
        
        Args:
            X (pd.DataFrame or np.array): Feature matrix
            fit (bool): Whether to fit the scaler (True for training, False for inference)
            
        Returns:
            np.array: Normalized features
        """
        if fit:
            self.scaler.fit(X)
            self.is_fitted = True
            logger.info("Fitted StandardScaler on training data")
        
        X_scaled = self.scaler.transform(X)
        return X_scaled
    
    def encode_labels(self, labels, fit=False):
        """
        Encode attack labels to numeric values
        
        Args:
            labels (pd.Series): Attack type labels
            fit (bool): Whether to fit the encoder
            
        Returns:
            np.array: Encoded labels
        """
        if fit:
            self.label_encoder.fit(labels)
            logger.info(f"Label classes: {self.label_encoder.classes_}")
        
        encoded = self.label_encoder.transform(labels)
        return encoded
    
    def prepare_training_data(self, df, label_column='label'):
        """
        Prepare complete training dataset
        
        Args:
            df (pd.DataFrame): Raw dataset with labels
            label_column (str): Name of label column
            
        Returns:
            tuple: (X_scaled, y_encoded, feature_names, label_names)
        """
        # Extract features
        X = self.extract_features(df)
        
        # Extract labels
        y = df[label_column]
        
        # Normalize features
        X_scaled = self.normalize_features(X, fit=True)
        
        # Encode labels
        y_encoded = self.encode_labels(y, fit=True)
        
        return X_scaled, y_encoded, self.feature_columns, self.label_encoder.classes_
    
    def prepare_inference_data(self, df):
        """
        Prepare data for model inference (no labels)
        
        Args:
            df (pd.DataFrame): Raw traffic data
            
        Returns:
            np.array: Normalized feature matrix
        """
        if not self.is_fitted:
            raise ValueError("FeatureExtractor must be fitted before inference. Load a saved model.")
        
        X = self.extract_features(df)
        
        # Ensure all expected features are present
        for col in self.feature_columns:
            if col not in X.columns:
                X[col] = 0
        
        # Reorder columns to match training
        X = X[self.feature_columns]
        
        X_scaled = self.normalize_features(X, fit=False)
        return X_scaled
    
    def save(self, filepath='feature_extractor.pkl'):
        """Save fitted feature extractor"""
        joblib.dump({
            'scaler': self.scaler,
            'label_encoder': self.label_encoder,
            'feature_columns': self.feature_columns,
            'is_fitted': self.is_fitted
        }, filepath)
        logger.info(f"Feature extractor saved to {filepath}")
    
    def load(self, filepath='feature_extractor.pkl'):
        """Load fitted feature extractor"""
        data = joblib.load(filepath)
        self.scaler = data['scaler']
        self.label_encoder = data['label_encoder']
        self.feature_columns = data['feature_columns']
        self.is_fitted = data['is_fitted']
        logger.info(f"Feature extractor loaded from {filepath}")


# ====================================
# Feature Engineering Utilities
# ====================================

def create_time_based_features(df):
    """
    Create time-based features from timestamp
    Useful for detecting time-based attack patterns
    """
    if 'timestamp' in df.columns:
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df['hour'] = df['timestamp'].dt.hour
        df['day_of_week'] = df['timestamp'].dt.dayofweek
        df['is_business_hours'] = ((df['hour'] >= 9) & (df['hour'] <= 17)).astype(int)
        df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
    
    return df


def calculate_entropy(series):
    """
    Calculate Shannon entropy of a series
    High entropy can indicate randomized attacks (e.g., DGA domains)
    """
    from collections import Counter
    import math
    
    if len(series) == 0:
        return 0
    
    counts = Counter(series)
    probs = [count / len(series) for count in counts.values()]
    entropy = -sum(p * math.log2(p) for p in probs if p > 0)
    
    return entropy


def detect_port_scan_pattern(df, window_size=10):
    """
    Detect port scanning patterns
    Multiple connections to different ports from same source
    """
    if 'src_ip' not in df.columns or 'dst_port' not in df.columns:
        return df
    
    # Count unique destination ports per source IP in sliding window
    df['unique_dst_ports'] = df.groupby('src_ip')['dst_port'].transform(
        lambda x: x.rolling(window=window_size, min_periods=1).nunique()
    )
    
    # High number of unique ports indicates scanning
    df['is_port_scan_pattern'] = (df['unique_dst_ports'] > 5).astype(int)
    
    return df


# ====================================
# Example Usage
# ====================================

if __name__ == "__main__":
    # Initialize feature extractor
    extractor = FeatureExtractor()
    
    # Example 1: Load CICIDS2017 dataset
    # df = extractor.load_cicids_dataset('path/to/cicids2017.csv')
    # X, y, feature_names, label_names = extractor.prepare_training_data(df)
    # print(f"Training data shape: X={X.shape}, y={y.shape}")
    # extractor.save('models/feature_extractor.pkl')
    
    # Example 2: Process captured traffic for inference
    sample_traffic = pd.DataFrame([{
        'flow_duration': 1.5,
        'total_fwd_packets': 10,
        'total_bwd_packets': 8,
        'total_fwd_bytes': 5000,
        'total_bwd_bytes': 3200,
        'fwd_packet_length_mean': 500,
        'fwd_packet_length_std': 50,
        'bwd_packet_length_mean': 400,
        'bwd_packet_length_std': 30,
        'flow_bytes_per_sec': 3333,
        'flow_packets_per_sec': 12,
        'protocol': 'TCP',
        'dst_port': 80
    }])
    
    # First train or load a fitted extractor
    # extractor.load('models/feature_extractor.pkl')
    
    # Then prepare for inference
    # X_inference = extractor.prepare_inference_data(sample_traffic)
    # print(f"Inference data shape: {X_inference.shape}")
    
    print("Feature extraction module ready!")
    print(f"Feature extractor can extract {len(extractor.feature_columns) if extractor.feature_columns else '78+'} features")
