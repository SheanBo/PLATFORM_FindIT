const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { getAsync, runAsync } = require('../../database/init');
const { authenticate } = require('../../middleware/auth.middleware');
const { auditLog } = require('../../utils/audit');

// POST /api/auth/register
router.post('/register', [
  body('username').trim().isLength({ min: 3 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('first_name').trim().notEmpty(),
  body('last_name').trim().notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { username, email, password, first_name, last_name, student_id, department } = req.body;
  try {
    const existing = await getAsync('SELECT User_ID FROM ONLINE_USER WHERE Username=? OR Email=?', [username, email]);
    if (existing) return res.status(409).json({ error: 'Username or email already exists' });

    const hash = bcrypt.hashSync(password, 10);
    const p = await runAsync('INSERT INTO PERSON (First_Name,Last_Name,Department) VALUES (?,?,?)', [first_name, last_name, department || null]);
    await runAsync('INSERT INTO ONLINE_USER (Person_ID,Username,Password_Hash,Email,Student_ID,Role_Type) VALUES (?,?,?,?,?,"Student")',
      [p.lastID, username, hash, email, student_id || null]);
    res.status(201).json({ message: 'Account created successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/auth/login
router.post('/login', [
  body('username').trim().notEmpty(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { username, password } = req.body;
  try {
    const user = await getAsync(`
      SELECT ou.*, p.First_Name, p.Last_Name, p.Department
      FROM ONLINE_USER ou JOIN PERSON p ON ou.Person_ID=p.Person_ID
      WHERE (ou.Username=? OR ou.Email=?) AND ou.Is_Active='Y'
    `, [username, username]);

    if (!user || !bcrypt.compareSync(password, user.Password_Hash))
      return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.User_ID, role: user.Role_Type }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    auditLog({ userId: user.User_ID, action: 'LOGIN', entityType: 'ONLINE_USER', entityId: user.User_ID, ip: req.ip });

    res.json({
      token,
      user: { id: user.User_ID, username: user.Username, email: user.Email, role: user.Role_Type, first_name: user.First_Name, last_name: user.Last_Name, student_id: user.Student_ID }
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await getAsync(`
      SELECT ou.User_ID,ou.Username,ou.Email,ou.Role_Type,ou.Student_ID,ou.Date_Registered,
             p.First_Name,p.Last_Name,p.Department,p.Contact_Number
      FROM ONLINE_USER ou JOIN PERSON p ON ou.Person_ID=p.Person_ID WHERE ou.User_ID=?
    `, [req.user.User_ID]);
    res.json(user);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
