/**
 * Performance Monitoring Utilities
 * Track response times, query performance, and bottlenecks
 */

const metrics = {
  requests: [],
  queries: [],
  errors: []
};

/**
 * Middleware to track request performance
 */
function performanceTracker() {
  return (req, res, next) => {
    const start = Date.now();
    const originalJson = res.json.bind(res);

    res.json = (data) => {
      const duration = Date.now() - start;
      metrics.requests.push({
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
  metrics.queries.push({
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
      total: metrics.requests.length,
      avgResponseTime: `${avgResponseTime}ms`,
      recent: requests.map(r => ({
        ...r,
        duration: `${r.duration}ms`
      }))
    },
    queries: {
      total: metrics.queries.length,
      avgQueryTime: `${avgQueryTime}ms`,
      recent: queries.map(q => ({
        ...q,
        duration: `${q.duration}ms`
      }))
    },
    errors: {
      total: metrics.errors.length,
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
}

module.exports = {
  performanceTracker,
  trackQuery,
  getMetrics,
  resetMetrics
};
