const express = require('express');
const router = express.Router();
const { getDb, getAsync, runAsync, allAsync } = require('../../database/init');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { getMetrics } = require('../../utils/performance');

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
      SELECT strftime('%Y-%m', Date_Found) AS Month, COUNT(*) AS Count
      FROM FOUND_ITEM GROUP BY Month ORDER BY Month DESC LIMIT 12
    `, []);
    const monthlyLost = await allAsync(`
      SELECT strftime('%Y-%m', Date_Filed) AS Month, COUNT(*) AS Count
      FROM LOST_REPORT GROUP BY Month ORDER BY Month DESC LIMIT 12
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
    const categories = await allAsync('SELECT * FROM ITEM_CATEGORY ORDER BY Category_Name', []);
    res.json({ data: categories });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/findit-dashboard/users (Admin)
router.get('/users', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const { role, search, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
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
    `, [...params, parseInt(limit), offset]);

    res.json({ data: users, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
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
router.put('/users/:id/role', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const { role } = req.body;
    if (!['Student','Staff','Admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
    await runAsync('UPDATE ONLINE_USER SET Role_Type=? WHERE User_ID=?', [role, req.params.id]);
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
