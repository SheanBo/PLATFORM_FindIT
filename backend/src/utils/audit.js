const { getDb } = require('../database/init');

function auditLog({ userId, action, entityType, entityId, oldValue, newValue, ip }) {
  try {
    const db = getDb();
    db.prepare(`INSERT INTO AUDIT_LOG (User_ID,Action,Entity_Type,Entity_ID,Old_Value,New_Value,IP_Address)
      VALUES (?,?,?,?,?,?,?)`).run(
      userId || null, action, entityType, entityId || null,
      oldValue ? JSON.stringify(oldValue) : null,
      newValue ? JSON.stringify(newValue) : null,
      ip || null
    );
  } catch (e) { console.error('Audit log error:', e.message); }
}

module.exports = { auditLog };
