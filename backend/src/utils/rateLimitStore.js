const { getAsync, runAsync } = require('../database/init');

// express-rate-limit v7 store backed by the RATE_LIMIT table, so limits hold
// across serverless instances (in-memory counters reset per cold start).
// `prefix` namespaces keys per limiter instance -- without it, two limiters
// sharing the same requester key (e.g. IP) would share one counter, since
// a single request can pass through multiple limiters (global + auth).
class PostgresStore {
  constructor(prefix = 'default') {
    this.prefix = prefix;
  }

  init(options) { this.windowMs = options.windowMs; }

  _key(key) { return `${this.prefix}:${key}`; }

  async increment(key) {
    const expires = new Date(Date.now() + this.windowMs);
    const row = await getAsync(
      `INSERT INTO RATE_LIMIT (Key, Count, Expires_At) VALUES (?, 1, ?)
       ON CONFLICT (Key) DO UPDATE SET
         Count = CASE WHEN RATE_LIMIT.Expires_At < CURRENT_TIMESTAMP THEN 1 ELSE RATE_LIMIT.Count + 1 END,
         Expires_At = CASE WHEN RATE_LIMIT.Expires_At < CURRENT_TIMESTAMP THEN ? ELSE RATE_LIMIT.Expires_At END
       RETURNING Count, Expires_At`,
      [this._key(key), expires, expires]
    );
    return { totalHits: row.Count, resetTime: new Date(row.Expires_At) };
  }

  async decrement(key) {
    await runAsync('UPDATE RATE_LIMIT SET Count = GREATEST(Count - 1, 0) WHERE Key = ?', [this._key(key)]);
  }

  async resetKey(key) {
    await runAsync('DELETE FROM RATE_LIMIT WHERE Key = ?', [this._key(key)]);
  }
}

module.exports = PostgresStore;
