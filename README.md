# 🛡️ AI-Powered Intrusion Detection System (IDS)

Real-time network security monitoring with machine learning-based threat detection and automated response capabilities.

## ✨ Features

- 🔍 **Real-time Traffic Monitoring** with WebSocket updates
- 🤖 **ML-based Threat Detection** - Random Forest classifier with 94% accuracy
- 🎯 **5 Attack Types Detection**: DDoS, Port Scan, Brute Force, Bot, and Web Attacks
- 🚨 **Automated Alert Generation** with severity-based classification
- 🔒 **Auto-blocking High-Risk IPs** based on confidence scores
- 📊 **Interactive Admin Dashboard** with live statistics
- 🔐 **Role-based Access Control** (Admin, Analyst, Viewer)
- 📈 **Traffic Analytics** with filtering and visualization

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite + TailwindCSS + Zustand
- **Backend**: Node.js + Express + PostgreSQL + Sequelize + WebSocket
- **ML Engine**: Python 3.10+ + Flask + Scikit-learn + Random Forest
- **Database**: PostgreSQL 16+
- **Authentication**: JWT-based auth with bcrypt

## 📋 Prerequisites

- **Node.js** v18+ and npm
- **Python** v3.10+
- **PostgreSQL** 16+ (with pgAdmin4 recommended)
- **Git**

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/Lucky2907/AI-Powered-Intrusion-Detection-System-IDS-.-.git
cd AI-Powered-Intrusion-Detection-System-IDS-.-
```

### 2. Setup PostgreSQL Database

```bash
cd backend
npm install
```

Update `.env` file with your PostgreSQL credentials:
```env
DB_PASSWORD=your_postgres_password
```

Create database and tables:
```bash
node setup-postgres.js
```

### 3. Start Backend Server

```bash
node server.js
```
Runs on **http://localhost:3000**

### 4. Start ML Engine

```bash
cd ml-engine/prediction_api
pip install -r requirements.txt
python app.py
```
Runs on **http://localhost:5000**

### 5. Start Frontend

```bash
cd frontend
npm install
npm run dev
```
Runs on **http://localhost:5173**

### 6. Simulate Attacks (Optional)

```powershell
.\continuous-attacks.ps1
```

## 📝 Login Credentials

| Role    | Username | Password    |
|---------|----------|-------------|
| Admin   | admin    | admin123    |
| Analyst | analyst  | analyst123  |
| Viewer  | viewer   | viewer123   |

## 🛠️ Detailed Setup

For detailed PostgreSQL setup and troubleshooting, see [POSTGRES_SETUP.md](POSTGRES_SETUP.md)

## 📁 Project Structure

```
AI-IDS-Project/
├── backend/                 # Node.js Express API
│   ├── config/             # Database configuration
│   ├── src/
│   │   ├── middleware/     # Auth & validation middleware
│   │   ├── models/         # Sequelize models
│   │   ├── routes/         # API endpoints
│   │   └── utils/          # Logger utilities
│   ├── .env                # Environment variables
│   ├── server.js           # Main server file
│   └── setup-postgres.js   # Database setup script
├── frontend/               # React Dashboard
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── store/          # State management
│   └── vite.config.js      # Vite configuration
├── ml-engine/              # Python ML Engine
│   ├── models/             # Trained models & metadata
│   ├── prediction_api/     # Flask API
│   ├── training/           # Model training scripts
│   └── feature_extraction/ # Feature engineering
└── continuous-attacks.ps1  # Attack simulation script
```

## 🗄️ Database Schema

### Tables

1. **users** - User accounts with role-based access
2. **traffic_logs** - Network traffic data with ML predictions
3. **alerts** - Security alerts generated from attacks
4. **blocked_ips** - Auto-blocked IP addresses
5. **system_metrics** - System performance metrics
6. **audit_logs** - User activity logs

## 🔧 Configuration

### Backend (.env)

```env
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# PostgreSQL Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_ids_database
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=24h

# ML Engine
ML_API_URL=http://localhost:5000
```

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Traffic
- `GET /api/traffic` - Get traffic logs (paginated)
- `POST /api/traffic/log` - Log new traffic
- `GET /api/traffic/:id` - Get traffic details

### Alerts
- `GET /api/alerts` - Get alerts
- `PUT /api/alerts/:id` - Update alert status
- `DELETE /api/alerts/:id` - Delete alert

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/recent-alerts` - Recent alerts
- `GET /api/dashboard/traffic-timeline` - Traffic over time

## 🤖 ML Model

- **Algorithm**: Random Forest Classifier
- **Accuracy**: 94%
- **Features**: 30+ network traffic features
- **Classes**: DDoS, Port Scan, Brute Force, Bot, Web Attack, BENIGN

## 🔒 Security Features

- Password hashing with bcrypt
- JWT-based authentication
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS protection
- Helmet security headers
- Auto-blocking suspicious IPs

## 📊 Viewing Database in pgAdmin4

1. Open pgAdmin4
2. Navigate to: **Databases → ai_ids_database → Schemas → public → Tables**
3. Right-click any table → **View/Edit Data → All Rows**

## 🐛 Troubleshooting

### Backend won't start
- Check PostgreSQL is running
- Verify `.env` credentials
- Run `node setup-postgres.js` to initialize database

### ML predictions not working
- Ensure ML engine is running on port 5000
- Check model files exist in `ml-engine/models/`

### Frontend can't connect
- Verify backend is running on port 3000
- Check CORS settings in backend

## 📚 Documentation

- [PostgreSQL Setup Guide](POSTGRES_SETUP.md)
- [Quick Start Guide](QUICKSTART.md)
- [GitHub Push Guide](GITHUB_PUSH_GUIDE.md)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/YourFeature`)
3. Commit changes (`git commit -m 'Add YourFeature'`)
4. Push to branch (`git push origin feature/YourFeature`)
5. Open Pull Request

## 📄 License

MIT License - See LICENSE file for details

## 👨‍💻 Author

**Abhishek Dhaundiyal**
- GitHub: [@Lucky2907](https://github.com/Lucky2907)
- Email: dhaundiyalabhishek634@gmail.com

## 🙏 Acknowledgments

- Scikit-learn for ML algorithms
- React team for amazing framework
- PostgreSQL community

---

**Built with ❤️ for a safer internet**
