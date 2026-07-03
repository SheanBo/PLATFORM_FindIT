const jwt = require('jsonwebtoken');
const { getAsync } = require('../database/init');

async function authenticate(req, res, next) {
  const auth = req.headers['authorization'];
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Access token required' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await getAsync('SELECT * FROM ONLINE_USER WHERE User_ID=? AND Is_Active=\'Y\'', [decoded.userId]);
    if (!user) return res.status(401).json({ error: 'User not found or inactive' });
    req.user = user;
    next();
  } catch (err) {
    // 401 (not 403) so the frontend interceptor clears the stale session and
    // redirects to login; 403 is reserved for authorize() role failures.
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.Role_Type))
      return res.status(403).json({ error: `Access denied. Required: ${roles.join(' or ')}` });
    next();
  };
}

module.exports = { authenticate, authorize };
