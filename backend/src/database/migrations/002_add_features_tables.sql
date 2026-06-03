-- Migration 002: Add tables for Phase 2.4 features
-- Notifications, Favorites, Messages, Timeline

-- ============================================================
-- 1. NOTIFICATIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS NOTIFICATION (
  Notification_ID       INTEGER PRIMARY KEY AUTOINCREMENT,
  User_ID               INTEGER NOT NULL REFERENCES ONLINE_USER(User_ID) ON DELETE CASCADE,
  Type                  TEXT NOT NULL CHECK (Type IN (
    'MATCH_FOUND', 'MATCH_CONFIRMED', 'MATCH_REJECTED',
    'CLAIM_FILED', 'CLAIM_APPROVED', 'CLAIM_REJECTED',
    'NEW_MESSAGE', 'SYSTEM_ALERT', 'STATUS_CHANGED'
  )),
  Title                 TEXT NOT NULL,
  Message               TEXT NOT NULL,
  Data                  TEXT,  -- JSON
  Is_Read               TEXT DEFAULT 'N' NOT NULL CHECK (Is_Read IN ('Y','N')),
  Date_Created          DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  Date_Read             DATETIME
);

CREATE INDEX IF NOT EXISTS IDX_NOTIFICATION_USER ON NOTIFICATION(User_ID);
CREATE INDEX IF NOT EXISTS IDX_NOTIFICATION_UNREAD ON NOTIFICATION(User_ID, Is_Read);

-- ============================================================
-- 2. USER FAVORITES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS USER_FAVORITES (
  Favorite_ID           INTEGER PRIMARY KEY AUTOINCREMENT,
  User_ID               INTEGER NOT NULL REFERENCES ONLINE_USER(User_ID) ON DELETE CASCADE,
  Item_ID               INTEGER NOT NULL,
  Item_Type             TEXT NOT NULL CHECK (Item_Type IN ('found_item', 'lost_report')),
  Date_Added            DATE DEFAULT CURRENT_DATE NOT NULL,
  UNIQUE (User_ID, Item_ID, Item_Type)
);

CREATE INDEX IF NOT EXISTS IDX_FAVORITE_USER ON USER_FAVORITES(User_ID);
CREATE INDEX IF NOT EXISTS IDX_FAVORITE_ITEM ON USER_FAVORITES(Item_ID, Item_Type);

-- ============================================================
-- 3. USER MESSAGES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS USER_MESSAGES (
  Message_ID            INTEGER PRIMARY KEY AUTOINCREMENT,
  Sender_ID             INTEGER NOT NULL REFERENCES ONLINE_USER(User_ID) ON DELETE CASCADE,
  Recipient_ID          INTEGER NOT NULL REFERENCES ONLINE_USER(User_ID) ON DELETE CASCADE,
  Message_Content       TEXT NOT NULL,
  Related_Item_ID       INTEGER,
  Related_Type          TEXT CHECK (Related_Type IN ('found_item', 'lost_report', 'match', 'claim')),
  Is_Read               TEXT DEFAULT 'N' NOT NULL CHECK (Is_Read IN ('Y','N')),
  Date_Sent             DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  Date_Read             DATETIME
);

CREATE INDEX IF NOT EXISTS IDX_MESSAGE_SENDER ON USER_MESSAGES(Sender_ID);
CREATE INDEX IF NOT EXISTS IDX_MESSAGE_RECIPIENT ON USER_MESSAGES(Recipient_ID);
CREATE INDEX IF NOT EXISTS IDX_MESSAGE_UNREAD ON USER_MESSAGES(Recipient_ID, Is_Read);
CREATE INDEX IF NOT EXISTS IDX_MESSAGE_CONVERSATION ON USER_MESSAGES(Sender_ID, Recipient_ID);

-- ============================================================
-- 4. TIMELINE/ACTIVITY TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS TIMELINE_EVENTS (
  Event_ID              INTEGER PRIMARY KEY AUTOINCREMENT,
  Item_ID               INTEGER REFERENCES FOUND_ITEM(Item_ID) ON DELETE CASCADE,
  Report_ID             INTEGER REFERENCES LOST_REPORT(Report_ID) ON DELETE CASCADE,
  User_ID               INTEGER REFERENCES ONLINE_USER(User_ID) ON DELETE SET NULL,
  Event_Type            TEXT NOT NULL CHECK (Event_Type IN (
    'item_registered', 'report_filed', 'match_found',
    'match_confirmed', 'match_rejected', 'claim_filed',
    'claim_approved', 'claim_rejected', 'status_changed',
    'message_sent', 'item_transferred'
  )),
  Event_Title           TEXT NOT NULL,
  Event_Description     TEXT,
  Metadata              TEXT,  -- JSON for additional data
  Event_Date            DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS IDX_TIMELINE_ITEM ON TIMELINE_EVENTS(Item_ID);
CREATE INDEX IF NOT EXISTS IDX_TIMELINE_REPORT ON TIMELINE_EVENTS(Report_ID);
CREATE INDEX IF NOT EXISTS IDX_TIMELINE_USER ON TIMELINE_EVENTS(User_ID);
CREATE INDEX IF NOT EXISTS IDX_TIMELINE_DATE ON TIMELINE_EVENTS(Event_Date DESC);
CREATE INDEX IF NOT EXISTS IDX_TIMELINE_TYPE ON TIMELINE_EVENTS(Event_Type);

-- ============================================================
-- 5. ANALYTICS TABLE (for tracking user engagement)
-- ============================================================

CREATE TABLE IF NOT EXISTS USER_ANALYTICS (
  Analytics_ID          INTEGER PRIMARY KEY AUTOINCREMENT,
  User_ID               INTEGER NOT NULL REFERENCES ONLINE_USER(User_ID) ON DELETE CASCADE,
  Event_Type            TEXT NOT NULL,
  Event_Date            DATE DEFAULT CURRENT_DATE NOT NULL,
  Count                 INTEGER DEFAULT 1,
  UNIQUE (User_ID, Event_Type, Event_Date)
);

CREATE INDEX IF NOT EXISTS IDX_ANALYTICS_USER ON USER_ANALYTICS(User_ID);
CREATE INDEX IF NOT EXISTS IDX_ANALYTICS_DATE ON USER_ANALYTICS(Event_Date);

-- ============================================================
-- 6. VIEWS FOR COMMON QUERIES
-- ============================================================

CREATE VIEW IF NOT EXISTS VW_USER_UNREAD_MESSAGES AS
  SELECT
    User_ID,
    COUNT(*) AS Unread_Count
  FROM USER_MESSAGES
  WHERE Is_Read = 'N' AND Recipient_ID = User_ID
  GROUP BY User_ID;

CREATE VIEW IF NOT EXISTS VW_RECENT_TIMELINE AS
  SELECT
    te.*,
    u.Username,
    p.First_Name || ' ' || p.Last_Name AS User_Name,
    fi.Item_Name AS Found_Item_Name,
    lr.Item_Name AS Lost_Item_Name
  FROM TIMELINE_EVENTS te
  LEFT JOIN ONLINE_USER u ON te.User_ID = u.User_ID
  LEFT JOIN PERSON p ON u.Person_ID = p.Person_ID
  LEFT JOIN FOUND_ITEM fi ON te.Item_ID = fi.Item_ID
  LEFT JOIN LOST_REPORT lr ON te.Report_ID = lr.Report_ID
  WHERE te.Event_Date >= datetime('now', '-30 days')
  ORDER BY te.Event_Date DESC;

-- ============================================================
-- 7. TRIGGERS FOR AUTOMATIC TIMELINE CREATION
-- ============================================================

CREATE TRIGGER IF NOT EXISTS TRG_ITEM_REGISTERED
AFTER INSERT ON FOUND_ITEM
FOR EACH ROW
BEGIN
  INSERT INTO TIMELINE_EVENTS (Item_ID, User_ID, Event_Type, Event_Title, Event_Description)
  VALUES (
    NEW.Item_ID,
    NEW.Contact_Staff_ID,
    'item_registered',
    'Item Registered',
    'Found item "' || NEW.Item_Name || '" has been registered'
  );
END;

CREATE TRIGGER IF NOT EXISTS TRG_REPORT_FILED
AFTER INSERT ON LOST_REPORT
FOR EACH ROW
BEGIN
  INSERT INTO TIMELINE_EVENTS (Report_ID, User_ID, Event_Type, Event_Title, Event_Description)
  VALUES (
    NEW.Report_ID,
    NEW.User_ID,
    'report_filed',
    'Report Filed',
    'Lost report for "' || NEW.Item_Name || '" has been filed'
  );
END;

CREATE TRIGGER IF NOT EXISTS TRG_MATCH_CREATED
AFTER INSERT ON ITEM_MATCH
FOR EACH ROW
BEGIN
  INSERT INTO TIMELINE_EVENTS (Item_ID, Report_ID, Event_Type, Event_Title, Event_Description)
  VALUES (
    NEW.Item_ID,
    NEW.Report_ID,
    'match_found',
    'Match Found',
    'A potential match has been identified'
  );
END;

-- ============================================================
-- 8. NOTIFICATIONS PREFERENCES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS NOTIFICATION_PREFERENCES (
  Preference_ID         INTEGER PRIMARY KEY AUTOINCREMENT,
  User_ID               INTEGER NOT NULL UNIQUE REFERENCES ONLINE_USER(User_ID) ON DELETE CASCADE,
  Email_On_Match        TEXT DEFAULT 'Y' CHECK (Email_On_Match IN ('Y','N')),
  Email_On_Claim        TEXT DEFAULT 'Y' CHECK (Email_On_Claim IN ('Y','N')),
  Email_On_Message      TEXT DEFAULT 'Y' CHECK (Email_On_Message IN ('Y','N')),
  Push_Notifications    TEXT DEFAULT 'Y' CHECK (Push_Notifications IN ('Y','N')),
  Notification_Frequency TEXT DEFAULT 'IMMEDIATE' CHECK (Notification_Frequency IN ('IMMEDIATE', 'DAILY_DIGEST', 'WEEKLY_DIGEST')),
  Date_Updated          DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 9. FINAL MAINTENANCE
-- ============================================================

ANALYZE;
VACUUM;
