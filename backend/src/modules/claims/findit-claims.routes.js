const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { getDb, getAsync, runAsync, allAsync } = require('../../database/init');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { auditLog } = require('../../utils/audit');

// GET /api/findit-claims
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const isStudent = req.user.Role_Type === 'Student';

    let where = isStudent ? 'WHERE c.User_ID=?' : 'WHERE 1=1';
    const params = isStudent ? [req.user.User_ID] : [];
    if (status) { where += ' AND c.Claim_Status=?'; params.push(status); }

    const countResult = await getAsync(`SELECT COUNT(*) AS cnt FROM CLAIM c ${where}`, params);
    const total = countResult.cnt;
    const rows = await allAsync(`
      SELECT c.*, fi.Item_Name AS Found_Name, fi.Item_Color AS Found_Color, fi.Photo_Path AS Found_Photo,
             lr.Item_Name AS Lost_Name, ic.Category_Name,
             p.First_Name || ' ' || p.Last_Name AS Claimant_Name, ou.Username AS Claimant_Username,
             vp.First_Name || ' ' || vp.Last_Name AS Verifier_Name
      FROM CLAIM c
      JOIN FOUND_ITEM fi ON c.Item_ID=fi.Item_ID
      JOIN LOST_REPORT lr ON c.Report_ID=lr.Report_ID
      JOIN ITEM_CATEGORY ic ON fi.Category_ID=ic.Category_ID
      JOIN ONLINE_USER ou ON c.User_ID=ou.User_ID
      JOIN PERSON p ON ou.Person_ID=p.Person_ID
      LEFT JOIN ONLINE_USER vou ON c.Verified_By_ID=vou.User_ID
      LEFT JOIN PERSON vp ON vou.Person_ID=vp.Person_ID
      ${where} ORDER BY c.Claim_Date DESC LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    res.json({ data: rows, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/findit-claims/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const claim = await getAsync(`
      SELECT c.*, fi.Item_Name AS Found_Name, fi.Item_Color AS Found_Color,
             fi.Item_Description AS Found_Description, fi.Photo_Path AS Found_Photo,
             lr.Item_Name AS Lost_Name, ic.Category_Name,
             p.First_Name, p.Last_Name, ou.Username, ou.Email,
             vp.First_Name AS Verifier_First, vp.Last_Name AS Verifier_Last
      FROM CLAIM c
      JOIN FOUND_ITEM fi ON c.Item_ID=fi.Item_ID
      JOIN LOST_REPORT lr ON c.Report_ID=lr.Report_ID
      JOIN ITEM_CATEGORY ic ON fi.Category_ID=ic.Category_ID
      JOIN ONLINE_USER ou ON c.User_ID=ou.User_ID
      JOIN PERSON p ON ou.Person_ID=p.Person_ID
      LEFT JOIN ONLINE_USER vou ON c.Verified_By_ID=vou.User_ID
      LEFT JOIN PERSON vp ON vou.Person_ID=vp.Person_ID
      WHERE c.Claim_ID=?
    `, [req.params.id]);
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    if (req.user.Role_Type === 'Student' && claim.User_ID !== req.user.User_ID)
      return res.status(403).json({ error: 'Access denied' });
    res.json(claim);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/findit-claims
router.post('/', authenticate, [
  body('item_id').isInt(),
  body('report_id').isInt(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { item_id, report_id, match_id, claim_notes } = req.body;

    const item = await getAsync('SELECT * FROM FOUND_ITEM WHERE Item_ID=?', [item_id]);
    if (!item) return res.status(404).json({ error: 'Found item not found' });
    if (!['Unclaimed','Matched'].includes(item.Item_Status))
      return res.status(400).json({ error: `Cannot claim item with status: ${item.Item_Status}` });

    const report = await getAsync('SELECT * FROM LOST_REPORT WHERE Report_ID=? AND User_ID=?', [report_id, req.user.User_ID]);
    if (!report && req.user.Role_Type === 'Student')
      return res.status(403).json({ error: 'You can only claim using your own lost report' });

    const existing = await getAsync('SELECT Claim_ID FROM CLAIM WHERE Item_ID=? AND User_ID=? AND Claim_Status NOT IN ("Rejected","Disputed")', [item_id, req.user.User_ID]);
    if (existing) return res.status(409).json({ error: 'You already have an active claim for this item' });

    const r = await runAsync(`
      INSERT INTO CLAIM (Item_ID,Report_ID,User_ID,Match_ID,Claim_Notes)
      VALUES (?,?,?,?,?)
    `, [item_id, report_id, req.user.User_ID, match_id || null, claim_notes || null]);

    auditLog({ userId: req.user.User_ID, action: 'CREATE_CLAIM', entityType: 'CLAIM', entityId: r.lastID, ip: req.ip });
    res.status(201).json({ message: 'Claim submitted successfully', id: r.lastID });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/findit-claims/:id/verify  - Staff/Admin approve or reject
router.put('/:id/verify', authenticate, authorize('Staff','Admin'), [
  body('status').isIn(['Approved','Rejected','Disputed']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const claim = await getAsync('SELECT * FROM CLAIM WHERE Claim_ID=?', [req.params.id]);
    if (!claim) return res.status(404).json({ error: 'Claim not found' });

    const { status, claim_notes, dispute_reason, released_date } = req.body;

    await runAsync(`
      UPDATE CLAIM SET
        Claim_Status=?, Verified_By_ID=?, Verification_Date=CURRENT_DATE,
        Claim_Notes=COALESCE(?,Claim_Notes),
        Is_Disputed=?, Dispute_Reason=COALESCE(?,Dispute_Reason),
        Released_Date=COALESCE(?,Released_Date)
      WHERE Claim_ID=?
    `, [status, req.user.User_ID, claim_notes || null,
           status === 'Disputed' ? 'Y' : 'N',
           dispute_reason || null, released_date || null,
           req.params.id]);

    if (status === 'Disputed') {
      await runAsync("UPDATE FOUND_ITEM SET Item_Status='Disputed' WHERE Item_ID=?", [claim.Item_ID]);
      await runAsync("UPDATE ITEM_MATCH SET Match_Status='Disputed' WHERE Item_ID=? AND Report_ID=?", [claim.Item_ID, claim.Report_ID]);
    }

    auditLog({ userId: req.user.User_ID, action: `CLAIM_${status.toUpperCase()}`, entityType: 'CLAIM', entityId: req.params.id, oldValue: claim, ip: req.ip });
    res.json({ message: `Claim ${status.toLowerCase()}` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/findit-claims/:id/acknowledge
router.put('/:id/acknowledge', authenticate, async (req, res) => {
  try {
    const claim = await getAsync('SELECT * FROM CLAIM WHERE Claim_ID=? AND User_ID=?', [req.params.id, req.user.User_ID]);
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    await runAsync('UPDATE CLAIM SET Acknowledged="Y" WHERE Claim_ID=?', [req.params.id]);
    res.json({ message: 'Claim acknowledged' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
