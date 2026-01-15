# 🚀 Quick Start Guide - AI-Powered IDS

## Prerequisites

- **Node.js** (v18+)
- **Python** (v3.10+)
- SQLite (included with Python)

---

## 🔧 Quick Start

### 1. Start ML Engine
```powershell
cd ml-engine/prediction_api
python app.py
```

### 2. Start Backend
```powershell
cd backend
node server.js
```

### 3. Access the System
- Backend API: **http://localhost:3000**
- ML Engine API: **http://localhost:5000**
- Frontend: Open `frontend/index.html` in browser

---

## 🔧 Development Setup

### Backend (Node.js)
```powershell
cd backend
npm install
node server.js
```

**Database:** Uses SQLite - automatically created at `backend/database.sqlite`

### Frontend (React + Vite)
```powershell
cd frontend
npm install
npm run dev
```

### ML Engine (Python)
```powershell
cd ml-engine
pip install -r requirements.txt
python prediction_api/app.py
```

---

## 📊 Training the ML Model

### 1. Download CICIDS2017 Dataset
Download from: https://www.unb.ca/cic/datasets/ids-2017.html

### 2. Train Model
```powershell
cd ml-engine
python training/train_model.py --data path/to/cicids2017.csv --model random_forest
```

### 3. Trained models will be saved in `ml-engine/models/`

---

## 🧪 Testing the System

### Test ML Prediction
```powershell
curl -X POST http://localhost:5000/api/predict `
  -H "Content-Type: application/json" `
  -d '{
    "flow_duration": 1.5,
    "total_fwd_packets": 10,
    "total_bwd_packets": 8,
    "flow_bytes_per_sec": 5000,
    "protocol": "TCP",
    "dst_port": 80
  }'
```

### Test Backend API
```powershell
# Get traffic logs
curl http://localhost:3000/api/traffic -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get alerts
curl http://localhost:3000/api/alerts -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🚀 Production Deployment (AWS)

### Using Kubernetes (EKS)

1. **Create EKS Cluster**
```powershell
eksctl create cluster `
  --name ai-ids-cluster `
  --region us-east-1 `
  --nodes 3 `
  --node-type t3.medium
```

2. **Deploy Application**
```powershell
cd deployment/kubernetes
kubectl apply -f config.yaml
kubectl apply -f backend-deployment.yaml
kubectl apply -f ml-deployment.yaml
kubectl apply -f frontend-deployment.yaml
```

3. **Get Service URL**
```powershell
kubectl get services
```

### Using Docker Compose on EC2

1. **Launch EC2 Instance** (t3.large or larger)
2. **Install Docker**
3. **Deploy**
```bash
git clone your-repo
cd deployment
docker-compose up -d
```

---

## 📈 Monitoring & Logs

### View Logs
```powershell
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f ml-engine
```

### System Metrics
Access: **http://localhost/dashboard** → System Health

---

## 🔒 Security Hardening

### 1. Change Default Credentials
Edit `deployment/docker-compose.yml`:
```yaml
POSTGRES_PASSWORD: your_secure_password_here
JWT_SECRET: generate_random_secret_here
```

### 2. Enable HTTPS
Add SSL certificates in `deployment/nginx/certs/`

### 3. Firewall Rules
```powershell
# Allow only necessary ports
# 80 (HTTP), 443 (HTTPS), 3000 (Backend), 5000 (ML API)
```

---

## 🐛 Troubleshooting

### Database Connection Failed
```powershell
# Check if PostgreSQL is running
docker-compose ps postgres

# Restart database
docker-compose restart postgres
```

### ML Engine Not Responding
```powershell
# Check logs
docker-compose logs ml-engine

# Ensure models are trained
ls ml-engine/models/
```

### Frontend Cannot Connect to Backend
- Check `frontend/src/services/api.js` - ensure correct API URL
- Verify backend is running: `curl http://localhost:3000/health`

---

## 📚 Next Steps

1. **Customize Detection Rules** → Edit `backend/src/controllers/traffic.controller.js`
2. **Train Custom Model** → Use your own dataset in `ml-engine/training/`
3. **Add More Features** → Extend frontend components in `frontend/src/pages/`
4. **Scale Infrastructure** → Adjust Kubernetes replicas in deployment YAMLs

---

## 📞 Support

- **Documentation**: See `/docs` folder
- **Issues**: GitHub Issues
- **Email**: your.email@example.com

---

**🎉 You're all set! Start monitoring your network for threats.**
