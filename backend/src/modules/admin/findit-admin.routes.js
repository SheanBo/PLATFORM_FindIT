/**
 * Admin Dashboard Routes
 * Analytics, reporting, user management
 */

const express = require('express');
const router = express.Router();
const { getDb, getAsync, runAsync, allAsync } = require('../../database/init');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

// ========== ANALYTICS ENDPOINTS ==========

// GET /api/admin/analytics/overview
router.get('/analytics/overview', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await getAsync(`
      SELECT
        (SELECT COUNT(*) FROM FOUND_ITEM) AS Total_Items,
        (SELECT COUNT(*) FROM LOST_REPORT) AS Total_Reports,
        (SELECT COUNT(*) FROM ITEM_MATCH) AS Total_Matches,
        (SELECT COUNT(*) FROM CLAIM) AS Total_Claims,
        (SELECT COUNT(*) FROM ONLINE_USER) AS Total_Users,
        (SELECT COUNT(*) FROM ITEM_MATCH WHERE Match_Status='Confirmed') AS Confirmed_Matches,
        (SELECT COUNT(*) FROM CLAIM WHERE Claim_Status='Approved') AS Resolved_Claims,
        ROUND((SELECT COUNT(*) FROM CLAIM WHERE Claim_Status='Approved') * 100.0 /
              NULLIF((SELECT COUNT(*) FROM CLAIM), 0), 1) AS Resolution_Rate
    `);

    res.json(stats);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/admin/analytics/daily-activity
router.get('/analytics/daily-activity', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const data = await allAsync(`
      SELECT
        DATE(Event_Date) AS Date,
        COUNT(*) AS Event_Count,
        COUNT(DISTINCT User_ID) AS Active_Users,
        COUNT(CASE WHEN Event_Type='item_registered' THEN 1 END) AS Items_Added,
        COUNT(CASE WHEN Event_Type='report_filed' THEN 1 END) AS Reports_Filed,
        COUNT(CASE WHEN Event_Type='match_found' THEN 1 END) AS Matches_Found,
        COUNT(CASE WHEN Event_Type='claim_filed' THEN 1 END) AS Claims_Filed
      FROM TIMELINE_EVENTS
      WHERE Event_Date >= datetime('now', '-' || ? || ' days')
      GROUP BY DATE(Event_Date)
      ORDER BY Date DESC
    `, [days]);

    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/admin/analytics/category-stats
router.get('/analytics/category-stats', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const stats = await allAsync(`
      SELECT
        ic.Category_Name,
        COUNT(DISTINCT fi.Item_ID) AS Found_Items,
        COUNT(DISTINCT lr.Report_ID) AS Lost_Reports,
        COUNT(CASE WHEN im.Match_Score >= 75 THEN 1 END) AS High_Quality_Matches,
        ROUND(AVG(im.Match_Score), 1) AS Avg_Match_Score
      FROM ITEM_CATEGORY ic
      LEFT JOIN FOUND_ITEM fi ON ic.Category_ID = fi.Category_ID
      LEFT JOIN LOST_REPORT lr ON ic.Category_ID = lr.Category_ID
      LEFT JOIN ITEM_MATCH im ON fi.Item_ID = im.Item_ID AND lr.Report_ID = im.Report_ID
      GROUP BY ic.Category_ID
      ORDER BY Found_Items + Lost_Reports DESC
    `);

    res.json(stats);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/admin/analytics/user-engagement
router.get('/analytics/user-engagement', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const engagement = await allAsync(`
      SELECT
        ou.User_ID,
        p.First_Name || ' ' || p.Last_Name AS User_Name,
        ou.Username,
        ou.Role_Type,
        COUNT(DISTINCT ur.Report_ID) AS Reports_Filed,
        COUNT(DISTINCT fi.Item_ID) AS Items_Registered,
        COUNT(DISTINCT im.Match_ID) AS Matches_Reviewed,
        COUNT(DISTINCT c.Claim_ID) AS Claims_Processed,
        MAX(te.Event_Date) AS Last_Activity
      FROM ONLINE_USER ou
      JOIN PERSON p ON ou.Person_ID = p.Person_ID
      LEFT JOIN LOST_REPORT ur ON ou.User_ID = ur.User_ID
      LEFT JOIN FOUND_ITEM fi ON ou.User_ID = fi.Contact_Staff_ID
      LEFT JOIN ITEM_MATCH im ON ou.User_ID IN (SELECT Verified_By_ID FROM CLAIM WHERE Verified_By_ID IS NOT NULL)
      LEFT JOIN CLAIM c ON ou.User_ID = c.Verified_By_ID
      LEFT JOIN TIMELINE_EVENTS te ON ou.User_ID = te.User_ID
      WHERE ou.Is_Active = 'Y'
      GROUP BY ou.User_ID
      ORDER BY Last_Activity DESC
    `);

    res.json(engagement);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ========== REPORTING ENDPOINTS ==========

// GET /api/admin/reports/recovery-rate
router.get('/reports/recovery-rate', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const report = await getAsync(`
      SELECT
        COUNT(*) AS Total_Reports,
        COUNT(CASE WHEN Report_Status='Closed' THEN 1 END) AS Closed_Reports,
        ROUND(COUNT(CASE WHEN Report_Status='Closed' THEN 1 END) * 100.0 /
              NULLIF(COUNT(*), 0), 1) AS Recovery_Rate_Percent,
        AVG(CAST((julianday('now') - julianday(Date_Filed)) AS INTEGER)) AS Avg_Days_To_Close
      FROM LOST_REPORT
    `);

    res.json(report);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/admin/reports/match-quality
router.get('/reports/match-quality', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const report = await allAsync(`
      SELECT
        CASE
          WHEN Match_Score >= 85 THEN 'VERY_HIGH'
          WHEN Match_Score >= 70 THEN 'HIGH'
          WHEN Match_Score >= 55 THEN 'MODERATE'
          WHEN Match_Score >= 40 THEN 'LOW'
          ELSE 'VERY_LOW'
        END AS Confidence_Level,
        COUNT(*) AS Match_Count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM ITEM_MATCH), 1) AS Percent,
        COUNT(CASE WHEN Match_Status='Confirmed' THEN 1 END) AS Confirmed,
        ROUND(COUNT(CASE WHEN Match_Status='Confirmed' THEN 1 END) * 100.0 /
              NULLIF(COUNT(*), 0), 1) AS Confirmation_Rate
      FROM ITEM_MATCH
      GROUP BY Confidence_Level
      ORDER BY Match_Score DESC
    `);

    res.json(report);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/admin/reports/export/:format
router.get('/reports/export/:format', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const { format } = req.params;
    const { startDate, endDate } = req.query;

    const data = await allAsync(`
      SELECT
        'ITEM' AS Type,
        fi.Item_ID AS ID,
        fi.Item_Name AS Name,
        ic.Category_Name AS Category,
        fi.Item_Color AS Color,
        fi.Item_Status AS Status,
        fi.Date_Found AS Created_Date
      FROM FOUND_ITEM fi
      JOIN ITEM_CATEGORY ic ON fi.Category_ID = ic.Category_ID
      WHERE fi.Date_Found BETWEEN ? AND ?
      UNION ALL
      SELECT
        'REPORT' AS Type,
        lr.Report_ID AS ID,
        lr.Item_Name AS Name,
        ic.Category_Name AS Category,
        lr.Item_Color AS Color,
        lr.Report_Status AS Status,
        lr.Date_Filed AS Created_Date
      FROM LOST_REPORT lr
      JOIN ITEM_CATEGORY ic ON lr.Category_ID = ic.Category_ID
      WHERE lr.Date_Filed BETWEEN ? AND ?
    `, [startDate || '2020-01-01', endDate || '2099-12-31', startDate || '2020-01-01', endDate || '2099-12-31']);

    if (format === 'csv') {
      const csv = [
        'Type,ID,Name,Category,Color,Status,Created_Date',
        ...data.map(row => `${row.Type},"${row.Name}","${row.Category}","${row.Color}",${row.Status},${row.Created_Date}`)
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=report.csv');
      res.send(csv);
    } else {
      res.json(data);
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ========== USER MANAGEMENT ENDPOINTS ==========

// Already implemented in dashboard routes, keeping core functionality here

module.exports = router;
