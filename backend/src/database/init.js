require('dotenv').config();
const { Pool, types } = require('pg');

// Return DATE columns as plain 'YYYY-MM-DD' strings instead of JS Date objects,
// so dates render cleanly (e.g. 2026-07-10) instead of a full ISO timestamp.
// 1082 is the OID for the DATE type. Date arithmetic is done in SQL, so no
// backend logic depends on these being Date objects.
types.setTypeParser(1082, (v) => v);

let _pool = null;

function getPool() {
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Supabase requires SSL; the pooler cert is not in the local trust store.
      ssl: process.env.PGSSL === 'disable' ? false : { rejectUnauthorized: false },
      max: Number(process.env.PG_POOL_MAX || 5),
      idleTimeoutMillis: 10000,
    });
  }
  return _pool;
}

// --- Dialect shim -----------------------------------------------------------

// Convert '?' placeholders to '$1,$2,...' (skipping any '?' inside a single-
// quoted string literal) and rewrite 'INSERT OR IGNORE' -> 'INSERT'. The
// ON CONFLICT clause is appended in runAsync().
function translate(sql) {
  let text = sql;
  let isIgnore = false;
  if (/^\s*INSERT\s+OR\s+IGNORE/i.test(text)) {
    isIgnore = true;
    text = text.replace(/^(\s*)INSERT\s+OR\s+IGNORE/i, '$1INSERT');
  }
  let out = '';
  let inStr = false;
  let n = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "'") { inStr = !inStr; out += ch; }
    else if (ch === '?' && !inStr) { out += '$' + (++n); }
    else { out += ch; }
  }
  return { text: out, isIgnore };
}

// --- Result-key remapper ----------------------------------------------------

// Column aliases introduced via `AS Xxx` in route/view SQL. Postgres returns
// these lowercased; restore the canonical casing the app reads. (Generated from
// `grep -rhoE "AS [A-Za-z_]+"` over the modules + schema.)
const ALIASES = [
  'Active_Reports','Actual_Load','Claimant_Name','Claimant_Username','Claimed_Items',
  'Closed_Reports','Count','Days_Stored','Days_Unclaimed','Found_Brand','Found_Category',
  'Found_Color','Found_Count','Found_Description','Found_Detail','Found_Item_Name',
  'Found_Location','Found_Name','Found_Photo','Found_Size','Lost_Brand','Lost_Color',
  'Lost_Count','Lost_Description','Lost_Detail','Lost_Item_Name','Lost_Location','Lost_Name',
  'Lost_Photo','Lost_Size','Matched_Items','Month','Pending_Claims','Pending_Matches',
  'Place_Name','Recovery_Rate_Percent','Reporter_Name','Reported_By_Username','Section_Type',
  'Staff_Name','Staff_Username','Storage_Location','Student_Username','Total',
  'Unclaimed_Items','Usage_Percent','Used','Verifier_Name','Verifier_First','Verifier_Last','cnt',
];

let _canonical = null;
// lowercase -> canonical map, built from schema column names + ALIASES.
function canonicalMap() {
  if (_canonical) return _canonical;
  const map = {};
  const add = (name) => { map[name.toLowerCase()] = name; };
  const colRe = /^\s*([A-Za-z][A-Za-z0-9]*(?:_[A-Za-z0-9]+)*)\s+(?:INTEGER|SERIAL|TEXT|REAL|NUMERIC|DATE|TIMESTAMP)\b/gm;
  let m;
  while ((m = colRe.exec(SCHEMA_SQL))) add(m[1]);
  ALIASES.forEach(add);
  _canonical = map;
  return map;
}

function remapRow(row) {
  if (!row) return row;
  const map = canonicalMap();
  const out = {};
  for (const key of Object.keys(row)) {
    const canon = map[key.toLowerCase()];
    if (!canon && process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
      console.warn(`[db] unmapped result column "${key}" — add it to ALIASES in init.js`);
    }
    out[canon || key] = row[key];
  }
  return out;
}

// --- Promisified helpers (same interface the modules already use) -----------

async function getAsync(sql, params = []) {
  const { text } = translate(sql);
  const res = await getPool().query(text, params);
  return res.rows[0] ? remapRow(res.rows[0]) : undefined;
}

async function allAsync(sql, params = []) {
  const { text } = translate(sql);
  const res = await getPool().query(text, params);
  return (res.rows || []).map(remapRow);
}

async function runAsync(sql, params = []) {
  const { text, isIgnore } = translate(sql);
  let finalText = text;
  if (/^\s*INSERT\s/i.test(finalText)) {
    if (isIgnore && !/ON\s+CONFLICT/i.test(finalText)) finalText += ' ON CONFLICT DO NOTHING';
    if (!/RETURNING/i.test(finalText)) finalText += ' RETURNING *';
  }
  const res = await getPool().query(finalText, params);
  const raw = res.rows && res.rows[0];
  // PK is the first column in every table, so its value is the insert id.
  const lastID = raw ? Object.values(raw)[0] : undefined;
  return { lastID, changes: res.rowCount, rows: (res.rows || []).map(remapRow) };
}

async function execAsync(sql) {
  // Multi-statement DDL with no parameters — run verbatim (no ? translation).
  await getPool().query(sql);
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS PERSON (
  Person_ID       SERIAL PRIMARY KEY,
  First_Name      TEXT NOT NULL,
  Middle_Name     TEXT,
  Last_Name       TEXT NOT NULL,
  Contact_Number  TEXT,
  Department      TEXT,
  Date_Created    DATE DEFAULT CURRENT_DATE NOT NULL
);
CREATE TABLE IF NOT EXISTS ONLINE_USER (
  User_ID         SERIAL PRIMARY KEY,
  Person_ID       INTEGER NOT NULL UNIQUE REFERENCES PERSON(Person_ID) ON DELETE CASCADE,
  Username        TEXT NOT NULL UNIQUE,
  Password_Hash   TEXT NOT NULL,
  Email           TEXT NOT NULL UNIQUE,
  Student_ID      TEXT UNIQUE,
  Role_Type       TEXT NOT NULL CHECK (Role_Type IN ('Student','Staff','Admin')),
  Date_Registered DATE DEFAULT CURRENT_DATE NOT NULL,
  Is_Active       TEXT DEFAULT 'Y' NOT NULL CHECK (Is_Active IN ('Y','N'))
);
CREATE TABLE IF NOT EXISTS LOCATION (
  Location_ID       SERIAL PRIMARY KEY,
  Place_Name        TEXT NOT NULL UNIQUE,
  Place_Description TEXT,
  Date_Created      DATE DEFAULT CURRENT_DATE NOT NULL
);
CREATE TABLE IF NOT EXISTS ITEM_CATEGORY (
  Category_ID          SERIAL PRIMARY KEY,
  Category_Name        TEXT NOT NULL UNIQUE CHECK (Category_Name IN (
    'Wallet','Phone','ID_Card','Keys','Umbrella','Bag','Clothing',
    'Laptop','Tablet','Documents','Jewelry','Eyewear',
    'Water_Bottle','Food_Container','Electronics_Accessories','Other'
  )),
  Category_Description TEXT,
  Date_Created         DATE DEFAULT CURRENT_DATE NOT NULL
);
CREATE TABLE IF NOT EXISTS STORAGE_SECTION (
  Section_ID   SERIAL PRIMARY KEY,
  Storage_Type TEXT NOT NULL CHECK (Storage_Type IN ('Locker','Office_Safe')),
  Section_Name TEXT NOT NULL UNIQUE,
  Capacity     INTEGER DEFAULT 20,
  Current_Load INTEGER DEFAULT 0,
  Date_Created DATE DEFAULT CURRENT_DATE NOT NULL
);
CREATE TABLE IF NOT EXISTS FOUND_ITEM (
  Item_ID             SERIAL PRIMARY KEY,
  Category_ID         INTEGER NOT NULL REFERENCES ITEM_CATEGORY(Category_ID),
  Location_ID         INTEGER NOT NULL REFERENCES LOCATION(Location_ID),
  Item_Name           TEXT NOT NULL,
  Item_Description    TEXT NOT NULL,
  Item_Color          TEXT NOT NULL,
  Item_Size           TEXT,
  Item_Brand          TEXT,
  Serial_Number       TEXT UNIQUE,
  Date_Found          DATE NOT NULL,
  Detail_Location     TEXT,
  Storage_Type        TEXT NOT NULL CHECK (Storage_Type IN ('Locker','Office_Safe')),
  Section_ID          INTEGER REFERENCES STORAGE_SECTION(Section_ID),
  Photo_Path          TEXT,
  Contact_Staff_ID    INTEGER NOT NULL REFERENCES ONLINE_USER(User_ID),
  Found_By_User_ID    INTEGER REFERENCES ONLINE_USER(User_ID),
  Found_By_Contact    TEXT,
  Reported_By_User_ID INTEGER NOT NULL REFERENCES ONLINE_USER(User_ID),
  Item_Status         TEXT DEFAULT 'Unclaimed' NOT NULL
    CHECK (Item_Status IN ('Unclaimed','Matched','Claimed','Disputed','Disposed')),
  Date_Created        DATE DEFAULT CURRENT_DATE NOT NULL,
  Date_Modified       DATE
);
CREATE TABLE IF NOT EXISTS LOST_REPORT (
  Report_ID           SERIAL PRIMARY KEY,
  User_ID             INTEGER NOT NULL REFERENCES ONLINE_USER(User_ID),
  Category_ID         INTEGER NOT NULL REFERENCES ITEM_CATEGORY(Category_ID),
  Location_ID         INTEGER NOT NULL REFERENCES LOCATION(Location_ID),
  Item_Name           TEXT NOT NULL,
  Item_Description    TEXT NOT NULL,
  Item_Color          TEXT NOT NULL,
  Item_Size           TEXT,
  Item_Brand          TEXT,
  Serial_Number       TEXT,
  Date_Lost           DATE NOT NULL,
  Detail_Location     TEXT,
  Contact_Information TEXT NOT NULL,
  Photo_Path          TEXT,
  Report_Status       TEXT DEFAULT 'Active' NOT NULL
    CHECK (Report_Status IN ('Active','Matched','Closed','Expired','Cancelled')),
  Date_Filed          DATE DEFAULT CURRENT_DATE NOT NULL,
  Date_Modified       DATE
);
CREATE TABLE IF NOT EXISTS ITEM_MATCH (
  Match_ID        SERIAL PRIMARY KEY,
  Item_ID         INTEGER NOT NULL REFERENCES FOUND_ITEM(Item_ID),
  Report_ID       INTEGER NOT NULL REFERENCES LOST_REPORT(Report_ID),
  Match_Score     REAL NOT NULL CHECK (Match_Score BETWEEN 0 AND 100),
  Score_Breakdown TEXT,
  Match_Status    TEXT DEFAULT 'Pending' NOT NULL
    CHECK (Match_Status IN ('Pending','Confirmed','Rejected','Disputed')),
  Match_Type      TEXT DEFAULT 'Auto' CHECK (Match_Type IN ('Auto','Manual')),
  Date_Created    DATE DEFAULT CURRENT_DATE NOT NULL,
  UNIQUE (Item_ID, Report_ID)
);
CREATE TABLE IF NOT EXISTS CLAIM (
  Claim_ID          SERIAL PRIMARY KEY,
  Item_ID           INTEGER NOT NULL REFERENCES FOUND_ITEM(Item_ID),
  Report_ID         INTEGER NOT NULL REFERENCES LOST_REPORT(Report_ID),
  User_ID           INTEGER NOT NULL REFERENCES ONLINE_USER(User_ID),
  Match_ID          INTEGER REFERENCES ITEM_MATCH(Match_ID),
  Claim_Status      TEXT DEFAULT 'Pending' NOT NULL
    CHECK (Claim_Status IN ('Pending','Approved','Rejected','Disputed')),
  Claim_Date        DATE DEFAULT CURRENT_DATE NOT NULL,
  Verified_By_ID    INTEGER REFERENCES ONLINE_USER(User_ID),
  Verification_Date DATE,
  Claim_Notes       TEXT,
  Is_Disputed       TEXT DEFAULT 'N' NOT NULL CHECK (Is_Disputed IN ('Y','N')),
  Dispute_Reason    TEXT,
  Released_Date     DATE,
  Acknowledged      TEXT DEFAULT 'N' NOT NULL CHECK (Acknowledged IN ('Y','N'))
);
CREATE TABLE IF NOT EXISTS AUDIT_LOG (
  Log_ID      SERIAL PRIMARY KEY,
  User_ID     INTEGER REFERENCES ONLINE_USER(User_ID),
  Action      TEXT NOT NULL,
  Entity_Type TEXT NOT NULL,
  Entity_ID   INTEGER,
  Old_Value   TEXT,
  New_Value   TEXT,
  IP_Address  TEXT,
  Timestamp   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS RATE_LIMIT (
  Key        TEXT PRIMARY KEY,
  Count      INTEGER NOT NULL,
  Expires_At TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS IDX_FOUND_STATUS   ON FOUND_ITEM(Item_Status);
CREATE INDEX IF NOT EXISTS IDX_FOUND_DATE     ON FOUND_ITEM(Date_Found);
CREATE INDEX IF NOT EXISTS IDX_FOUND_CATEGORY ON FOUND_ITEM(Category_ID);
CREATE INDEX IF NOT EXISTS IDX_FOUND_LOCATION ON FOUND_ITEM(Location_ID);
CREATE INDEX IF NOT EXISTS IDX_LOST_STATUS    ON LOST_REPORT(Report_Status);
CREATE INDEX IF NOT EXISTS IDX_LOST_DATE      ON LOST_REPORT(Date_Lost);
CREATE INDEX IF NOT EXISTS IDX_LOST_USER      ON LOST_REPORT(User_ID);
CREATE INDEX IF NOT EXISTS IDX_LOST_CATEGORY  ON LOST_REPORT(Category_ID);
CREATE INDEX IF NOT EXISTS IDX_MATCH_STATUS   ON ITEM_MATCH(Match_Status);
CREATE INDEX IF NOT EXISTS IDX_MATCH_SCORE    ON ITEM_MATCH(Match_Score);
CREATE INDEX IF NOT EXISTS IDX_CLAIM_STATUS   ON CLAIM(Claim_Status);
CREATE INDEX IF NOT EXISTS IDX_CLAIM_USER     ON CLAIM(User_ID);
CREATE OR REPLACE VIEW VW_EXPIRED_ITEMS AS
SELECT fi.Item_ID, fi.Item_Name, fi.Item_Color, ic.Category_Name,
       fi.Date_Found, fi.Item_Status,
       (CURRENT_DATE - fi.Date_Found) AS Days_Unclaimed,
       fi.Reported_By_User_ID, ou.Username AS Reported_By_Username,
       fi.Section_ID, ss.Section_Name AS Storage_Location
FROM   FOUND_ITEM fi
JOIN   ITEM_CATEGORY ic ON fi.Category_ID = ic.Category_ID
JOIN   ONLINE_USER ou ON fi.Reported_By_User_ID = ou.User_ID
LEFT JOIN STORAGE_SECTION ss ON fi.Section_ID = ss.Section_ID
WHERE  fi.Item_Status IN ('Unclaimed','Matched')
  AND  (CURRENT_DATE - fi.Date_Found) > 30;
CREATE OR REPLACE VIEW VW_ACTIVE_MATCHES AS
SELECT im.Match_ID, fi.Item_ID, fi.Item_Name AS Found_Item_Name,
       ic.Category_Name, fi.Item_Color AS Found_Color, lf.Place_Name AS Found_Location,
       lr.Report_ID, lr.Item_Name AS Lost_Item_Name, ll.Place_Name AS Lost_Location,
       u.Username AS Student_Username, p.First_Name, p.Last_Name,
       im.Match_Score, im.Score_Breakdown, im.Match_Status, im.Date_Created
FROM   ITEM_MATCH im
JOIN   FOUND_ITEM fi ON im.Item_ID = fi.Item_ID
JOIN   ITEM_CATEGORY ic ON fi.Category_ID = ic.Category_ID
JOIN   LOCATION lf ON fi.Location_ID = lf.Location_ID
JOIN   LOST_REPORT lr ON im.Report_ID = lr.Report_ID
JOIN   LOCATION ll ON lr.Location_ID = ll.Location_ID
JOIN   ONLINE_USER u ON lr.User_ID = u.User_ID
JOIN   PERSON p ON u.Person_ID = p.Person_ID
WHERE  im.Match_Status IN ('Pending','Confirmed');
CREATE OR REPLACE VIEW VW_DASHBOARD_STATS AS
SELECT
  (SELECT COUNT(*) FROM FOUND_ITEM  WHERE Item_Status='Unclaimed')  AS Unclaimed_Items,
  (SELECT COUNT(*) FROM FOUND_ITEM  WHERE Item_Status='Matched')    AS Matched_Items,
  (SELECT COUNT(*) FROM FOUND_ITEM  WHERE Item_Status='Claimed')    AS Claimed_Items,
  (SELECT COUNT(*) FROM LOST_REPORT WHERE Report_Status='Active')   AS Active_Reports,
  (SELECT COUNT(*) FROM LOST_REPORT WHERE Report_Status='Closed')   AS Closed_Reports,
  (SELECT COUNT(*) FROM ITEM_MATCH  WHERE Match_Status='Pending')   AS Pending_Matches,
  (SELECT COUNT(*) FROM CLAIM       WHERE Claim_Status='Pending')   AS Pending_Claims,
  ROUND(
    (SELECT COUNT(*) FROM LOST_REPORT WHERE Report_Status='Closed') * 100.0 /
    NULLIF((SELECT COUNT(*) FROM LOST_REPORT),0), 1
  ) AS Recovery_Rate_Percent,
  (SELECT COUNT(*) FROM LOST_REPORT)                                AS Total_Reports;
CREATE OR REPLACE FUNCTION trg_claim_approved() RETURNS trigger AS $func$
BEGIN
  UPDATE FOUND_ITEM  SET Item_Status='Claimed',  Date_Modified=CURRENT_DATE WHERE Item_ID=NEW.Item_ID;
  UPDATE LOST_REPORT SET Report_Status='Closed', Date_Modified=CURRENT_DATE WHERE Report_ID=NEW.Report_ID;
  UPDATE ITEM_MATCH  SET Match_Status='Confirmed'
    WHERE Item_ID=NEW.Item_ID AND Report_ID=NEW.Report_ID AND Match_Status='Pending';
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS TRG_CLAIM_APPROVED ON CLAIM;
CREATE TRIGGER TRG_CLAIM_APPROVED
  AFTER UPDATE OF Claim_Status ON CLAIM
  FOR EACH ROW WHEN (NEW.Claim_Status = 'Approved')
  EXECUTE FUNCTION trg_claim_approved();
CREATE OR REPLACE FUNCTION trg_set_found_modified() RETURNS trigger AS $func$
BEGIN NEW.Date_Modified = CURRENT_DATE; RETURN NEW; END;
$func$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS TRG_FOUND_ITEM_UPDATE ON FOUND_ITEM;
CREATE TRIGGER TRG_FOUND_ITEM_UPDATE BEFORE UPDATE ON FOUND_ITEM
  FOR EACH ROW EXECUTE FUNCTION trg_set_found_modified();
CREATE OR REPLACE FUNCTION trg_set_report_modified() RETURNS trigger AS $func$
BEGIN NEW.Date_Modified = CURRENT_DATE; RETURN NEW; END;
$func$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS TRG_LOST_REPORT_UPDATE ON LOST_REPORT;
CREATE TRIGGER TRG_LOST_REPORT_UPDATE BEFORE UPDATE ON LOST_REPORT
  FOR EACH ROW EXECUTE FUNCTION trg_set_report_modified();
`;

async function initializeDatabase() {
  await execAsync(SCHEMA_SQL);
}

module.exports = { getPool, initializeDatabase, runAsync, getAsync, allAsync, execAsync, translate, remapRow };
if (require.main === module) {
  initializeDatabase()
    .then(() => { console.log('✅ Schema applied to', process.env.DATABASE_URL); return getPool().end(); })
    .then(() => process.exit(0))
    .catch((e) => { console.error('❌ Schema init failed:', e.message); process.exit(1); });
}
