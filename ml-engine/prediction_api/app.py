"""
Flask API for ML Model Predictions
Provides REST endpoints for real-time intrusion detection
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
import joblib
import logging
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from feature_extraction.feature_engineering import FeatureExtractor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend access

# Global variables for loaded models
model = None
feature_extractor = None
model_metadata = {}


def load_models():
    """Load trained ML model and feature extractor on startup"""
    global model, feature_extractor, model_metadata
    
    try:
        # Get the ml-engine directory (parent of prediction_api)
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        models_dir = os.path.join(base_dir, 'models')
        
        # Load model
        model_path = os.path.join(models_dir, 'random_forest_model.pkl')
        model = joblib.load(model_path)
        logger.info(f"✓ Model loaded from {model_path}")
        
        # Load scaler and label encoder
        scaler_path = os.path.join(models_dir, 'scaler.pkl')
        scaler = joblib.load(scaler_path)
        logger.info(f"✓ Scaler loaded from {scaler_path}")
        
        label_encoder_path = os.path.join(models_dir, 'label_encoder.pkl')
        label_encoder = joblib.load(label_encoder_path)
        logger.info(f"✓ Label encoder loaded from {label_encoder_path}")
        
        # Store them in a simple feature extractor object
        feature_extractor = type('FeatureExtractor', (), {
            'scaler': scaler,
            'label_encoder': label_encoder
        })()
        
        # Load model metadata
        import json
        metadata_path = os.path.join(models_dir, 'model_metadata.json')
        if os.path.exists(metadata_path):
            with open(metadata_path, 'r') as f:
                model_metadata = json.load(f)
            logger.info("✓ Model metadata loaded")
        
        return True
        
    except Exception as e:
        logger.error(f"Error loading models: {e}")
        return False


@app.route('/')
def index():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'AI-IDS ML Prediction API',
        'version': '1.0.0',
        'model_loaded': model is not None
    })


@app.route('/api/health', methods=['GET'])
def health_check():
    """Detailed health check"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'feature_extractor_loaded': feature_extractor is not None,
        'model_accuracy': model_metadata.get('accuracy', 'N/A'),
        'model_type': 'Random Forest'
    })


@app.route('/api/predict', methods=['POST'])
def predict():
    """
    Predict if traffic is attack or normal
    
    Request body:
    {
        "flow_duration": 1.5,
        "total_fwd_packets": 10,
        "total_bwd_packets": 8,
        ...
    }
    
    Response:
    {
        "is_attack": true,
        "attack_type": "DDoS",
        "confidence": 0.95,
        "anomaly_score": 0.87
    }
    """
    try:
        if model is None or feature_extractor is None:
            return jsonify({'error': 'Models not loaded'}), 500
        
        # Get request data
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Convert to numpy array (ensure correct feature order)
        import json
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        feature_names_path = os.path.join(base_dir, 'models', 'feature_names.json')
        with open(feature_names_path, 'r') as f:
            feature_names = json.load(f)
        
        # Extract features in correct order
        feature_values = [data.get(fname, 0) for fname in feature_names]
        X = np.array([feature_values])
        
        # Normalize features
        X_scaled = feature_extractor.scaler.transform(X)
        
        # Make prediction
        prediction = model.predict(X_scaled)[0]
        prediction_proba = model.predict_proba(X_scaled)[0]
        
        # Get class labels
        class_labels = feature_extractor.label_encoder.classes_
        
        # Calculate confidence and anomaly score
        confidence = float(np.max(prediction_proba))
        predicted_class = class_labels[prediction]
        
        # Determine if attack
        is_attack = predicted_class.upper() != 'BENIGN'
        
        # Calculate anomaly score (distance from normal)
        normal_idx = np.where(class_labels == 'BENIGN')[0]
        anomaly_score = 1.0 - prediction_proba[normal_idx[0]] if len(normal_idx) > 0 else confidence
        
        response = {
            'is_attack': bool(is_attack),
            'attack_type': predicted_class if is_attack else 'Normal',
            'confidence': round(confidence, 4),
            'anomaly_score': round(float(anomaly_score), 4),
            'all_probabilities': {
                class_labels[i]: round(float(prediction_proba[i]), 4) 
                for i in range(len(class_labels))
            },
            'timestamp': pd.Timestamp.now().isoformat()
        }
        
        logger.info(f"Prediction: {predicted_class} (confidence: {confidence:.2f})")
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/predict/batch', methods=['POST'])
def predict_batch():
    """
    Batch prediction for multiple traffic flows
    
    Request body:
    {
        "data": [
            {...traffic_features_1...},
            {...traffic_features_2...},
            ...
        ]
    }
    """
    try:
        if model is None or feature_extractor is None:
            return jsonify({'error': 'Models not loaded'}), 500
        
        request_data = request.get_json()
        data_list = request_data.get('data', [])
        
        if not data_list:
            return jsonify({'error': 'No data provided'}), 400
        
        # Convert to DataFrame
        df = pd.DataFrame(data_list)
        
        # Extract and normalize features
        X = feature_extractor.prepare_inference_data(df)
        
        # Make predictions
        predictions = model.predict(X)
        predictions_proba = model.predict_proba(X)
        
        # Get class labels
        class_labels = feature_extractor.label_encoder.classes_
        
        # Format results
        results = []
        for i in range(len(predictions)):
            predicted_class = class_labels[predictions[i]]
            confidence = float(np.max(predictions_proba[i]))
            is_attack = predicted_class.lower() not in ['benign', 'normal']
            
            results.append({
                'index': i,
                'is_attack': bool(is_attack),
                'attack_type': predicted_class if is_attack else 'Normal',
                'confidence': round(confidence, 4)
            })
        
        response = {
            'total_flows': len(results),
            'attack_count': sum(1 for r in results if r['is_attack']),
            'normal_count': sum(1 for r in results if not r['is_attack']),
            'predictions': results
        }
        
        logger.info(f"Batch prediction: {len(results)} flows processed")
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Batch prediction error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/model/info', methods=['GET'])
def model_info():
    """Get information about the loaded model"""
    if model is None:
        return jsonify({'error': 'Model not loaded'}), 500
    
    # Load feature names from JSON
    import json
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    feature_names_path = os.path.join(base_dir, 'models', 'feature_names.json')
    with open(feature_names_path, 'r') as f:
        feature_names = json.load(f)
    
    info = {
        'model_type': 'Random Forest',
        'n_features': len(feature_names),
        'feature_names': feature_names,
        'n_classes': len(feature_extractor.label_encoder.classes_) if feature_extractor else 0,
        'class_labels': feature_extractor.label_encoder.classes_.tolist() if feature_extractor else [],
        'metrics': model_metadata
    }
    
    # Add model-specific info
    if hasattr(model, 'n_estimators'):
        info['n_estimators'] = model.n_estimators
    if hasattr(model, 'max_depth'):
        info['max_depth'] = model.max_depth
    
    return jsonify(info), 200


@app.route('/api/model/features', methods=['GET'])
def get_features():
    """Get list of required features for prediction"""
    if feature_extractor is None:
        return jsonify({'error': 'Feature extractor not loaded'}), 500
    
    return jsonify({
        'features': feature_extractor.feature_columns,
        'count': len(feature_extractor.feature_columns)
    }), 200


@app.route('/api/model/importance', methods=['GET'])
def feature_importance():
    """Get feature importance ranking"""
    if model is None or not hasattr(model, 'feature_importances_'):
        return jsonify({'error': 'Feature importance not available'}), 500
    
    importance_data = []
    for i, importance in enumerate(model.feature_importances_):
        importance_data.append({
            'feature': feature_extractor.feature_columns[i],
            'importance': round(float(importance), 6)
        })
    
    # Sort by importance
    importance_data = sorted(importance_data, key=lambda x: x['importance'], reverse=True)
    
    return jsonify({
        'feature_importance': importance_data[:20]  # Top 20 features
    }), 200


@app.route('/api/test', methods=['GET'])
def test_prediction():
    """Test endpoint with sample data"""
    sample_data = {
        'flow_duration': 1.5,
        'total_fwd_packets': 10,
        'total_bwd_packets': 8,
        'total_fwd_bytes': 5000,
        'total_bwd_bytes': 3200,
        'fwd_packet_length_mean': 500,
        'fwd_packet_length_std': 50,
        'fwd_packet_length_max': 600,
        'fwd_packet_length_min': 400,
        'bwd_packet_length_mean': 400,
        'bwd_packet_length_std': 30,
        'bwd_packet_length_max': 500,
        'bwd_packet_length_min': 350,
        'flow_bytes_per_sec': 5466.67,
        'flow_packets_per_sec': 12.0,
        'fwd_iat_mean': 0.15,
        'bwd_iat_mean': 0.18,
        'protocol': 6,
        'dst_port': 80
    }
    
    return jsonify({
        'message': 'Send POST request to /api/predict with this sample data',
        'sample_data': sample_data
    }), 200


# ====================================
# Error Handlers
# ====================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500


# ====================================
# Application Startup
# ====================================

if __name__ == '__main__':
    # Load models on startup
    logger.info("Starting AI-IDS Prediction API...")
    
    if load_models():
        logger.info("Models loaded successfully")
    else:
        logger.warning("Running without models - predictions will fail")
    
    # Run Flask app
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True
    )
