require('dotenv').config();
const { getDb, execAsync } = require('./src/database/init');

async function resetDatabase() {
  try {
    console.log('🔄 Resetting database...');

    await execAsync(`
      DELETE FROM AUDIT_LOG;
      DELETE FROM CLAIM;
      DELETE FROM ITEM_MATCH;
      DELETE FROM FOUND_ITEM;
      DELETE FROM LOST_REPORT;
    `);

    // Get user count
    const db = getDb();
    const result = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM ONLINE_USER', (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    console.log(`✅ Database reset complete!`);
    console.log(`📊 User accounts preserved: ${result.count}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error resetting database:', err);
    process.exit(1);
  }
}

resetDatabase();
