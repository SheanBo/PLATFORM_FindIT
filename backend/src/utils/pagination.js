/**
 * Pagination helpers.
 *
 * Parses and clamps `page`/`limit` query params so callers can never send
 * NaN (which SQLite rejects) or an unbounded LIMIT that would let a single
 * request scan/return the entire table.
 */
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function parsePagination(query = {}) {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  if (!Number.isFinite(page) || page < 1) page = 1;
  if (!Number.isFinite(limit) || limit < 1) limit = DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

module.exports = { parsePagination, DEFAULT_LIMIT, MAX_LIMIT };
