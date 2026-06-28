const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { getAsync, runAsync, allAsync } = require('../../database/init');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { auditLog } = require('../../utils/audit');
const { parsePagination } = require('../../utils/pagination');
const { scoreMatch, MATCH_THRESHOLD } = require('./score');

// GET /api/findit-matching  - list all matches
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, min_score } = req.query;
    const { page, limit, offset } = parsePagination(req.query);
    const isStudent = req.user.Role_Type === 'Student';

    let where = isStudent ? 'WHERE lr.User_ID=?' : 'WHERE 1=1';
    const params = isStudent ? [req.user.User_ID] : [];

    if (status) { where += ' AND im.Match_Status=?'; params.push(status); }
    if (min_score) { where += ' AND im.Match_Score>=?'; params.push(parseFloat(min_score)); }

    const countResult = await getAsync(`
      SELECT COUNT(*) AS cnt FROM ITEM_MATCH im
      JOIN LOST_REPORT lr ON im.Report_ID=lr.Report_ID ${where}
    `, params);
    const total = countResult.cnt;
        //commrnt
    const rows = await allAsync(`
      SELECT im.*, fi.Item_Name AS Found_Name, fi.Item_Color AS Found_Color, fi.Item_Brand AS Found_Brand,
             fi.Photo_Path AS Found_Photo, ic.Category_Name,
             lr.Item_Name AS Lost_Name, lr.Item_Color AS Lost_Color,
             lf.Place_Name AS Found_Location, ll.Place_Name AS Lost_Location,
             p.First_Name || ' ' || p.Last_Name AS Reporter_Name, ou.Username
      FROM ITEM_MATCH im
      JOIN FOUND_ITEM fi ON im.Item_ID=fi.Item_ID
      JOIN ITEM_CATEGORY ic ON fi.Category_ID=ic.Category_ID
      JOIN LOCATION lf ON fi.Location_ID=lf.Location_ID
      JOIN LOST_REPORT lr ON im.Report_ID=lr.Report_ID
      JOIN LOCATION ll ON lr.Location_ID=ll.Location_ID
      JOIN ONLINE_USER ou ON lr.User_ID=ou.User_ID
      JOIN PERSON p ON ou.Person_ID=p.Person_ID
      ${where} ORDER BY im.Match_Score DESC, im.Date_Created DESC LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    res.json({ data: rows, pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/findit-matching/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const match = await getAsync(`
      SELECT im.*, lr.User_ID,
             fi.Item_Name AS Found_Name, fi.Item_Color AS Found_Color,
             fi.Item_Brand AS Found_Brand, fi.Item_Size AS Found_Size,
             fi.Item_Description AS Found_Description, fi.Date_Found,
             fi.Photo_Path AS Found_Photo, fi.Detail_Location AS Found_Detail,
             lf.Place_Name AS Found_Location,
             lr.Item_Name AS Lost_Name, lr.Item_Color AS Lost_Color,
             lr.Item_Brand AS Lost_Brand, lr.Item_Size AS Lost_Size,
             lr.Item_Description AS Lost_Description, lr.Date_Lost,
             lr.Photo_Path AS Lost_Photo, lr.Detail_Location AS Lost_Detail,
             ll.Place_Name AS Lost_Location,
             ic.Category_Name, p.First_Name, p.Last_Name, ou.Username, ou.Email
      FROM ITEM_MATCH im
      JOIN FOUND_ITEM fi ON im.Item_ID=fi.Item_ID
      JOIN LOCATION lf ON fi.Location_ID=lf.Location_ID
      JOIN LOST_REPORT lr ON im.Report_ID=lr.Report_ID
      JOIN LOCATION ll ON lr.Location_ID=ll.Location_ID
      JOIN ITEM_CATEGORY ic ON fi.Category_ID=ic.Category_ID
      JOIN ONLINE_USER ou ON lr.User_ID=ou.User_ID
      JOIN PERSON p ON ou.Person_ID=p.Person_ID
      WHERE im.Match_ID=?
    `, [req.params.id]);
    if (!match) return res.status(404).json({ error: 'Match not found' });
    if (req.user.Role_Type === 'Student' && match.User_ID !== req.user.User_ID)
      return res.status(403).json({ error: 'Access denied' });

    const breakdown = match.Score_Breakdown ? JSON.parse(match.Score_Breakdown) : {};
    res.json({ ...match, breakdown });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/findit-matching/run  - trigger auto-matching for all active items
router.post('/run', authenticate, authorize('Staff','Admin'), async (req, res) => {
  try {
    const items = await allAsync("SELECT * FROM FOUND_ITEM WHERE Item_Status='Unclaimed'", []);
    const reports = await allAsync("SELECT * FROM LOST_REPORT WHERE Report_Status='Active'", []);
    let matchCount = 0;

    for (const item of items) {
      for (const report of reports) {
        const { score, breakdown } = scoreMatch(item, report);

        if (score >= MATCH_THRESHOLD) {
          const existing = await getAsync('SELECT Match_ID FROM ITEM_MATCH WHERE Item_ID=? AND Report_ID=?', [item.Item_ID, report.Report_ID]);
          if (!existing) {
            await runAsync('INSERT INTO ITEM_MATCH (Item_ID,Report_ID,Match_Score,Score_Breakdown,Match_Type) VALUES (?,?,?,?,"Auto")', [item.Item_ID, report.Report_ID, score, JSON.stringify(breakdown)]);
            await runAsync("UPDATE FOUND_ITEM SET Item_Status='Matched' WHERE Item_ID=? AND Item_Status='Unclaimed'", [item.Item_ID]);
            await runAsync("UPDATE LOST_REPORT SET Report_Status='Matched' WHERE Report_ID=? AND Report_Status='Active'", [report.Report_ID]);
            matchCount++;
          }
        }
      }
    }
    auditLog({ userId: req.user.User_ID, action: 'RUN_AUTO_MATCH', entityType: 'ITEM_MATCH', ip: req.ip });
    res.json({ message: `Auto-match complete. ${matchCount} new matches found.`, matchCount });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/findit-matching/manual  - Staff/Admin manually create a match
router.post('/manual', authenticate, authorize('Staff','Admin'), [
  body('item_id').isInt(),
  body('report_id').isInt(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { item_id, report_id, notes } = req.body;

    const item = await getAsync('SELECT * FROM FOUND_ITEM WHERE Item_ID=?', [item_id]);
    const report = await getAsync('SELECT * FROM LOST_REPORT WHERE Report_ID=?', [report_id]);
    if (!item || !report) return res.status(404).json({ error: 'Item or report not found' });

    const { score, breakdown } = scoreMatch(item, report);

    const r = await runAsync('INSERT OR IGNORE INTO ITEM_MATCH (Item_ID,Report_ID,Match_Score,Score_Breakdown,Match_Type) VALUES (?,?,?,?,"Manual")', [item_id, report_id, score, JSON.stringify(breakdown)]);

    if (r.changes === 0) return res.status(409).json({ error: 'Match already exists' });

    await runAsync("UPDATE FOUND_ITEM SET Item_Status='Matched' WHERE Item_ID=? AND Item_Status='Unclaimed'", [item_id]);
    await runAsync("UPDATE LOST_REPORT SET Report_Status='Matched' WHERE Report_ID=? AND Report_Status='Active'", [report_id]);

    auditLog({ userId: req.user.User_ID, action: 'MANUAL_MATCH', entityType: 'ITEM_MATCH', entityId: r.lastID, ip: req.ip });
    res.status(201).json({ message: 'Manual match created', id: r.lastID, score, breakdown });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/findit-matching/:id/status  - confirm or reject
router.put('/:id/status', authenticate, authorize('Staff','Admin'), [
  body('status').isIn(['Confirmed','Rejected']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const match = await getAsync('SELECT * FROM ITEM_MATCH WHERE Match_ID=?', [req.params.id]);
    if (!match) return res.status(404).json({ error: 'Match not found' });

    await runAsync('UPDATE ITEM_MATCH SET Match_Status=? WHERE Match_ID=?', [req.body.status, req.params.id]);
    if (req.body.status === 'Rejected') {
      await runAsync("UPDATE FOUND_ITEM SET Item_Status='Unclaimed' WHERE Item_ID=? AND Item_Status='Matched'", [match.Item_ID]);
      await runAsync("UPDATE LOST_REPORT SET Report_Status='Active' WHERE Report_ID=? AND Report_Status='Matched'", [match.Report_ID]);
    }
    auditLog({ userId: req.user.User_ID, action: `MATCH_${req.body.status.toUpperCase()}`, entityType: 'ITEM_MATCH', entityId: req.params.id, ip: req.ip });
    res.json({ message: `Match ${req.body.status.toLowerCase()}` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
