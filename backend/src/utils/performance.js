/**
 * Performance Monitoring Utilities
 * Track response times, query performance, and bottlenecks
 */

// Bounded ring-buffer size. Without a cap these arrays grow for the lifetime
// of the process (one entry per request/query), which is a slow memory leak.
const MAX_ENTRIES = 500;

const metrics = {
  requests: [],
  queries: [],
  errors: [],
  // Lifetime counters (the arrays above are bounded, so their length can no
  // longer be used as an all-time total).
  totals: { requests: 0, queries: 0, errors: 0 }
};

// Push onto an array while keeping only the most recent MAX_ENTRIES items.
function pushCapped(arr, entry) {
  arr.push(entry);
  if (arr.length > MAX_ENTRIES) arr.shift();
}

/**
 * Middleware to track request performance
 */
function performanceTracker() {
  return (req, res, next) => {
    const start = Date.now();
    const originalJson = res.json.bind(res);

    res.json = (data) => {
      const duration = Date.now() - start;
      metrics.totals.requests++;
      pushCapped(metrics.requests, {
        method: req.method,
        path: req.path,
        duration,
        status: res.statusCode,
        timestamp: new Date()
      });

      // Log slow requests (> 500ms)
      if (duration > 500) {
        console.warn(`⚠️  Slow request: ${req.method} ${req.path} took ${duration}ms`);
      }

      // Add performance header
      res.set('X-Response-Time', `${duration}ms`);
      return originalJson(data);
    };

    next();
  };
}

/**
 * Track database query performance
 */
function trackQuery(sql, duration) {
  metrics.totals.queries++;
  pushCapped(metrics.queries, {
    sql: sql.substring(0, 100),
    duration,
    timestamp: new Date()
  });

  if (duration > 100) {
    console.warn(`⚠️  Slow query (${duration}ms): ${sql.substring(0, 80)}...`);
  }
}

/**
 * Get performance metrics summary
 */
function getMetrics() {
  const requests = metrics.requests.slice(-100); // Last 100 requests
  const avgResponseTime = requests.length > 0
    ? Math.round(requests.reduce((sum, r) => sum + r.duration, 0) / requests.length)
    : 0;

  const queries = metrics.queries.slice(-100); // Last 100 queries
  const avgQueryTime = queries.length > 0
    ? Math.round(queries.reduce((sum, q) => sum + q.duration, 0) / queries.length)
    : 0;

  return {
    requests: {
      total: metrics.totals.requests,
      avgResponseTime: `${avgResponseTime}ms`,
      recent: requests.map(r => ({
        ...r,
        duration: `${r.duration}ms`
      }))
    },
    queries: {
      total: metrics.totals.queries,
      avgQueryTime: `${avgQueryTime}ms`,
      recent: queries.map(q => ({
        ...q,
        duration: `${q.duration}ms`
      }))
    },
    errors: {
      total: metrics.totals.errors,
      recent: metrics.errors.slice(-10)
    }
  };
}

/**
 * Reset metrics
 */
function resetMetrics() {
  metrics.requests = [];
  metrics.queries = [];
  metrics.errors = [];
  metrics.totals = { requests: 0, queries: 0, errors: 0 };
}

module.exports = {
  performanceTracker,
  trackQuery,
  getMetrics,
  resetMetrics
};
