#!/usr/bin/env python3
"""
Quick Training Script for AI-IDS
Generates initial models with synthetic data for testing
"""

import os
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
import joblib
import json
from datetime import datetime

# Create models directory
os.makedirs('models', exist_ok=True)

print("🚀 Quick Training: Generating AI-IDS Models\n")

# ============================================
# 1. Generate Synthetic Training Data
# ============================================
print("📊 Step 1: Generating synthetic training data...")

np.random.seed(42)
n_samples = 10000

# Generate features (simplified version of 78 features)
features = {
    # Flow features
    'flow_duration': np.random.exponential(5000, n_samples),
    'flow_bytes_s': np.random.exponential(10000, n_samples),
    'flow_packets_s': np.random.exponential(100, n_samples),
    
    # Packet statistics
    'total_fwd_packets': np.random.poisson(50, n_samples),
    'total_bwd_packets': np.random.poisson(30, n_samples),
    'fwd_packet_length_max': np.random.uniform(0, 1500, n_samples),
    'fwd_packet_length_mean': np.random.uniform(0, 1000, n_samples),
    'fwd_packet_length_std': np.random.uniform(0, 500, n_samples),
    'bwd_packet_length_max': np.random.uniform(0, 1500, n_samples),
    'bwd_packet_length_mean': np.random.uniform(0, 1000, n_samples),
    'bwd_packet_length_std': np.random.uniform(0, 500, n_samples),
    
    # Flag counts
    'fwd_psh_flags': np.random.poisson(2, n_samples),
    'fwd_urg_flags': np.random.poisson(0.1, n_samples),
    'bwd_psh_flags': np.random.poisson(2, n_samples),
    'bwd_urg_flags': np.random.poisson(0.1, n_samples),
    'fin_flag_count': np.random.poisson(1, n_samples),
    'syn_flag_count': np.random.poisson(1, n_samples),
    'rst_flag_count': np.random.poisson(0.5, n_samples),
    'psh_flag_count': np.random.poisson(3, n_samples),
    'ack_flag_count': np.random.poisson(50, n_samples),
    'urg_flag_count': np.random.poisson(0.1, n_samples),
    
    # Inter-arrival times
    'fwd_iat_total': np.random.exponential(1000, n_samples),
    'fwd_iat_mean': np.random.exponential(50, n_samples),
    'fwd_iat_std': np.random.exponential(100, n_samples),
    'fwd_iat_max': np.random.exponential(500, n_samples),
    'fwd_iat_min': np.random.exponential(10, n_samples),
    'bwd_iat_total': np.random.exponential(1000, n_samples),
    'bwd_iat_mean': np.random.exponential(50, n_samples),
    'bwd_iat_std': np.random.exponential(100, n_samples),
    'bwd_iat_max': np.random.exponential(500, n_samples),
    'bwd_iat_min': np.random.exponential(10, n_samples),
}

df = pd.DataFrame(features)

# Generate labels with realistic distribution
# 85% Normal, 15% Attack (various types)
labels = np.random.choice(
    ['BENIGN', 'DDoS', 'PortScan', 'Bot', 'Brute Force'],
    size=n_samples,
    p=[0.85, 0.05, 0.04, 0.03, 0.03]
)

# Add attack-specific patterns
attack_mask = labels != 'BENIGN'
df.loc[attack_mask, 'flow_packets_s'] *= 3  # Attacks have higher packet rate
df.loc[attack_mask, 'syn_flag_count'] *= 2  # More SYN flags in attacks
df.loc[labels == 'DDoS', 'flow_bytes_s'] *= 5  # DDoS has very high byte rate
df.loc[labels == 'PortScan', 'syn_flag_count'] *= 5  # Port scans have many SYNs

print(f"   ✓ Generated {n_samples:,} samples")
print(f"   ✓ BENIGN: {(labels == 'BENIGN').sum():,} ({(labels == 'BENIGN').sum()/n_samples*100:.1f}%)")
print(f"   ✓ Attacks: {attack_mask.sum():,} ({attack_mask.sum()/n_samples*100:.1f}%)\n")

# ============================================
# 2. Train Random Forest Model
# ============================================
print("🌲 Step 2: Training Random Forest classifier...")

# Prepare features and labels
X = df.values
y = labels

# Encode labels
label_encoder = LabelEncoder()
y_encoded = label_encoder.fit_transform(y)

# Normalize features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Train Random Forest
rf_model = RandomForestClassifier(
    n_estimators=100,
    max_depth=20,
    min_samples_split=5,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1
)

rf_model.fit(X_scaled, y_encoded)

# Calculate training accuracy
train_accuracy = rf_model.score(X_scaled, y_encoded)
print(f"   ✓ Model trained successfully")
print(f"   ✓ Training accuracy: {train_accuracy*100:.2f}%\n")

# ============================================
# 3. Save Models and Metadata
# ============================================
print("💾 Step 3: Saving models and metadata...")

# Save Random Forest model
joblib.dump(rf_model, 'models/random_forest_model.pkl')
print("   ✓ Saved: random_forest_model.pkl")

# Save scaler
joblib.dump(scaler, 'models/scaler.pkl')
print("   ✓ Saved: scaler.pkl")

# Save label encoder
joblib.dump(label_encoder, 'models/label_encoder.pkl')
print("   ✓ Saved: label_encoder.pkl")

# Save feature names
feature_names = list(features.keys())
with open('models/feature_names.json', 'w') as f:
    json.dump(feature_names, f, indent=2)
print("   ✓ Saved: feature_names.json")

# Save model metadata
metadata = {
    'model_type': 'RandomForest',
    'model_version': '1.0.0',
    'training_date': datetime.now().isoformat(),
    'n_samples': int(n_samples),
    'n_features': len(feature_names),
    'feature_names': feature_names,
    'classes': label_encoder.classes_.tolist(),
    'n_classes': len(label_encoder.classes_),
    'training_accuracy': float(train_accuracy),
    'hyperparameters': {
        'n_estimators': 100,
        'max_depth': 20,
        'min_samples_split': 5,
        'min_samples_leaf': 2
    },
    'class_distribution': {
        'BENIGN': int((labels == 'BENIGN').sum()),
        'DDoS': int((labels == 'DDoS').sum()),
        'PortScan': int((labels == 'PortScan').sum()),
        'Bot': int((labels == 'Bot').sum()),
        'Brute Force': int((labels == 'Brute Force').sum())
    }
}

with open('models/model_metadata.json', 'w') as f:
    json.dump(metadata, f, indent=2)
print("   ✓ Saved: model_metadata.json\n")

# ============================================
# 4. Test Prediction
# ============================================
print("🧪 Step 4: Testing prediction...")

# Generate a test sample (normal traffic)
test_sample = np.array([list(df.iloc[0].values)])
test_sample_scaled = scaler.transform(test_sample)
prediction = rf_model.predict(test_sample_scaled)
prediction_proba = rf_model.predict_proba(test_sample_scaled)
predicted_label = label_encoder.inverse_transform(prediction)[0]
confidence = prediction_proba[0][prediction[0]]

print(f"   ✓ Test prediction: {predicted_label}")
print(f"   ✓ Confidence: {confidence*100:.2f}%\n")

# ============================================
# 5. Summary
# ============================================
print("=" * 60)
print("✅ MODEL TRAINING COMPLETE")
print("=" * 60)
print("\n📋 Summary:")
print(f"   • Model Type: Random Forest")
print(f"   • Features: {len(feature_names)}")
print(f"   • Classes: {len(label_encoder.classes_)} ({', '.join(label_encoder.classes_)})")
print(f"   • Training Samples: {n_samples:,}")
print(f"   • Accuracy: {train_accuracy*100:.2f}%")
print(f"\n📁 Saved Files:")
print(f"   • models/random_forest_model.pkl")
print(f"   • models/scaler.pkl")
print(f"   • models/label_encoder.pkl")
print(f"   • models/feature_names.json")
print(f"   • models/model_metadata.json")

print("\n🚀 Next Steps:")
print("   1. Restart the ML API:")
print("      python prediction_api/app.py")
print("\n   2. Test the API:")
print("      curl http://localhost:5000/api/model/info")
print("\n   3. Make predictions:")
print("      curl -X POST http://localhost:5000/api/predict -H 'Content-Type: application/json' -d '{...}'")

print("\n💡 Note: This uses synthetic data for demo purposes.")
print("   For production, train with real CICIDS2017 dataset using:")
print("   python training/train_model.py --data cicids2017.csv\n")

print("✅ Ready to detect intrusions!\n")
