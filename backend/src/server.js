require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initializeDatabase } = require('./database/init');
const { performanceTracker } = require('./utils/performance');
const PostgresStore = require('./utils/rateLimitStore');

// JWT secret guard. Production fails fast if the secret is missing or left
// at the insecure default. Development generates a throwaway secret so a
// fresh clone runs without setup (logins reset on every restart). Tests set
// their own secret.
const INSECURE_DEFAULT = 'findit_super_secret_key_change_in_production';
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === INSECURE_DEFAULT) {
    console.error('FATAL: JWT_SECRET is unset or using the insecure default. Set a strong JWT_SECRET in the environment.');
    process.exit(1);
  }
} else if (process.env.NODE_ENV !== 'test') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === INSECURE_DEFAULT) {
    process.env.JWT_SECRET = require('crypto').randomBytes(32).toString('hex');
    console.warn(
      'WARNING: JWT_SECRET is not configured - using a temporary secret for this dev session.\n' +
      '         Logins will not survive a restart. Copy backend/.env.example to backend/.env\n' +
      '         and set a strong JWT_SECRET to make sessions persistent.'
    );
  }
}

// In production the schema is applied once via `npm run db:init`; only auto-init
// for local dev/test convenience.
if (process.env.NODE_ENV !== 'production') {
  initializeDatabase().catch((e) => console.error('DB init failed:', e.message));
}

const app = express();

// Security
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', process.env.SUPABASE_URL].filter(Boolean),
    }
  }
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  store: new PostgresStore()
});

// Strict rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 requests per 15 minutes
  message: { error: 'Too many login attempts, please try again later' },
  skipSuccessfulRequests: true,
  store: new PostgresStore()
});

app.use(globalLimiter);

// Performance Optimization
app.use(performanceTracker()); // Track request performance
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// In-memory cache for dashboard stats (1 minute TTL)
const cache = new Map();
const cacheMiddleware = (key, ttl = 60000) => (req, res, next) => {
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) {
    return res.json(cached.data);
  }
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    cache.set(key, { data, expires: Date.now() + ttl });
    return originalJson(data);
  };
  next();
};

app.cacheMiddleware = cacheMiddleware;

// Routes
app.use('/api/auth', authLimiter, require('./modules/auth/findit-auth.routes'));
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

module.exports = app;

// Only start server if this file is run directly
if (require.main === module) {
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
}
