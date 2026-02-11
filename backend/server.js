require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const connectDB = require('./config/database');
const { sessionMiddleware, errorHandler } = require('./middleware');
const { resumeRoutes, analysisRoutes, jobRoutes, sessionRoutes } = require('./routes');
const { emailService } = require('./services');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id']
};
app.use(cors(corsOptions));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: 'AI rate limit exceeded. Please wait a moment.'
  }
});
app.use('/api/resume/generate', aiLimiter);
app.use('/api/resume/:resumeId/edit', aiLimiter);
app.use('/api/analysis/analyze', aiLimiter);
app.use('/api/analysis/fix', aiLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'NOVA Resume API is running',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/resume', sessionMiddleware, resumeRoutes);
app.use('/api/analysis', sessionMiddleware, analysisRoutes);
app.use('/api/jobs', sessionMiddleware, jobRoutes);
app.use('/api/session', sessionMiddleware, sessionRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    
    emailService.initialize();
    
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 NOVA Resume API Server                               ║
║                                                           ║
║   Running on: http://localhost:${PORT}                     ║
║   Environment: ${process.env.NODE_ENV || 'development'}                          ║
║                                                           ║
║   Endpoints:                                              ║
║   - GET  /api/health          - Health check              ║
║   - POST /api/resume/generate - Generate resume           ║
║   - POST /api/resume/:id/edit - Edit resume               ║
║   - POST /api/analysis/analyze - Analyze resume           ║
║   - POST /api/analysis/fix    - Fix resume                ║
║   - GET  /api/jobs/search     - Search jobs               ║
║   - POST /api/jobs/apply      - Generate apply email      ║
║   - GET  /api/session/profile - Get profile               ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

startServer();

module.exports = app;
