require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// ':memory:' is a special sqlite target and must not be run through
// path.resolve (which would turn it into an invalid on-disk path).
const DB_PATH = !process.env.DB_PATH
  ? path.join(__dirname, 'findit.db')
  : process.env.DB_PATH === ':memory:'
    ? ':memory:'
    : path.resolve(process.env.DB_PATH);

let _db = null;

function getDb() {
  if (!_db) {
    _db = new sqlite3.Database(DB_PATH);
    _db.configure('busyTimeout', 5000);
  }
  return _db;
}

function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

function execAsync(sql) {
  return new Promise((resolve, reject) => {
    getDb().exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function initializeDatabase() {
  const db = getDb();

  return new Promise((resolve, reject) => {
    db.serialize(async () => {
      try {
        await execAsync(`
          CREATE TABLE IF NOT EXISTS PERSON (
            Person_ID       INTEGER PRIMARY KEY AUTOINCREMENT,
            First_Name      TEXT NOT NULL,
            Middle_Name     TEXT,
            Last_Name       TEXT NOT NULL,
            Contact_Number  TEXT,
            Department      TEXT,
            Date_Created    DATE DEFAULT CURRENT_DATE NOT NULL
          );
          CREATE TABLE IF NOT EXISTS ONLINE_USER (
            User_ID         INTEGER PRIMARY KEY AUTOINCREMENT,
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
            Location_ID       INTEGER PRIMARY KEY AUTOINCREMENT,
            Place_Name        TEXT NOT NULL UNIQUE,
            Place_Description TEXT,
            Date_Created      DATE DEFAULT CURRENT_DATE NOT NULL
          );
          CREATE TABLE IF NOT EXISTS ITEM_CATEGORY (
            Category_ID          INTEGER PRIMARY KEY AUTOINCREMENT,
            Category_Name        TEXT NOT NULL UNIQUE CHECK (Category_Name IN (
              'Wallet','Phone','ID_Card','Keys','Umbrella','Bag','Clothing',
              'Laptop','Tablet','Documents','Jewelry','Eyewear',
              'Water_Bottle','Food_Container','Electronics_Accessories'
            )),
            Category_Description TEXT,
            Date_Created         DATE DEFAULT CURRENT_DATE NOT NULL
          );
          CREATE TABLE IF NOT EXISTS STORAGE_SECTION (
            Section_ID   INTEGER PRIMARY KEY AUTOINCREMENT,
            Storage_Type TEXT NOT NULL CHECK (Storage_Type IN ('Locker','Office_Safe')),
            Section_Name TEXT NOT NULL UNIQUE,
            Capacity     INTEGER DEFAULT 20,
            Current_Load INTEGER DEFAULT 0,
            Date_Created DATE DEFAULT CURRENT_DATE NOT NULL
          );
          CREATE TABLE IF NOT EXISTS FOUND_ITEM (
            Item_ID             INTEGER PRIMARY KEY AUTOINCREMENT,
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
            Report_ID           INTEGER PRIMARY KEY AUTOINCREMENT,
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
            Match_ID        INTEGER PRIMARY KEY AUTOINCREMENT,
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
            Claim_ID          INTEGER PRIMARY KEY AUTOINCREMENT,
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
            Log_ID      INTEGER PRIMARY KEY AUTOINCREMENT,
            User_ID     INTEGER REFERENCES ONLINE_USER(User_ID),
            Action      TEXT NOT NULL,
            Entity_Type TEXT NOT NULL,
            Entity_ID   INTEGER,
            Old_Value   TEXT,
            New_Value   TEXT,
            IP_Address  TEXT,
            Timestamp   DATETIME DEFAULT CURRENT_TIMESTAMP
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
          CREATE VIEW IF NOT EXISTS VW_EXPIRED_ITEMS AS
          SELECT fi.Item_ID, fi.Item_Name, fi.Item_Color, ic.Category_Name,
                 fi.Date_Found, fi.Item_Status,
                 CAST((julianday('now') - julianday(fi.Date_Found)) AS INTEGER) AS Days_Unclaimed,
                 fi.Reported_By_User_ID, ou.Username AS Reported_By_Username,
                 fi.Section_ID, ss.Section_Name AS Storage_Location
          FROM   FOUND_ITEM fi
          JOIN   ITEM_CATEGORY ic ON fi.Category_ID = ic.Category_ID
          JOIN   ONLINE_USER ou ON fi.Reported_By_User_ID = ou.User_ID
          LEFT JOIN STORAGE_SECTION ss ON fi.Section_ID = ss.Section_ID
          WHERE  fi.Item_Status IN ('Unclaimed','Matched')
            AND  CAST((julianday('now') - julianday(fi.Date_Found)) AS INTEGER) > 30;
          CREATE VIEW IF NOT EXISTS VW_ACTIVE_MATCHES AS
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
          CREATE VIEW IF NOT EXISTS VW_DASHBOARD_STATS AS
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
            ) AS Recovery_Rate_Percent;
          CREATE TRIGGER IF NOT EXISTS TRG_CLAIM_APPROVED
          AFTER UPDATE OF Claim_Status ON CLAIM FOR EACH ROW
          WHEN NEW.Claim_Status = 'Approved'
          BEGIN
            UPDATE FOUND_ITEM  SET Item_Status='Claimed',  Date_Modified=CURRENT_DATE WHERE Item_ID=NEW.Item_ID;
            UPDATE LOST_REPORT SET Report_Status='Closed', Date_Modified=CURRENT_DATE WHERE Report_ID=NEW.Report_ID;
            UPDATE ITEM_MATCH  SET Match_Status='Confirmed'
              WHERE Item_ID=NEW.Item_ID AND Report_ID=NEW.Report_ID AND Match_Status='Pending';
          END;
          CREATE TRIGGER IF NOT EXISTS TRG_FOUND_ITEM_UPDATE
          AFTER UPDATE ON FOUND_ITEM FOR EACH ROW
          BEGIN
            UPDATE FOUND_ITEM SET Date_Modified=CURRENT_DATE WHERE Item_ID=NEW.Item_ID;
          END;
          CREATE TRIGGER IF NOT EXISTS TRG_LOST_REPORT_UPDATE
          AFTER UPDATE ON LOST_REPORT FOR EACH ROW
          BEGIN
            UPDATE LOST_REPORT SET Date_Modified=CURRENT_DATE WHERE Report_ID=NEW.Report_ID;
          END;
        `);
        console.log('✅ Database initialized:', DB_PATH);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  });
}

module.exports = { getDb, initializeDatabase, runAsync, getAsync, allAsync, execAsync };
if (require.main === module) {
  initializeDatabase().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
