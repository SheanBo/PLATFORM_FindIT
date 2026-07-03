const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const { getAsync, runAsync, allAsync } = require('../../database/init');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { auditLog } = require('../../utils/audit');
const { parsePagination } = require('../../utils/pagination');
const upload = require('../../utils/upload');
const { scoreMatch, MATCH_THRESHOLD } = require('../matching/score');

// GET /api/findit-lost-reports
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, category, search } = req.query;
    const { page, limit, offset } = parsePagination(req.query);
    const isStudent = req.user.Role_Type === 'Student';

    let where = isStudent ? 'WHERE lr.User_ID=?' : 'WHERE 1=1';
    const params = isStudent ? [req.user.User_ID] : [];

    if (status) { where += ' AND lr.Report_Status=?'; params.push(status); }
    if (category) { where += ' AND lr.Category_ID=?'; params.push(category); }
    if (search) { where += ' AND (lr.Item_Name LIKE ? OR lr.Item_Description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    const countResult = await getAsync(`SELECT COUNT(*) AS cnt FROM LOST_REPORT lr ${where}`, params);
    const total = countResult.cnt;
    const rows = await allAsync(`
      SELECT lr.*, ic.Category_Name, l.Place_Name,
             p.First_Name || ' ' || p.Last_Name AS Reporter_Name, ou.Username
      FROM LOST_REPORT lr
      JOIN ITEM_CATEGORY ic ON lr.Category_ID=ic.Category_ID
      JOIN LOCATION l ON lr.Location_ID=l.Location_ID
      JOIN ONLINE_USER ou ON lr.User_ID=ou.User_ID
      JOIN PERSON p ON ou.Person_ID=p.Person_ID
      ${where} ORDER BY lr.Date_Lost DESC, lr.Date_Filed DESC LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    res.json({ data: rows, pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/findit-lost-reports/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const report = await getAsync(`
      SELECT lr.*, ic.Category_Name, l.Place_Name, l.Place_Description,
             p.First_Name, p.Last_Name, ou.Username, ou.Email
      FROM LOST_REPORT lr
      JOIN ITEM_CATEGORY ic ON lr.Category_ID=ic.Category_ID
      JOIN LOCATION l ON lr.Location_ID=l.Location_ID
      JOIN ONLINE_USER ou ON lr.User_ID=ou.User_ID
      JOIN PERSON p ON ou.Person_ID=p.Person_ID
      WHERE lr.Report_ID=?
    `, [req.params.id]);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    if (req.user.Role_Type === 'Student' && report.User_ID !== req.user.User_ID)
      return res.status(403).json({ error: 'Access denied' });

    const matches = await allAsync(`
      SELECT im.*, fi.Item_Name AS Found_Name, fi.Item_Color AS Found_Color,
             ic2.Category_Name AS Found_Category, l2.Place_Name AS Found_Location
      FROM ITEM_MATCH im
      JOIN FOUND_ITEM fi ON im.Item_ID=fi.Item_ID
      JOIN ITEM_CATEGORY ic2 ON fi.Category_ID=ic2.Category_ID
      JOIN LOCATION l2 ON fi.Location_ID=l2.Location_ID
      WHERE im.Report_ID=? AND im.Match_Score >= 60
      ORDER BY im.Match_Score DESC
    `, [req.params.id]);

    res.json({ ...report, matches });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/findit-lost-reports
router.post('/', authenticate, upload.single('photo'), [
  body('category_id').isInt(),
  body('location_id').isInt(),
  body('item_name').trim().notEmpty(),
  body('item_description').trim().notEmpty(),
  body('item_color').trim().notEmpty(),
  body('date_lost').isDate(),
  body('contact_information').trim().notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { category_id, location_id, item_name, item_description, item_color,
            item_size, item_brand, serial_number, date_lost, detail_location, contact_information } = req.body;
    const photo_path = req.file ? `/uploads/${req.file.filename}` : null;

    const result = await runAsync(`
      INSERT INTO LOST_REPORT
        (User_ID,Category_ID,Location_ID,Item_Name,Item_Description,Item_Color,
         Item_Size,Item_Brand,Serial_Number,Date_Lost,Detail_Location,Contact_Information,Photo_Path)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    `, [req.user.User_ID, category_id, location_id, item_name, item_description, item_color,
           item_size || null, item_brand || null, serial_number || null, date_lost,
           detail_location || null, contact_information, photo_path]);

    auditLog({ userId: req.user.User_ID, action: 'CREATE_LOST_REPORT', entityType: 'LOST_REPORT', entityId: result.lastID, ip: req.ip });

    // Auto-run matching
    await runAutoMatch(result.lastID);

    res.status(201).json({ message: 'Lost report submitted', id: result.lastID });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/findit-lost-reports/:id
router.put('/:id', authenticate, upload.single('photo'), async (req, res) => {
  try {
    const report = await getAsync('SELECT * FROM LOST_REPORT WHERE Report_ID=?', [req.params.id]);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    if (req.user.Role_Type === 'Student' && report.User_ID !== req.user.User_ID)
      return res.status(403).json({ error: 'Access denied' });

    const { item_name, item_description, item_color, item_size, item_brand,
            serial_number, date_lost, detail_location, contact_information, status } = req.body;
    const photo_path = req.file ? `/uploads/${req.file.filename}` : report.Photo_Path;

    await runAsync(`
      UPDATE LOST_REPORT SET
        Item_Name=?, Item_Description=?, Item_Color=?, Item_Size=?, Item_Brand=?,
        Serial_Number=?, Date_Lost=?, Detail_Location=?, Contact_Information=?,
        Photo_Path=?, Report_Status=COALESCE(?,Report_Status)
      WHERE Report_ID=?
    `, [item_name || report.Item_Name, item_description || report.Item_Description,
           item_color || report.Item_Color, item_size || report.Item_Size,
           item_brand || report.Item_Brand, serial_number || report.Serial_Number,
           date_lost || report.Date_Lost, detail_location || report.Detail_Location,
           contact_information || report.Contact_Information, photo_path,
           req.user.Role_Type !== 'Student' ? (status || null) : null,
           req.params.id]);

    auditLog({ userId: req.user.User_ID, action: 'UPDATE_LOST_REPORT', entityType: 'LOST_REPORT', entityId: req.params.id, oldValue: report, ip: req.ip });
    res.json({ message: 'Report updated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/findit-lost-reports/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const report = await getAsync('SELECT * FROM LOST_REPORT WHERE Report_ID=?', [req.params.id]);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    if (req.user.Role_Type === 'Student' && report.User_ID !== req.user.User_ID)
      return res.status(403).json({ error: 'Access denied' });

    await runAsync(`UPDATE LOST_REPORT SET Report_Status='Cancelled' WHERE Report_ID=?`, [req.params.id]);
    auditLog({ userId: req.user.User_ID, action: 'CANCEL_LOST_REPORT', entityType: 'LOST_REPORT', entityId: req.params.id, ip: req.ip });
    res.json({ message: 'Report cancelled' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Matching logic helper
async function runAutoMatch(reportId) {
  try {
    const report = await getAsync('SELECT * FROM LOST_REPORT WHERE Report_ID=?', [reportId]);
    if (!report) return;
    const foundItems = await allAsync("SELECT * FROM FOUND_ITEM WHERE Item_Status='Unclaimed'", []);

    for (const item of foundItems) {
      // Uses the same shared scoring as the bulk /run and /manual endpoints
      // so every auto-match path stays consistent (see modules/matching/score.js).
      const { score, breakdown } = scoreMatch(item, report);

      if (score >= MATCH_THRESHOLD) {
        await runAsync(`INSERT OR IGNORE INTO ITEM_MATCH (Item_ID,Report_ID,Match_Score,Score_Breakdown,Match_Type) VALUES (?,?,?,?,'Auto')`, [item.Item_ID, reportId, score, JSON.stringify(breakdown)]);
        await runAsync(`UPDATE FOUND_ITEM SET Item_Status='Matched' WHERE Item_ID=? AND Item_Status='Unclaimed'`, [item.Item_ID]);
        await runAsync(`UPDATE LOST_REPORT SET Report_Status='Matched' WHERE Report_ID=?`, [reportId]);
      }
    }
  } catch (e) { console.error('Auto-match error:', e.message); }
}

module.exports = router;
