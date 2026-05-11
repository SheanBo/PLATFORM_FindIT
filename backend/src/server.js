require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { initializeDatabase } = require('./database/init');

// Initialize database
initializeDatabase();

const app = express();

// Security
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: { error: 'Too many requests' } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth',                require('./modules/auth/findit-auth.routes'));
app.use('/api/findit-lost-reports', require('./modules/lost-reports/findit-lost-reports.routes'));
app.use('/api/findit-found-items',  require('./modules/found-items/findit-found-items.routes'));
app.use('/api/findit-matching',     require('./modules/matching/findit-matching.routes'));
app.use('/api/findit-claims',       require('./modules/claims/findit-claims.routes'));
app.use('/api/findit-storage',      require('./modules/storage/findit-storage.routes'));
app.use('/api/findit-dashboard',    require('./modules/dashboard/findit-dashboard.routes'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// 404
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 FindIT Backend running on http://localhost:${PORT}`);
  console.log(`📁 DB: ${process.env.DB_PATH || './src/database/findit.db'}`);
  console.log(`\nEndpoints:`);
  console.log(`  POST   /api/auth/login`);
  console.log(`  POST   /api/auth/register`);
  console.log(`  GET    /api/findit-lost-reports`);
  console.log(`  GET    /api/findit-found-items`);
  console.log(`  GET    /api/findit-matching`);
  console.log(`  GET    /api/findit-claims`);
  console.log(`  GET    /api/findit-storage`);
  console.log(`  GET    /api/findit-dashboard/stats`);
});
