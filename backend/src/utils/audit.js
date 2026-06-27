const { runAsync } = require('../database/init');

// Fire-and-forget audit writer. Callers intentionally do not await this; a
// failed audit write must never break the request it is logging, so errors
// are swallowed (and logged) rather than propagated.
function auditLog({ userId, action, entityType, entityId, oldValue, newValue, ip }) {
  return runAsync(
    `INSERT INTO AUDIT_LOG (User_ID,Action,Entity_Type,Entity_ID,Old_Value,New_Value,IP_Address)
     VALUES (?,?,?,?,?,?,?)`,
    [
      userId || null, action, entityType, entityId || null,
      oldValue ? JSON.stringify(oldValue) : null,
      newValue ? JSON.stringify(newValue) : null,
      ip || null
    ]
  ).catch(e => console.error('Audit log error:', e.message));
}

module.exports = { auditLog };
