require('dotenv').config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

// Initialize database
require('./config/db');

// Initialize Telegram Bot
const { initBot } = require('./bot/bot');

// Express App
const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors({
  origin: true,
  credentials: true
}));

// Body Parsers
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Request Logger
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Static files (Uploads)
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Health check endpoint (always before SPA fallback)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CPM Market API',
    time: new Date().toISOString()
  });
});

// Rate Limiter for API
const { apiLimiter } = require('./middleware/rateLimiter');
app.use('/api', apiLimiter);

// API Routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Serve frontend build if available (production mode) - MUST BE AFTER API & HEALTH ROUTES
const frontendDist = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads') && !req.path.startsWith('/health')) {
      return res.sendFile(path.join(frontendDist, 'index.html'));
    }
    next();
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Serverda ichki xatolik yuz berdi'
  });
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 CPM Market Backend ishga tushdi!`);
  console.log(`🌐 Server manzili: http://localhost:${PORT}`);
  console.log(`📂 API yoʻli: http://localhost:${PORT}/api`);
  console.log(`===============================================`);

  // Start bot
  initBot();
});

module.exports = { app, server };
