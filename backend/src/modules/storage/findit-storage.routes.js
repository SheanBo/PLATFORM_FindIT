const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { getAsync, runAsync, allAsync } = require('../../database/init');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { auditLog } = require('../../utils/audit');
const { recommendStorageType, pickSectionForCategory, OTHERS_BIN_NAME } = require('./recommend');

// GET /api/findit-storage  - list all sections
router.get('/', authenticate, authorize('Staff','Admin'), async (req, res) => {
  try {
    const sections = await allAsync(`
      SELECT ss.*,
             COUNT(fi.Item_ID) AS Actual_Load,
             ROUND(COUNT(fi.Item_ID) * 100.0 / NULLIF(ss.Capacity, 0), 1) AS Usage_Percent
      FROM STORAGE_SECTION ss
      LEFT JOIN FOUND_ITEM fi ON fi.Section_ID=ss.Section_ID AND fi.Item_Status NOT IN ('Claimed','Disposed')
      GROUP BY ss.Section_ID ORDER BY ss.Storage_Type, ss.Section_Name
    `, []);
    res.json({ data: sections });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/findit-storage/recommend?category_id=N  - smart storage suggestion.
// Must be registered before /:id so 'recommend' is not captured as an id.
router.get('/recommend', authenticate, authorize('Staff','Admin'), async (req, res) => {
  try {
    const categoryId = parseInt(req.query.category_id, 10);
    if (!Number.isFinite(categoryId)) return res.status(400).json({ error: 'category_id is required' });

    const category = await getAsync('SELECT * FROM ITEM_CATEGORY WHERE Category_ID=?', [categoryId]);
    if (!category) return res.status(404).json({ error: 'Category not found' });

    const storageType = recommendStorageType(category.Category_Name);
    const sections = await allAsync(`
      SELECT ss.*, COUNT(fi.Item_ID) AS Actual_Load
      FROM STORAGE_SECTION ss
      LEFT JOIN FOUND_ITEM fi ON fi.Section_ID=ss.Section_ID AND fi.Item_Status NOT IN ('Claimed','Disposed')
      GROUP BY ss.Section_ID
    `, []);
    const section = pickSectionForCategory(sections, category.Category_Name, storageType);

    const label = category.Category_Name.replace(/_/g, ' ');
    const place = storageType === 'Office_Safe' ? 'office safe' : 'lockers';
    // An 'Other' item routed to its dedicated bin is chosen by designation,
    // not by free space, so word that path differently.
    const inOthersBin = category.Category_Name === 'Other' && section && section.Section_Name === OTHERS_BIN_NAME;
    let reason;
    if (!section) {
      reason = `${label} items go in the ${place}, but all ${place} sections are at capacity`;
    } else if (inOthersBin) {
      reason = `${label} items go in the dedicated ${OTHERS_BIN_NAME}`;
    } else {
      reason = `${label} items go in the ${place}; ${section.Section_Name} has the most free space`;
    }
    res.json({ storage_type: storageType, section, reason });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/findit-storage/:id  - section detail with items
router.get('/:id', authenticate, authorize('Staff','Admin'), async (req, res) => {
  try {
    const section = await getAsync('SELECT * FROM STORAGE_SECTION WHERE Section_ID=?', [req.params.id]);
    if (!section) return res.status(404).json({ error: 'Section not found' });

    const items = await allAsync(`
      SELECT fi.Item_ID, fi.Item_Name, fi.Item_Color, fi.Item_Brand, fi.Date_Found,
             fi.Item_Status, ic.Category_Name,
             (CURRENT_DATE - fi.Date_Found) AS Days_Stored
      FROM FOUND_ITEM fi JOIN ITEM_CATEGORY ic ON fi.Category_ID=ic.Category_ID
      WHERE fi.Section_ID=? AND fi.Item_Status NOT IN ('Claimed','Disposed')
      ORDER BY fi.Date_Found ASC
    `, [req.params.id]);

    res.json({ ...section, items, item_count: items.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/findit-storage
router.post('/', authenticate, authorize('Admin'), [
  body('storage_type').isIn(['Locker','Office_Safe']),
  body('section_name').trim().notEmpty(),
  body('capacity').isInt({ min: 1 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { storage_type, section_name, capacity } = req.body;
    const r = await runAsync('INSERT INTO STORAGE_SECTION (Storage_Type,Section_Name,Capacity) VALUES (?,?,?)', [storage_type, section_name, capacity]);
    auditLog({ userId: req.user.User_ID, action: 'CREATE_STORAGE_SECTION', entityType: 'STORAGE_SECTION', entityId: r.lastID, ip: req.ip });
    res.status(201).json({ message: 'Storage section created', id: r.lastID });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/findit-storage/:id
router.put('/:id', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const section = await getAsync('SELECT * FROM STORAGE_SECTION WHERE Section_ID=?', [req.params.id]);
    if (!section) return res.status(404).json({ error: 'Section not found' });

    const { section_name, capacity } = req.body;
    await runAsync('UPDATE STORAGE_SECTION SET Section_Name=COALESCE(?,Section_Name), Capacity=COALESCE(?,Capacity) WHERE Section_ID=?', [section_name || null, capacity || null, req.params.id]);
    res.json({ message: 'Section updated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/findit-storage/expired/items
router.get('/expired/items', authenticate, authorize('Staff','Admin'), async (req, res) => {
  try {
    const items = await allAsync('SELECT * FROM VW_EXPIRED_ITEMS ORDER BY Days_Unclaimed DESC', []);
    res.json({ data: items, count: items.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/findit-storage/items/:itemId/move  - move item to different section
router.put('/items/:itemId/move', authenticate, authorize('Staff','Admin'), [
  body('section_id').isInt(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const item = await getAsync('SELECT * FROM FOUND_ITEM WHERE Item_ID=?', [req.params.itemId]);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    const newSection = await getAsync('SELECT * FROM STORAGE_SECTION WHERE Section_ID=?', [req.body.section_id]);
    if (!newSection) return res.status(404).json({ error: 'Section not found' });
    if (newSection.Current_Load >= newSection.Capacity) return res.status(400).json({ error: 'Section is at capacity' });

    if (item.Section_ID) await runAsync('UPDATE STORAGE_SECTION SET Current_Load=MAX(0,Current_Load-1) WHERE Section_ID=?', [item.Section_ID]);
    await runAsync('UPDATE FOUND_ITEM SET Section_ID=?,Storage_Type=? WHERE Item_ID=?', [req.body.section_id, newSection.Storage_Type, req.params.itemId]);
    await runAsync('UPDATE STORAGE_SECTION SET Current_Load=Current_Load+1 WHERE Section_ID=?', [req.body.section_id]);

    auditLog({ userId: req.user.User_ID, action: 'MOVE_ITEM_STORAGE', entityType: 'FOUND_ITEM', entityId: req.params.itemId, oldValue: { section: item.Section_ID }, newValue: { section: req.body.section_id }, ip: req.ip });
    res.json({ message: 'Item moved successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
