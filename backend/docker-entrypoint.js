// Container startup: wait for Postgres, apply the schema, seed demo data on
// first boot only, then start the API. A Node script (not shell) so Windows
// checkouts with CRLF line endings can't break the container.
const { execFileSync } = require('child_process');
const { initializeDatabase, getAsync, getPool } = require('./src/database/init');

async function waitForDb(retries = 30, delayMs = 2000) {
  for (let i = 1; i <= retries; i++) {
    try {
      await getPool().query('SELECT 1');
      return;
    } catch {
      console.log(`Waiting for database (${i}/${retries})...`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error('Database never became reachable');
}

(async () => {
  await waitForDb();
  await initializeDatabase();

  const row = await getAsync('SELECT COUNT(*) AS cnt FROM ONLINE_USER', []);
  if (Number(row.cnt) === 0) {
    console.log('Empty database detected - seeding demo data...');
    // seed.js self-executes and calls process.exit, so it must run as its own
    // process; it also re-inserts sample rows every run, hence the empty check.
    execFileSync('node', ['src/database/seed.js'], { stdio: 'inherit' });
  } else {
    console.log('Existing data found - skipping seed.');
  }

  // server.js only listens when run directly; here it's required, so bind the
  // exported app ourselves.
  const app = require('./src/server.js');
  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`FindIT API listening on port ${port}`));
})().catch((e) => {
  console.error('Startup failed:', e.message);
  process.exit(1);
});
