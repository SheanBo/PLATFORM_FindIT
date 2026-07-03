const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { getAsync, runAsync, allAsync } = require('../../database/init');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { getMetrics } = require('../../utils/performance');
const { parsePagination } = require('../../utils/pagination');
const { auditLog } = require('../../utils/audit');

// GET /api/findit-dashboard/stats
router.get('/stats', authenticate, authorize('Staff','Admin'), async (req, res) => {
  try {
    const stats = await getAsync('SELECT * FROM VW_DASHBOARD_STATS', []);
    const expiredCountResult = await getAsync('SELECT COUNT(*) AS cnt FROM VW_EXPIRED_ITEMS', []);
    const expiredCount = expiredCountResult.cnt;
    const storageUsage = await allAsync(`
      SELECT Storage_Type, SUM(Current_Load) AS Used, SUM(Capacity) AS Total
      FROM STORAGE_SECTION GROUP BY Storage_Type
    `, []);
    res.json({ ...stats, Expired_Items: expiredCount, storage_usage: storageUsage });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/findit-dashboard/recent-activity
router.get('/recent-activity', authenticate, authorize('Staff','Admin'), async (req, res) => {
  try {
    const recentItems = await allAsync(`
      SELECT fi.Item_ID, fi.Item_Name, fi.Item_Status, fi.Date_Created, ic.Category_Name, 'found' AS type
      FROM FOUND_ITEM fi JOIN ITEM_CATEGORY ic ON fi.Category_ID=ic.Category_ID
      ORDER BY fi.Date_Created DESC LIMIT 5
    `, []);
    const recentReports = await allAsync(`
      SELECT lr.Report_ID, lr.Item_Name, lr.Report_Status, lr.Date_Filed, ic.Category_Name, 'lost' AS type
      FROM LOST_REPORT lr JOIN ITEM_CATEGORY ic ON lr.Category_ID=ic.Category_ID
      ORDER BY lr.Date_Filed DESC LIMIT 5
    `, []);
    const recentClaims = await allAsync(`
      SELECT c.Claim_ID, c.Claim_Status, c.Claim_Date, fi.Item_Name, 'claim' AS type
      FROM CLAIM c JOIN FOUND_ITEM fi ON c.Item_ID=fi.Item_ID
      ORDER BY c.Claim_Date DESC LIMIT 5
    `, []);
    res.json({ recent_items: recentItems, recent_reports: recentReports, recent_claims: recentClaims });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/findit-dashboard/analytics
router.get('/analytics', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const categoryStats = await allAsync(`
      SELECT ic.Category_Name,
             COUNT(fi.Item_ID) AS Found_Count,
             COUNT(lr.Report_ID) AS Lost_Count
      FROM ITEM_CATEGORY ic
      LEFT JOIN FOUND_ITEM fi ON fi.Category_ID=ic.Category_ID
      LEFT JOIN LOST_REPORT lr ON lr.Category_ID=ic.Category_ID
      GROUP BY ic.Category_ID ORDER BY Found_Count DESC
    `, []);
    const monthlyFound = await allAsync(`
      SELECT to_char(Date_Found, 'YYYY-MM') AS Month, COUNT(*) AS Count
      FROM FOUND_ITEM GROUP BY to_char(Date_Found, 'YYYY-MM') ORDER BY Month DESC LIMIT 12
    `, []);
    const monthlyLost = await allAsync(`
      SELECT to_char(Date_Filed, 'YYYY-MM') AS Month, COUNT(*) AS Count
      FROM LOST_REPORT GROUP BY to_char(Date_Filed, 'YYYY-MM') ORDER BY Month DESC LIMIT 12
    `, []);
    const auditLogs = await allAsync(`
      SELECT al.*, ou.Username
      FROM AUDIT_LOG al LEFT JOIN ONLINE_USER ou ON al.User_ID=ou.User_ID
      ORDER BY al.Timestamp DESC LIMIT 50
    `, []);
    res.json({ category_stats: categoryStats, monthly_found: monthlyFound, monthly_lost: monthlyLost, audit_logs: auditLogs });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/findit-dashboard/my-stats (student)
router.get('/my-stats', authenticate, async (req, res) => {
  try {
    const myReports = await allAsync('SELECT COUNT(*) AS cnt, Report_Status FROM LOST_REPORT WHERE User_ID=? GROUP BY Report_Status', [req.user.User_ID]);
    const myClaims = await allAsync('SELECT COUNT(*) AS cnt, Claim_Status FROM CLAIM WHERE User_ID=? GROUP BY Claim_Status', [req.user.User_ID]);
    const myMatches = await getAsync(`
      SELECT COUNT(*) AS cnt FROM ITEM_MATCH im
      JOIN LOST_REPORT lr ON im.Report_ID=lr.Report_ID
      WHERE lr.User_ID=? AND im.Match_Score>=60
    `, [req.user.User_ID]);
    res.json({ my_reports: myReports, my_claims: myClaims, my_matches: myMatches });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/findit-dashboard/community-stats
// Campus-wide aggregates surfaced on the student overview: which categories
// go missing most, where they go missing, and how many have been reunited
// with their owners. All counts are non-personal, so any signed-in user may
// read them.
router.get('/community-stats', authenticate, async (req, res) => {
  try {
    const topCategories = await allAsync(`
      SELECT ic.Category_Name, COUNT(lr.Report_ID) AS cnt
      FROM ITEM_CATEGORY ic
      JOIN LOST_REPORT lr ON lr.Category_ID = ic.Category_ID
      WHERE lr.Report_Status != 'Cancelled'
      GROUP BY ic.Category_ID
      HAVING cnt > 0
      ORDER BY cnt DESC, ic.Category_Name
      LIMIT 5
    `, []);
    const topLocations = await allAsync(`
      SELECT l.Place_Name, COUNT(lr.Report_ID) AS cnt
      FROM LOCATION l
      JOIN LOST_REPORT lr ON lr.Location_ID = l.Location_ID
      WHERE lr.Report_Status != 'Cancelled'
      GROUP BY l.Location_ID
      HAVING cnt > 0
      ORDER BY cnt DESC, l.Place_Name
      LIMIT 5
    `, []);
    const recovered = await getAsync("SELECT COUNT(*) AS cnt FROM FOUND_ITEM WHERE Item_Status='Claimed'", []);
    res.json({ top_categories: topCategories, top_locations: topLocations, recovered_count: recovered.cnt });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/findit-dashboard/locations
router.get('/locations', authenticate, async (req, res) => {
  try {
    const locations = await allAsync('SELECT * FROM LOCATION ORDER BY Place_Name', []);
    res.json({ data: locations });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/findit-dashboard/categories
router.get('/categories', authenticate, async (req, res) => {
  try {
    const categories = await allAsync("SELECT * FROM ITEM_CATEGORY ORDER BY (Category_Name='Other'), Category_Name", []);
    res.json({ data: categories });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/findit-dashboard/users (Admin)
router.get('/users', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const { role, search } = req.query;
    const { page, limit, offset } = parsePagination(req.query);
    let where = 'WHERE 1=1'; const params = [];
    if (role) { where += ' AND ou.Role_Type=?'; params.push(role); }
    if (search) { where += ' AND (ou.Username LIKE ? OR ou.Email LIKE ? OR p.First_Name LIKE ? OR p.Last_Name LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`); }

    const countResult = await getAsync(`SELECT COUNT(*) AS cnt FROM ONLINE_USER ou JOIN PERSON p ON ou.Person_ID=p.Person_ID ${where}`, params);
    const total = countResult.cnt;
    const users = await allAsync(`
      SELECT ou.User_ID, ou.Username, ou.Email, ou.Role_Type, ou.Student_ID, ou.Date_Registered, ou.Is_Active,
             p.First_Name, p.Last_Name, p.Department
      FROM ONLINE_USER ou JOIN PERSON p ON ou.Person_ID=p.Person_ID
      ${where} ORDER BY ou.Date_Registered DESC LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    res.json({ data: users, pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/findit-dashboard/users  (Admin) — create a Staff account.
// Only Staff accounts are created here; students self-register, and the
// system allows exactly one admin, so neither role is creatable via this route.
router.post('/users', authenticate, authorize('Admin'), [
  body('first_name').trim().notEmpty(),
  body('last_name').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('username').trim().isLength({ min: 3 }),
  body('password').isLength({ min: 8 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { first_name, last_name, email, username, password, department } = req.body;
  try {
    const existing = await getAsync('SELECT User_ID FROM ONLINE_USER WHERE Username=? OR Email=?', [username, email]);
    if (existing) return res.status(409).json({ error: 'Username or email already exists' });

    const hash = bcrypt.hashSync(password, 10);
    const p = await runAsync('INSERT INTO PERSON (First_Name,Last_Name,Department) VALUES (?,?,?)', [first_name, last_name, department || null]);
    const r = await runAsync(
      "INSERT INTO ONLINE_USER (Person_ID,Username,Password_Hash,Email,Role_Type) VALUES (?,?,?,?,'Staff')",
      [p.lastID, username, hash, email]
    );

    auditLog({ userId: req.user.User_ID, action: 'CREATE_STAFF', entityType: 'ONLINE_USER', entityId: r.lastID, newValue: { username, role: 'Staff' }, ip: req.ip });
    res.status(201).json({ message: 'Staff account created', id: r.lastID });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/findit-dashboard/users/:id/toggle (Admin)
router.put('/users/:id/toggle', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const user = await getAsync('SELECT * FROM ONLINE_USER WHERE User_ID=?', [req.params.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const newStatus = user.Is_Active === 'Y' ? 'N' : 'Y';
    await runAsync('UPDATE ONLINE_USER SET Is_Active=? WHERE User_ID=?', [newStatus, req.params.id]);
    res.json({ message: `User ${newStatus === 'Y' ? 'activated' : 'deactivated'}` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/findit-dashboard/users/:id/role (Admin)
// Enforces exactly one admin: no second admin may be created, and the last
// remaining admin cannot be demoted.
router.put('/users/:id/role', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const { role } = req.body;
    if (!['Student', 'Staff', 'Admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

    const target = await getAsync('SELECT User_ID, Role_Type FROM ONLINE_USER WHERE User_ID=?', [req.params.id]);
    if (!target) return res.status(404).json({ error: 'User not found' });

    if (role === 'Admin') {
      const otherAdmin = await getAsync("SELECT User_ID FROM ONLINE_USER WHERE Role_Type='Admin' AND User_ID != ?", [req.params.id]);
      if (otherAdmin) return res.status(409).json({ error: 'Only one admin account is allowed' });
    }

    if (target.Role_Type === 'Admin' && role !== 'Admin') {
      const admins = await getAsync("SELECT COUNT(*) AS c FROM ONLINE_USER WHERE Role_Type='Admin'");
      if (admins.c <= 1) return res.status(409).json({ error: 'Cannot remove the only admin account' });
    }

    await runAsync('UPDATE ONLINE_USER SET Role_Type=? WHERE User_ID=?', [role, req.params.id]);
    auditLog({ userId: req.user.User_ID, action: 'UPDATE_ROLE', entityType: 'ONLINE_USER', entityId: req.params.id, newValue: { role }, ip: req.ip });
    res.json({ message: 'Role updated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/findit-dashboard/performance (Admin)
router.get('/performance', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const metrics = getMetrics();
    res.json(metrics);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
