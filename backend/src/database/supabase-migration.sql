-- FindIT Supabase PostgreSQL Migration
-- Complete schema for production deployment

-- ============================================================
-- 1. PERSON TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS person (
  person_id BIGSERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  contact_number TEXT,
  department TEXT,
  date_created DATE DEFAULT CURRENT_DATE NOT NULL
);

-- ============================================================
-- 2. ONLINE_USER TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS online_user (
  user_id BIGSERIAL PRIMARY KEY,
  person_id BIGINT NOT NULL UNIQUE REFERENCES person(person_id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  student_id TEXT UNIQUE,
  role_type TEXT NOT NULL CHECK (role_type IN ('Student','Staff','Admin')),
  date_registered DATE DEFAULT CURRENT_DATE NOT NULL,
  is_active TEXT DEFAULT 'Y' NOT NULL CHECK (is_active IN ('Y','N'))
);

-- ============================================================
-- 3. LOCATION TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS location (
  location_id BIGSERIAL PRIMARY KEY,
  place_name TEXT NOT NULL UNIQUE,
  place_description TEXT,
  date_created DATE DEFAULT CURRENT_DATE NOT NULL
);

-- ============================================================
-- 4. ITEM_CATEGORY TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS item_category (
  category_id BIGSERIAL PRIMARY KEY,
  category_name TEXT NOT NULL UNIQUE CHECK (category_name IN (
    'Wallet','Phone','ID_Card','Keys','Umbrella','Bag','Clothing',
    'Laptop','Tablet','Documents','Jewelry','Eyewear',
    'Water_Bottle','Food_Container','Electronics_Accessories'
  )),
  category_description TEXT,
  date_created DATE DEFAULT CURRENT_DATE NOT NULL
);

-- ============================================================
-- 5. STORAGE_SECTION TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS storage_section (
  section_id BIGSERIAL PRIMARY KEY,
  storage_type TEXT NOT NULL CHECK (storage_type IN ('Locker','Office_Safe')),
  section_name TEXT NOT NULL UNIQUE,
  capacity INTEGER DEFAULT 20,
  current_load INTEGER DEFAULT 0,
  date_created DATE DEFAULT CURRENT_DATE NOT NULL
);

-- ============================================================
-- 6. FOUND_ITEM TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS found_item (
  item_id BIGSERIAL PRIMARY KEY,
  category_id BIGINT NOT NULL REFERENCES item_category(category_id),
  location_id BIGINT NOT NULL REFERENCES location(location_id),
  item_name TEXT NOT NULL,
  item_description TEXT NOT NULL,
  item_color TEXT NOT NULL,
  item_size TEXT,
  item_brand TEXT,
  serial_number TEXT UNIQUE,
  date_found DATE NOT NULL,
  detail_location TEXT,
  storage_type TEXT NOT NULL CHECK (storage_type IN ('Locker','Office_Safe')),
  section_id BIGINT REFERENCES storage_section(section_id),
  photo_path TEXT,
  contact_staff_id BIGINT NOT NULL REFERENCES online_user(user_id),
  found_by_user_id BIGINT REFERENCES online_user(user_id),
  found_by_contact TEXT,
  reported_by_user_id BIGINT NOT NULL REFERENCES online_user(user_id),
  item_status TEXT DEFAULT 'Unclaimed' NOT NULL CHECK (item_status IN ('Unclaimed','Matched','Claimed','Disputed','Disposed')),
  date_created DATE DEFAULT CURRENT_DATE NOT NULL,
  date_modified DATE
);

-- ============================================================
-- 7. LOST_REPORT TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS lost_report (
  report_id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES online_user(user_id),
  category_id BIGINT NOT NULL REFERENCES item_category(category_id),
  location_id BIGINT NOT NULL REFERENCES location(location_id),
  item_name TEXT NOT NULL,
  item_description TEXT NOT NULL,
  item_color TEXT NOT NULL,
  item_size TEXT,
  item_brand TEXT,
  serial_number TEXT,
  date_lost DATE NOT NULL,
  detail_location TEXT,
  contact_information TEXT NOT NULL,
  photo_path TEXT,
  report_status TEXT DEFAULT 'Active' NOT NULL CHECK (report_status IN ('Active','Matched','Closed','Expired','Cancelled')),
  date_filed DATE DEFAULT CURRENT_DATE NOT NULL,
  date_modified DATE
);

-- ============================================================
-- 8. ITEM_MATCH TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS item_match (
  match_id BIGSERIAL PRIMARY KEY,
  item_id BIGINT NOT NULL REFERENCES found_item(item_id),
  report_id BIGINT NOT NULL REFERENCES lost_report(report_id),
  match_score REAL NOT NULL CHECK (match_score BETWEEN 0 AND 100),
  score_breakdown TEXT,
  match_status TEXT DEFAULT 'Pending' NOT NULL CHECK (match_status IN ('Pending','Confirmed','Rejected','Disputed')),
  match_type TEXT DEFAULT 'Auto' CHECK (match_type IN ('Auto','Manual')),
  date_created DATE DEFAULT CURRENT_DATE NOT NULL,
  UNIQUE (item_id, report_id)
);

-- ============================================================
-- 9. CLAIM TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS claim (
  claim_id BIGSERIAL PRIMARY KEY,
  item_id BIGINT NOT NULL REFERENCES found_item(item_id),
  report_id BIGINT NOT NULL REFERENCES lost_report(report_id),
  user_id BIGINT NOT NULL REFERENCES online_user(user_id),
  match_id BIGINT REFERENCES item_match(match_id),
  claim_status TEXT DEFAULT 'Pending' NOT NULL CHECK (claim_status IN ('Pending','Approved','Rejected','Disputed')),
  claim_date DATE DEFAULT CURRENT_DATE NOT NULL,
  verified_by_id BIGINT REFERENCES online_user(user_id),
  verification_date DATE,
  claim_notes TEXT,
  is_disputed TEXT DEFAULT 'N' NOT NULL CHECK (is_disputed IN ('Y','N')),
  dispute_reason TEXT,
  released_date DATE,
  acknowledged TEXT DEFAULT 'N' NOT NULL CHECK (acknowledged IN ('Y','N'))
);

-- ============================================================
-- 10. AUDIT_LOG TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_log (
  log_id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES online_user(user_id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id BIGINT,
  old_value TEXT,
  new_value TEXT,
  ip_address TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 11. NOTIFICATION TABLE (Phase 2.4)
-- ============================================================

CREATE TABLE IF NOT EXISTS notification (
  notification_id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES online_user(user_id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'MATCH_FOUND', 'MATCH_CONFIRMED', 'MATCH_REJECTED',
    'CLAIM_FILED', 'CLAIM_APPROVED', 'CLAIM_REJECTED',
    'NEW_MESSAGE', 'SYSTEM_ALERT', 'STATUS_CHANGED'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data TEXT,
  is_read TEXT DEFAULT 'N' NOT NULL CHECK (is_read IN ('Y','N')),
  date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  date_read TIMESTAMP
);

-- ============================================================
-- 12. USER_FAVORITES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS user_favorites (
  favorite_id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES online_user(user_id) ON DELETE CASCADE,
  item_id BIGINT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('found_item', 'lost_report')),
  date_added DATE DEFAULT CURRENT_DATE NOT NULL,
  UNIQUE (user_id, item_id, item_type)
);

-- ============================================================
-- 13. USER_MESSAGES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS user_messages (
  message_id BIGSERIAL PRIMARY KEY,
  sender_id BIGINT NOT NULL REFERENCES online_user(user_id) ON DELETE CASCADE,
  recipient_id BIGINT NOT NULL REFERENCES online_user(user_id) ON DELETE CASCADE,
  message_content TEXT NOT NULL,
  related_item_id BIGINT,
  related_type TEXT CHECK (related_type IN ('found_item', 'lost_report', 'match', 'claim')),
  is_read TEXT DEFAULT 'N' NOT NULL CHECK (is_read IN ('Y','N')),
  date_sent TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  date_read TIMESTAMP
);

-- ============================================================
-- 14. TIMELINE_EVENTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS timeline_events (
  event_id BIGSERIAL PRIMARY KEY,
  item_id BIGINT REFERENCES found_item(item_id) ON DELETE CASCADE,
  report_id BIGINT REFERENCES lost_report(report_id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES online_user(user_id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'item_registered', 'report_filed', 'match_found',
    'match_confirmed', 'match_rejected', 'claim_filed',
    'claim_approved', 'claim_rejected', 'status_changed',
    'message_sent', 'item_transferred'
  )),
  event_title TEXT NOT NULL,
  event_description TEXT,
  metadata TEXT,
  event_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================================
-- 15. USER_ANALYTICS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS user_analytics (
  analytics_id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES online_user(user_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_date DATE DEFAULT CURRENT_DATE NOT NULL,
  count INTEGER DEFAULT 1,
  UNIQUE (user_id, event_type, event_date)
);

-- ============================================================
-- 16. NOTIFICATION_PREFERENCES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  preference_id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE REFERENCES online_user(user_id) ON DELETE CASCADE,
  email_on_match TEXT DEFAULT 'Y' CHECK (email_on_match IN ('Y','N')),
  email_on_claim TEXT DEFAULT 'Y' CHECK (email_on_claim IN ('Y','N')),
  email_on_message TEXT DEFAULT 'Y' CHECK (email_on_message IN ('Y','N')),
  push_notifications TEXT DEFAULT 'Y' CHECK (push_notifications IN ('Y','N')),
  notification_frequency TEXT DEFAULT 'IMMEDIATE' CHECK (notification_frequency IN ('IMMEDIATE', 'DAILY_DIGEST', 'WEEKLY_DIGEST')),
  date_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 17. INDEXES FOR PERFORMANCE
-- ============================================================

-- Found Items Indexes
CREATE INDEX IF NOT EXISTS idx_found_status ON found_item(item_status);
CREATE INDEX IF NOT EXISTS idx_found_date ON found_item(date_found);
CREATE INDEX IF NOT EXISTS idx_found_category ON found_item(category_id);
CREATE INDEX IF NOT EXISTS idx_found_location ON found_item(location_id);
CREATE INDEX IF NOT EXISTS idx_found_status_date ON found_item(item_status, date_found DESC);
CREATE INDEX IF NOT EXISTS idx_found_category_fk ON found_item(category_id);
CREATE INDEX IF NOT EXISTS idx_found_location_fk ON found_item(location_id);
CREATE INDEX IF NOT EXISTS idx_found_section_fk ON found_item(section_id);
CREATE INDEX IF NOT EXISTS idx_found_staff_fk ON found_item(contact_staff_id);

-- Lost Reports Indexes
CREATE INDEX IF NOT EXISTS idx_lost_status ON lost_report(report_status);
CREATE INDEX IF NOT EXISTS idx_lost_date ON lost_report(date_lost);
CREATE INDEX IF NOT EXISTS idx_lost_user ON lost_report(user_id);
CREATE INDEX IF NOT EXISTS idx_lost_category ON lost_report(category_id);
CREATE INDEX IF NOT EXISTS idx_lost_status_date ON lost_report(report_status, date_lost DESC);
CREATE INDEX IF NOT EXISTS idx_lost_user_status ON lost_report(user_id, report_status);
CREATE INDEX IF NOT EXISTS idx_lost_user_fk ON lost_report(user_id);
CREATE INDEX IF NOT EXISTS idx_lost_category_fk ON lost_report(category_id);
CREATE INDEX IF NOT EXISTS idx_lost_location_fk ON lost_report(location_id);

-- Matching Indexes
CREATE INDEX IF NOT EXISTS idx_match_status ON item_match(match_status);
CREATE INDEX IF NOT EXISTS idx_match_score ON item_match(match_score);
CREATE INDEX IF NOT EXISTS idx_match_item_report ON item_match(item_id, report_id);
CREATE INDEX IF NOT EXISTS idx_match_status_score ON item_match(match_status, match_score DESC);
CREATE INDEX IF NOT EXISTS idx_match_item_fk ON item_match(item_id);
CREATE INDEX IF NOT EXISTS idx_match_report_fk ON item_match(report_id);

-- Claim Indexes
CREATE INDEX IF NOT EXISTS idx_claim_status ON claim(claim_status);
CREATE INDEX IF NOT EXISTS idx_claim_user ON claim(user_id);
CREATE INDEX IF NOT EXISTS idx_claim_item_report ON claim(item_id, report_id);
CREATE INDEX IF NOT EXISTS idx_claim_user_status ON claim(user_id, claim_status);
CREATE INDEX IF NOT EXISTS idx_claim_item_fk ON claim(item_id);
CREATE INDEX IF NOT EXISTS idx_claim_report_fk ON claim(report_id);
CREATE INDEX IF NOT EXISTS idx_claim_user_fk ON claim(user_id);

-- User Indexes
CREATE INDEX IF NOT EXISTS idx_user_username ON online_user(username);
CREATE INDEX IF NOT EXISTS idx_user_email ON online_user(email);

-- Category/Location Indexes
CREATE INDEX IF NOT EXISTS idx_category_name ON item_category(category_name);
CREATE INDEX IF NOT EXISTS idx_location_name ON location(place_name);

-- Notification Indexes
CREATE INDEX IF NOT EXISTS idx_notification_user ON notification(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_unread ON notification(user_id, is_read);

-- Message Indexes
CREATE INDEX IF NOT EXISTS idx_message_sender ON user_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_message_recipient ON user_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_message_unread ON user_messages(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_message_conversation ON user_messages(sender_id, recipient_id);

-- Favorites Indexes
CREATE INDEX IF NOT EXISTS idx_favorite_user ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_item ON user_favorites(item_id, item_type);

-- Timeline Indexes
CREATE INDEX IF NOT EXISTS idx_timeline_item ON timeline_events(item_id);
CREATE INDEX IF NOT EXISTS idx_timeline_report ON timeline_events(report_id);
CREATE INDEX IF NOT EXISTS idx_timeline_user ON timeline_events(user_id);
CREATE INDEX IF NOT EXISTS idx_timeline_date ON timeline_events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_type ON timeline_events(event_type);

-- Analytics Indexes
CREATE INDEX IF NOT EXISTS idx_analytics_user ON user_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON user_analytics(event_date);

-- ============================================================
-- 18. VIEWS FOR COMMON QUERIES
-- ============================================================

CREATE VIEW IF NOT EXISTS vw_expired_items AS
SELECT
  fi.item_id,
  fi.item_name,
  fi.item_color,
  ic.category_name,
  fi.date_found,
  fi.item_status,
  EXTRACT(DAY FROM CURRENT_DATE - fi.date_found)::INTEGER AS days_unclaimed,
  fi.reported_by_user_id,
  ou.username AS reported_by_username,
  fi.section_id,
  ss.section_name AS storage_location
FROM found_item fi
JOIN item_category ic ON fi.category_id = ic.category_id
JOIN online_user ou ON fi.reported_by_user_id = ou.user_id
LEFT JOIN storage_section ss ON fi.section_id = ss.section_id
WHERE fi.item_status IN ('Unclaimed','Matched')
  AND EXTRACT(DAY FROM CURRENT_DATE - fi.date_found) > 30;

CREATE VIEW IF NOT EXISTS vw_active_matches AS
SELECT
  im.match_id,
  fi.item_id,
  fi.item_name AS found_item_name,
  ic.category_name,
  fi.item_color AS found_color,
  lf.place_name AS found_location,
  lr.report_id,
  lr.item_name AS lost_item_name,
  ll.place_name AS lost_location,
  u.username AS student_username,
  p.first_name,
  p.last_name,
  im.match_score,
  im.score_breakdown,
  im.match_status,
  im.date_created
FROM item_match im
JOIN found_item fi ON im.item_id = fi.item_id
JOIN item_category ic ON fi.category_id = ic.category_id
JOIN location lf ON fi.location_id = lf.location_id
JOIN lost_report lr ON im.report_id = lr.report_id
JOIN location ll ON lr.location_id = ll.location_id
JOIN online_user u ON lr.user_id = u.user_id
JOIN person p ON u.person_id = p.person_id
WHERE im.match_status IN ('Pending','Confirmed');

CREATE VIEW IF NOT EXISTS vw_dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM found_item WHERE item_status='Unclaimed') AS unclaimed_items,
  (SELECT COUNT(*) FROM found_item WHERE item_status='Matched') AS matched_items,
  (SELECT COUNT(*) FROM found_item WHERE item_status='Claimed') AS claimed_items,
  (SELECT COUNT(*) FROM lost_report WHERE report_status='Active') AS active_reports,
  (SELECT COUNT(*) FROM lost_report WHERE report_status='Closed') AS closed_reports,
  (SELECT COUNT(*) FROM item_match WHERE match_status='Pending') AS pending_matches,
  (SELECT COUNT(*) FROM claim WHERE claim_status='Pending') AS pending_claims,
  ROUND(
    (SELECT COUNT(*) FROM lost_report WHERE report_status='Closed')::NUMERIC * 100.0 /
    NULLIF((SELECT COUNT(*) FROM lost_report),0), 1
  ) AS recovery_rate_percent;

CREATE VIEW IF NOT EXISTS vw_user_unread_messages AS
SELECT
  user_id,
  COUNT(*) AS unread_count
FROM user_messages
WHERE is_read = 'N' AND recipient_id = user_id
GROUP BY user_id;

CREATE VIEW IF NOT EXISTS vw_recent_timeline AS
SELECT
  te.*,
  u.username,
  p.first_name || ' ' || p.last_name AS user_name,
  fi.item_name AS found_item_name,
  lr.item_name AS lost_item_name
FROM timeline_events te
LEFT JOIN online_user u ON te.user_id = u.user_id
LEFT JOIN person p ON u.person_id = p.person_id
LEFT JOIN found_item fi ON te.item_id = fi.item_id
LEFT JOIN lost_report lr ON te.report_id = lr.report_id
WHERE te.event_date >= NOW() - INTERVAL '30 days'
ORDER BY te.event_date DESC;

-- ============================================================
-- 19. TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================

CREATE OR REPLACE FUNCTION claim_approved_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.claim_status = 'Approved' THEN
    UPDATE found_item SET item_status='Claimed', date_modified=CURRENT_DATE WHERE item_id=NEW.item_id;
    UPDATE lost_report SET report_status='Closed', date_modified=CURRENT_DATE WHERE report_id=NEW.report_id;
    UPDATE item_match SET match_status='Confirmed'
      WHERE item_id=NEW.item_id AND report_id=NEW.report_id AND match_status='Pending';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_claim_approved
AFTER UPDATE OF claim_status ON claim
FOR EACH ROW
EXECUTE FUNCTION claim_approved_trigger();

CREATE OR REPLACE FUNCTION found_item_update_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.date_modified = CURRENT_DATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_found_item_update
BEFORE UPDATE ON found_item
FOR EACH ROW
EXECUTE FUNCTION found_item_update_trigger();

CREATE OR REPLACE FUNCTION lost_report_update_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.date_modified = CURRENT_DATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lost_report_update
BEFORE UPDATE ON lost_report
FOR EACH ROW
EXECUTE FUNCTION lost_report_update_trigger();

CREATE OR REPLACE FUNCTION item_registered_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO timeline_events (item_id, user_id, event_type, event_title, event_description)
  VALUES (
    NEW.item_id,
    NEW.contact_staff_id,
    'item_registered',
    'Item Registered',
    'Found item "' || NEW.item_name || '" has been registered'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_item_registered
AFTER INSERT ON found_item
FOR EACH ROW
EXECUTE FUNCTION item_registered_trigger();

CREATE OR REPLACE FUNCTION report_filed_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO timeline_events (report_id, user_id, event_type, event_title, event_description)
  VALUES (
    NEW.report_id,
    NEW.user_id,
    'report_filed',
    'Report Filed',
    'Lost report for "' || NEW.item_name || '" has been filed'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_report_filed
AFTER INSERT ON lost_report
FOR EACH ROW
EXECUTE FUNCTION report_filed_trigger();

CREATE OR REPLACE FUNCTION match_created_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO timeline_events (item_id, report_id, event_type, event_title, event_description)
  VALUES (
    NEW.item_id,
    NEW.report_id,
    'match_found',
    'Match Found',
    'A potential match has been identified'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_match_created
AFTER INSERT ON item_match
FOR EACH ROW
EXECUTE FUNCTION match_created_trigger();

-- ============================================================
-- 20. FINAL ANALYSIS
-- ============================================================

ANALYZE;
