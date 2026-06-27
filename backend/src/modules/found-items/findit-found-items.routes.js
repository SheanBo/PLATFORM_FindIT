const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { getAsync, runAsync, allAsync } = require('../../database/init');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { auditLog } = require('../../utils/audit');
const { parsePagination } = require('../../utils/pagination');
const upload = require('../../utils/upload');

// GET /api/findit-found-items
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, category, search } = req.query;
    const { page, limit, offset } = parsePagination(req.query);
    let where = 'WHERE 1=1'; const params = [];

    if (status) { where += ' AND fi.Item_Status=?'; params.push(status); }
    if (category) { where += ' AND fi.Category_ID=?'; params.push(category); }
    if (search) { where += ' AND (fi.Item_Name LIKE ? OR fi.Item_Description LIKE ? OR fi.Item_Brand LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }

    const countResult = await getAsync(`SELECT COUNT(*) AS cnt FROM FOUND_ITEM fi ${where}`, params);
    const total = countResult.cnt;
    const rows = await allAsync(`
      SELECT fi.*, ic.Category_Name, l.Place_Name, ss.Section_Name,
             ou.Username AS Staff_Username, p.First_Name || ' ' || p.Last_Name AS Staff_Name
      FROM FOUND_ITEM fi
      JOIN ITEM_CATEGORY ic ON fi.Category_ID=ic.Category_ID
      JOIN LOCATION l ON fi.Location_ID=l.Location_ID
      LEFT JOIN STORAGE_SECTION ss ON fi.Section_ID=ss.Section_ID
      JOIN ONLINE_USER ou ON fi.Contact_Staff_ID=ou.User_ID
      JOIN PERSON p ON ou.Person_ID=p.Person_ID
      ${where} ORDER BY fi.Date_Found DESC LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    res.json({ data: rows, pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/findit-found-items/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const item = await getAsync(`
      SELECT fi.*, ic.Category_Name, l.Place_Name, l.Place_Description,
             ss.Section_Name, ss.Storage_Type AS Section_Type,
             ou.Username AS Staff_Username, p.First_Name, p.Last_Name
      FROM FOUND_ITEM fi
      JOIN ITEM_CATEGORY ic ON fi.Category_ID=ic.Category_ID
      JOIN LOCATION l ON fi.Location_ID=l.Location_ID
      LEFT JOIN STORAGE_SECTION ss ON fi.Section_ID=ss.Section_ID
      JOIN ONLINE_USER ou ON fi.Contact_Staff_ID=ou.User_ID
      JOIN PERSON p ON ou.Person_ID=p.Person_ID
      WHERE fi.Item_ID=?
    `, [req.params.id]);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const matches = await allAsync(`
      SELECT im.*, lr.Item_Name AS Lost_Name, lr.User_ID, im.Match_Score
      FROM ITEM_MATCH im JOIN LOST_REPORT lr ON im.Report_ID=lr.Report_ID
      WHERE im.Item_ID=? ORDER BY im.Match_Score DESC
    `, [req.params.id]);

    res.json({ ...item, matches });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/findit-found-items  (Staff/Admin only)
router.post('/', authenticate, authorize('Staff','Admin'), upload.single('photo'), [
  body('category_id').isInt(),
  body('location_id').isInt(),
  body('item_name').trim().notEmpty(),
  body('item_description').trim().notEmpty(),
  body('item_color').trim().notEmpty(),
  body('date_found').isDate(),
  body('storage_type').isIn(['Locker','Office_Safe']),
  body('found_by_contact').trim().notEmpty().withMessage('Finder name and contact are required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { category_id, location_id, item_name, item_description, item_color,
            item_size, item_brand, serial_number, date_found, detail_location,
            storage_type, section_id, found_by_contact } = req.body;
    const photo_path = req.file ? `/uploads/${req.file.filename}` : null;

    const result = await runAsync(`
      INSERT INTO FOUND_ITEM
        (Category_ID,Location_ID,Item_Name,Item_Description,Item_Color,Item_Size,Item_Brand,
         Serial_Number,Date_Found,Detail_Location,Storage_Type,Section_ID,Photo_Path,
         Contact_Staff_ID,Found_By_Contact,Reported_By_User_ID)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `, [category_id, location_id, item_name, item_description, item_color,
           item_size || null, item_brand || null, serial_number || null, date_found,
           detail_location || null, storage_type, section_id || null, photo_path,
           req.user.User_ID, found_by_contact || null, req.user.User_ID]);

    // Update storage load
    if (section_id) await runAsync('UPDATE STORAGE_SECTION SET Current_Load=Current_Load+1 WHERE Section_ID=?', [section_id]);

    // Auto-match against active reports
    await runAutoMatchForItem(result.lastID);

    auditLog({ userId: req.user.User_ID, action: 'CREATE_FOUND_ITEM', entityType: 'FOUND_ITEM', entityId: result.lastID, ip: req.ip });
    res.status(201).json({ message: 'Found item registered', id: result.lastID });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/findit-found-items/:id  (Staff/Admin only)
router.put('/:id', authenticate, authorize('Staff','Admin'), upload.single('photo'), async (req, res) => {
  try {
    const item = await getAsync('SELECT * FROM FOUND_ITEM WHERE Item_ID=?', [req.params.id]);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const { item_name, item_description, item_color, item_size, item_brand,
            storage_type, section_id, item_status } = req.body;
    const photo_path = req.file ? `/uploads/${req.file.filename}` : item.Photo_Path;

    if (item.Item_Status === 'Claimed' && item_status && item_status !== 'Claimed')
      return res.status(400).json({ error: 'Cannot revert a claimed item status' });

    await runAsync(`
      UPDATE FOUND_ITEM SET
        Item_Name=COALESCE(?,Item_Name), Item_Description=COALESCE(?,Item_Description),
        Item_Color=COALESCE(?,Item_Color), Item_Size=COALESCE(?,Item_Size),
        Item_Brand=COALESCE(?,Item_Brand), Storage_Type=COALESCE(?,Storage_Type),
        Section_ID=COALESCE(?,Section_ID), Photo_Path=?, Item_Status=COALESCE(?,Item_Status)
      WHERE Item_ID=?
    `, [item_name||null, item_description||null, item_color||null, item_size||null,
           item_brand||null, storage_type||null, section_id||null, photo_path,
           item_status||null, req.params.id]);

    auditLog({ userId: req.user.User_ID, action: 'UPDATE_FOUND_ITEM', entityType: 'FOUND_ITEM', entityId: req.params.id, oldValue: item, ip: req.ip });
    res.json({ message: 'Found item updated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/findit-found-items/:id (Admin only - marks as Disposed)
router.delete('/:id', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const item = await getAsync('SELECT * FROM FOUND_ITEM WHERE Item_ID=?', [req.params.id]);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    await runAsync('UPDATE FOUND_ITEM SET Item_Status="Disposed" WHERE Item_ID=?', [req.params.id]);
    if (item.Section_ID) await runAsync('UPDATE STORAGE_SECTION SET Current_Load=MAX(0,Current_Load-1) WHERE Section_ID=?', [item.Section_ID]);

    auditLog({ userId: req.user.User_ID, action: 'DISPOSE_FOUND_ITEM', entityType: 'FOUND_ITEM', entityId: req.params.id, ip: req.ip });
    res.json({ message: 'Item marked as disposed' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/findit-found-items/expired/list (Staff/Admin)
router.get('/expired/list', authenticate, authorize('Staff','Admin'), async (req, res) => {
  try {
    const items = await allAsync('SELECT * FROM VW_EXPIRED_ITEMS ORDER BY Days_Unclaimed DESC', []);
    res.json({ data: items });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

async function runAutoMatchForItem(itemId) {
  try {
    const item = await getAsync('SELECT * FROM FOUND_ITEM WHERE Item_ID=?', [itemId]);
    if (!item) return;
    const reports = await allAsync("SELECT * FROM LOST_REPORT WHERE Report_Status='Active'", []);

    for (const report of reports) {
      let score = 0; const breakdown = {};
      if (item.Category_ID === report.Category_ID) { score += 40; breakdown.category = 40; } else breakdown.category = 0;
      if (item.Item_Color && report.Item_Color && item.Item_Color.toLowerCase() === report.Item_Color.toLowerCase()) { score += 20; breakdown.color = 20; } else breakdown.color = 0;
      if (item.Item_Brand && report.Item_Brand && item.Item_Brand.toLowerCase() === report.Item_Brand.toLowerCase()) { score += 20; breakdown.brand = 20; } else breakdown.brand = 0;
      if (item.Item_Size && report.Item_Size && item.Item_Size.toLowerCase() === report.Item_Size.toLowerCase()) { score += 10; breakdown.size = 10; } else breakdown.size = 0;
      if (item.Location_ID === report.Location_ID) { score += 10; breakdown.location = 10; } else breakdown.location = 0;

      if (score >= 60) {
        await runAsync('INSERT OR IGNORE INTO ITEM_MATCH (Item_ID,Report_ID,Match_Score,Score_Breakdown,Match_Type) VALUES (?,?,?,?,"Auto")', [itemId, report.Report_ID, score, JSON.stringify(breakdown)]);
        await runAsync('UPDATE FOUND_ITEM SET Item_Status="Matched" WHERE Item_ID=? AND Item_Status="Unclaimed"', [itemId]);
        await runAsync('UPDATE LOST_REPORT SET Report_Status="Matched" WHERE Report_ID=? AND Report_Status="Active"', [report.Report_ID]);
      }
    }
  } catch (e) { console.error('Auto-match error:', e.message); }
}

module.exports = router;
