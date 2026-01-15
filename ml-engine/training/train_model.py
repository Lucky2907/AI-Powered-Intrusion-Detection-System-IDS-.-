"""
ML Model Training Module
Trains Random Forest, XGBoost, and LSTM models on CICIDS2017 dataset
"""

import numpy as np
import pandas as pd
import joblib
import json
import logging
from datetime import datetime

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report, roc_auc_score
)

# For XGBoost
try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False
    logging.warning("XGBoost not installed. Install with: pip install xgboost")

# For LSTM (TensorFlow/Keras)
try:
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import LSTM, Dense, Dropout, Bidirectional
    from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
    TENSORFLOW_AVAILABLE = True
except ImportError:
    TENSORFLOW_AVAILABLE = False
    logging.warning("TensorFlow not installed. Install with: pip install tensorflow")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class IDSModelTrainer:
    """
    Trains and evaluates ML models for intrusion detection
    """
    
    def __init__(self, model_type='random_forest'):
        """
        Args:
            model_type (str): 'random_forest', 'xgboost', or 'lstm'
        """
        self.model_type = model_type
        self.model = None
        self.training_history = {}
        self.feature_importance = None
        
    def train_random_forest(self, X_train, y_train, n_estimators=100, max_depth=20):
        """
        Train Random Forest classifier
        
        Args:
            X_train: Training features
            y_train: Training labels
            n_estimators: Number of trees
            max_depth: Maximum tree depth
            
        Returns:
            RandomForestClassifier: Trained model
        """
        logger.info("Training Random Forest classifier...")
        
        self.model = RandomForestClassifier(
            n_estimators=n_estimators,
            max_depth=max_depth,
            min_samples_split=5,
            min_samples_leaf=2,
            max_features='sqrt',
            random_state=42,
            n_jobs=-1,
            verbose=1
        )
        
        start_time = datetime.now()
        self.model.fit(X_train, y_train)
        training_time = (datetime.now() - start_time).total_seconds()
        
        logger.info(f"Training completed in {training_time:.2f} seconds")
        
        # Get feature importance
        self.feature_importance = self.model.feature_importances_
        
        return self.model
    
    def train_xgboost(self, X_train, y_train, X_val=None, y_val=None):
        """
        Train XGBoost classifier
        
        Args:
            X_train: Training features
            y_train: Training labels
            X_val: Validation features (optional)
            y_val: Validation labels (optional)
            
        Returns:
            XGBoost model: Trained model
        """
        if not XGBOOST_AVAILABLE:
            raise ImportError("XGBoost is not installed")
        
        logger.info("Training XGBoost classifier...")
        
        # Convert to binary classification if needed
        n_classes = len(np.unique(y_train))
        objective = 'binary:logistic' if n_classes == 2 else 'multi:softmax'
        
        self.model = xgb.XGBClassifier(
            n_estimators=100,
            max_depth=10,
            learning_rate=0.1,
            objective=objective,
            num_class=n_classes if n_classes > 2 else None,
            tree_method='hist',
            random_state=42,
            n_jobs=-1
        )
        
        # Prepare validation set
        eval_set = [(X_train, y_train)]
        if X_val is not None and y_val is not None:
            eval_set.append((X_val, y_val))
        
        start_time = datetime.now()
        self.model.fit(
            X_train, y_train,
            eval_set=eval_set,
            verbose=True
        )
        training_time = (datetime.now() - start_time).total_seconds()
        
        logger.info(f"Training completed in {training_time:.2f} seconds")
        
        # Get feature importance
        self.feature_importance = self.model.feature_importances_
        
        return self.model
    
    def train_lstm(self, X_train, y_train, X_val, y_val, sequence_length=10, epochs=50):
        """
        Train LSTM model for sequential attack detection
        
        Args:
            X_train: Training features
            y_train: Training labels
            X_val: Validation features
            y_val: Validation labels
            sequence_length: Length of sequence for LSTM
            epochs: Number of training epochs
            
        Returns:
            Keras model: Trained LSTM model
        """
        if not TENSORFLOW_AVAILABLE:
            raise ImportError("TensorFlow is not installed")
        
        logger.info("Training LSTM model...")
        
        # Reshape data for LSTM (samples, sequence_length, features)
        n_samples = X_train.shape[0] // sequence_length
        n_features = X_train.shape[1]
        
        X_train_seq = X_train[:n_samples * sequence_length].reshape(n_samples, sequence_length, n_features)
        y_train_seq = y_train[:n_samples * sequence_length:sequence_length]
        
        n_samples_val = X_val.shape[0] // sequence_length
        X_val_seq = X_val[:n_samples_val * sequence_length].reshape(n_samples_val, sequence_length, n_features)
        y_val_seq = y_val[:n_samples_val * sequence_length:sequence_length]
        
        # Build LSTM model
        n_classes = len(np.unique(y_train))
        
        self.model = Sequential([
            Bidirectional(LSTM(128, return_sequences=True), input_shape=(sequence_length, n_features)),
            Dropout(0.3),
            Bidirectional(LSTM(64)),
            Dropout(0.3),
            Dense(64, activation='relu'),
            Dropout(0.2),
            Dense(n_classes, activation='softmax' if n_classes > 2 else 'sigmoid')
        ])
        
        self.model.compile(
            optimizer='adam',
            loss='sparse_categorical_crossentropy' if n_classes > 2 else 'binary_crossentropy',
            metrics=['accuracy']
        )
        
        # Callbacks
        early_stop = EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)
        checkpoint = ModelCheckpoint('models/lstm_best.h5', save_best_only=True, monitor='val_accuracy')
        
        # Train
        start_time = datetime.now()
        history = self.model.fit(
            X_train_seq, y_train_seq,
            validation_data=(X_val_seq, y_val_seq),
            epochs=epochs,
            batch_size=64,
            callbacks=[early_stop, checkpoint],
            verbose=1
        )
        training_time = (datetime.now() - start_time).total_seconds()
        
        logger.info(f"Training completed in {training_time:.2f} seconds")
        
        self.training_history = history.history
        
        return self.model
    
    def evaluate_model(self, X_test, y_test):
        """
        Evaluate model performance on test set
        
        Args:
            X_test: Test features
            y_test: Test labels
            
        Returns:
            dict: Evaluation metrics
        """
        logger.info("Evaluating model...")
        
        # Make predictions
        if self.model_type == 'lstm' and TENSORFLOW_AVAILABLE:
            # Reshape for LSTM
            sequence_length = 10
            n_samples = X_test.shape[0] // sequence_length
            X_test_seq = X_test[:n_samples * sequence_length].reshape(n_samples, sequence_length, X_test.shape[1])
            y_test_seq = y_test[:n_samples * sequence_length:sequence_length]
            
            y_pred_proba = self.model.predict(X_test_seq)
            y_pred = np.argmax(y_pred_proba, axis=1)
            y_test = y_test_seq
        else:
            y_pred = self.model.predict(X_test)
            y_pred_proba = self.model.predict_proba(X_test) if hasattr(self.model, 'predict_proba') else None
        
        # Calculate metrics
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
        recall = recall_score(y_test, y_pred, average='weighted', zero_division=0)
        f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
        
        # Confusion matrix
        cm = confusion_matrix(y_test, y_pred)
        
        # Classification report
        report = classification_report(y_test, y_pred, zero_division=0)
        
        metrics = {
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1_score': f1,
            'confusion_matrix': cm.tolist(),
            'classification_report': report
        }
        
        # ROC AUC (if binary classification)
        if y_pred_proba is not None and len(np.unique(y_test)) == 2:
            try:
                auc = roc_auc_score(y_test, y_pred_proba[:, 1])
                metrics['roc_auc'] = auc
            except:
                pass
        
        # Calculate false positive and false negative rates
        tn, fp, fn, tp = cm.ravel() if cm.shape == (2, 2) else (0, 0, 0, 0)
        fpr = fp / (fp + tn) if (fp + tn) > 0 else 0
        fnr = fn / (fn + tp) if (fn + tp) > 0 else 0
        
        metrics['false_positive_rate'] = fpr
        metrics['false_negative_rate'] = fnr
        
        logger.info(f"Accuracy: {accuracy:.4f}")
        logger.info(f"Precision: {precision:.4f}")
        logger.info(f"Recall: {recall:.4f}")
        logger.info(f"F1 Score: {f1:.4f}")
        logger.info(f"False Positive Rate: {fpr:.4f}")
        logger.info(f"False Negative Rate: {fnr:.4f}")
        
        return metrics
    
    def hyperparameter_tuning(self, X_train, y_train, cv=3):
        """
        Perform hyperparameter tuning using GridSearchCV
        
        Args:
            X_train: Training features
            y_train: Training labels
            cv: Number of cross-validation folds
        """
        logger.info("Starting hyperparameter tuning...")
        
        if self.model_type == 'random_forest':
            param_grid = {
                'n_estimators': [50, 100, 200],
                'max_depth': [10, 20, 30, None],
                'min_samples_split': [2, 5, 10],
                'min_samples_leaf': [1, 2, 4]
            }
            
            base_model = RandomForestClassifier(random_state=42, n_jobs=-1)
            
        elif self.model_type == 'xgboost' and XGBOOST_AVAILABLE:
            param_grid = {
                'n_estimators': [50, 100, 200],
                'max_depth': [6, 10, 15],
                'learning_rate': [0.01, 0.1, 0.3],
                'subsample': [0.8, 1.0]
            }
            
            base_model = xgb.XGBClassifier(random_state=42, n_jobs=-1)
        else:
            logger.warning("Hyperparameter tuning not implemented for this model type")
            return None
        
        grid_search = GridSearchCV(
            base_model,
            param_grid,
            cv=cv,
            scoring='f1_weighted',
            n_jobs=-1,
            verbose=2
        )
        
        grid_search.fit(X_train, y_train)
        
        logger.info(f"Best parameters: {grid_search.best_params_}")
        logger.info(f"Best score: {grid_search.best_score_:.4f}")
        
        self.model = grid_search.best_estimator_
        
        return grid_search.best_params_
    
    def save_model(self, filepath):
        """Save trained model to disk"""
        if self.model_type == 'lstm' and TENSORFLOW_AVAILABLE:
            self.model.save(filepath)
            logger.info(f"LSTM model saved to {filepath}")
        else:
            joblib.dump(self.model, filepath)
            logger.info(f"{self.model_type} model saved to {filepath}")
    
    def load_model(self, filepath):
        """Load trained model from disk"""
        if self.model_type == 'lstm' and TENSORFLOW_AVAILABLE:
            self.model = keras.models.load_model(filepath)
            logger.info(f"LSTM model loaded from {filepath}")
        else:
            self.model = joblib.load(filepath)
            logger.info(f"{self.model_type} model loaded from {filepath}")
    
    def get_feature_importance(self, feature_names):
        """
        Get top important features
        
        Args:
            feature_names (list): List of feature names
            
        Returns:
            pd.DataFrame: Feature importance ranking
        """
        if self.feature_importance is None:
            logger.warning("Feature importance not available")
            return None
        
        importance_df = pd.DataFrame({
            'feature': feature_names,
            'importance': self.feature_importance
        })
        importance_df = importance_df.sort_values('importance', ascending=False)
        
        logger.info("\nTop 10 Important Features:")
        logger.info(importance_df.head(10).to_string(index=False))
        
        return importance_df


# ====================================
# Training Pipeline
# ====================================

def train_ids_model(data_path, model_type='random_forest', test_size=0.2):
    """
    Complete training pipeline
    
    Args:
        data_path (str): Path to preprocessed dataset
        model_type (str): Type of model to train
        test_size (float): Proportion of test set
    """
    from feature_extraction.feature_engineering import FeatureExtractor
    
    # Load and prepare data
    logger.info("Loading dataset...")
    extractor = FeatureExtractor()
    
    # Load CICIDS dataset (assuming preprocessed)
    df = extractor.load_cicids_dataset(data_path)
    
    # Prepare training data
    X, y, feature_names, label_names = extractor.prepare_training_data(df)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=42, stratify=y
    )
    
    logger.info(f"Training set: {X_train.shape}, Test set: {X_test.shape}")
    
    # Initialize trainer
    trainer = IDSModelTrainer(model_type=model_type)
    
    # Train model
    if model_type == 'random_forest':
        trainer.train_random_forest(X_train, y_train, n_estimators=100, max_depth=20)
    elif model_type == 'xgboost':
        X_train_split, X_val, y_train_split, y_val = train_test_split(
            X_train, y_train, test_size=0.1, random_state=42
        )
        trainer.train_xgboost(X_train_split, y_train_split, X_val, y_val)
    elif model_type == 'lstm':
        X_train_split, X_val, y_train_split, y_val = train_test_split(
            X_train, y_train, test_size=0.1, random_state=42
        )
        trainer.train_lstm(X_train_split, y_train_split, X_val, y_val)
    
    # Evaluate
    metrics = trainer.evaluate_model(X_test, y_test)
    
    # Get feature importance
    if model_type != 'lstm':
        trainer.get_feature_importance(feature_names)
    
    # Save model
    trainer.save_model(f'models/{model_type}_model.pkl')
    extractor.save('models/feature_extractor.pkl')
    
    # Save metrics
    with open(f'models/{model_type}_metrics.json', 'w') as f:
        # Convert numpy types to Python types for JSON serialization
        metrics_serializable = {
            k: v.tolist() if isinstance(v, np.ndarray) else v 
            for k, v in metrics.items() if k != 'classification_report'
        }
        json.dump(metrics_serializable, f, indent=2)
    
    logger.info("Training pipeline completed!")
    return trainer, metrics


# ====================================
# Example Usage
# ====================================

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Train IDS ML Model")
    parser.add_argument('--data', type=str, required=True, help='Path to CICIDS dataset CSV')
    parser.add_argument('--model', type=str, default='random_forest', 
                       choices=['random_forest', 'xgboost', 'lstm'],
                       help='Model type to train')
    parser.add_argument('--tune', action='store_true', help='Perform hyperparameter tuning')
    
    args = parser.parse_args()
    
    # Train model
    trainer, metrics = train_ids_model(args.data, model_type=args.model)
    
    print("\n=== Training Complete ===")
    print(f"Model: {args.model}")
    print(f"Accuracy: {metrics['accuracy']:.4f}")
    print(f"F1 Score: {metrics['f1_score']:.4f}")
