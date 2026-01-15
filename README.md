# AI-Powered Intrusion Detection System

Real-time network security monitoring with machine learning threat detection.

## 🚀 Quick Start

### 1. ML Engine
```bash
cd ml-engine/prediction_api
python app.py
```
Runs on http://localhost:5000

### 2. Backend
```bash
cd backend
npm install
node seed-users.js  # First time only
node server.js
```
Runs on http://localhost:3000

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs on http://localhost:5173

### 4. Simulate Attacks
```powershell
.\continuous-attacks.ps1
```

## 📝 Login Credentials

- **Admin**: admin / admin123
- **Analyst**: analyst / analyst123
- **Viewer**: viewer / viewer123

## 🛠️ Tech Stack

- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Node.js + Express + SQLite + WebSocket
- **ML Engine**: Python + Flask + Random Forest (94% accuracy)

## 📁 Project Structure

```
AI-IDS-Project/
├── ml-engine/          # Python ML & Flask API
│   ├── prediction_api/ # Flask prediction endpoint
│   ├── models/         # Trained Random Forest model
│   └── feature_extraction/ # Feature engineering
├── backend/            # Node.js Express API
│   ├── server.js       # Main server
│   ├── database.sqlite # SQLite database
│   └── src/            # Routes, models, middleware
└── frontend/           # React dashboard
    └── src/            # Components and pages
```

## 🎯 Features

- Real-time traffic monitoring with WebSocket
- ML-based threat detection (5 attack types)
- Interactive admin dashboard
- Automated alert generation
- Auto-blocking high-severity attacks
- Traffic logs with filtering
- User authentication (JWT)

## 🗄️ Database

SQLite database at `backend/database.sqlite`. View with:
- [DB Browser for SQLite](https://sqlitebrowser.org/)
- VS Code Extension: "SQLite" by alexcvzz

MIT License - See LICENSE file for details

---

**Built with ❤️ for a safer internet**
