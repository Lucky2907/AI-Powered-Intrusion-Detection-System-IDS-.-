require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
const logger = require('./src/utils/logger');
const db = require('./src/models');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173', methods: ['GET', 'POST'] }
});

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// WebSocket
io.on('connection', (socket) => {
  socket.on('subscribe_alerts', () => socket.join('alerts'));
  socket.on('subscribe_traffic', () => socket.join('traffic'));
});
app.set('io', io);

// Routes
app.get('/health', (req, res) => res.json({ status: 'healthy', timestamp: new Date().toISOString() }));
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/traffic', require('./src/routes/traffic.routes'));
app.use('/api/alerts', require('./src/routes/alert.routes'));
app.use('/api/users', require('./src/routes/user.routes'));
app.use('/api/dashboard', require('./src/routes/dashboard.routes'));
app.use('/api/system', require('./src/routes/system.routes'));

// Error handling
app.use((req, res) => res.status(404).json({ error: 'Not Found', message: `Cannot ${req.method} ${req.originalUrl}` }));
app.use((err, req, res, next) => {
  logger.error('Error:', { message: err.message, url: req.originalUrl });
  res.status(err.status || 500).json({ error: err.message });
});

// Start server
const PORT = process.env.PORT || 3000;
db.sequelize.authenticate()
  .then(() => db.sequelize.sync({ force: false }))
  .then(() => {
    server.listen(PORT, () => logger.info(`Server running on port ${PORT} | WebSocket enabled`));
  })
  .catch(err => {
    logger.error('Database connection failed:', err);
    process.exit(1);
  });

// Graceful shutdown
['SIGTERM', 'SIGINT'].forEach(signal => {
  process.on(signal, () => {
    logger.info(`${signal} received: closing server`);
    server.close(() => process.exit(0));
  });
});

module.exports = { app, io };

module.exports = { app, io };
