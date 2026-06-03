/**
 * Timeline Service
 * Tracks activity history and item lifecycle events
 */

const { getAsync, runAsync, allAsync } = require('../database/init');

/**
 * Timeline event types
 */
const EVENT_TYPES = {
  ITEM_CREATED: 'item_registered',
  REPORT_CREATED: 'report_filed',
  MATCH_FOUND: 'match_found',
  MATCH_CONFIRMED: 'match_confirmed',
  MATCH_REJECTED: 'match_rejected',
  CLAIM_FILED: 'claim_filed',
  CLAIM_APPROVED: 'claim_approved',
  CLAIM_REJECTED: 'claim_rejected',
  STATUS_CHANGED: 'status_changed',
  MESSAGE_SENT: 'message_sent',
  ITEM_TRANSFERRED: 'item_transferred'
};

/**
 * Add timeline event
 * @param {Object} event - Event data
 */
async function addEvent(event) {
  try {
    const {
      itemId,
      reportId,
      userId,
      type,
      title,
      description,
      metadata = {}
    } = event;

    const result = await runAsync(`
      INSERT INTO TIMELINE_EVENTS (Item_ID, Report_ID, User_ID, Event_Type, Event_Title, Event_Description, Metadata, Event_Date)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      itemId || null,
      reportId || null,
      userId || null,
      type,
      title,
      description,
      JSON.stringify(metadata)
    ]);

    return {
      success: true,
      eventId: result.lastID
    };
  } catch (error) {
    console.error('Timeline event error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get item timeline
 * @param {number} itemId - Item ID
 */
async function getItemTimeline(itemId) {
  try {
    const events = await allAsync(`
      SELECT te.*,
             u.Username,
             p.First_Name || ' ' || p.Last_Name AS User_Name
      FROM TIMELINE_EVENTS te
      LEFT JOIN ONLINE_USER u ON te.User_ID = u.User_ID
      LEFT JOIN PERSON p ON u.Person_ID = p.Person_ID
      WHERE te.Item_ID = ?
      ORDER BY te.Event_Date DESC
    `, [itemId]);

    return events.map(e => ({
      ...e,
      metadata: e.Metadata ? JSON.parse(e.Metadata) : {}
    }));
  } catch (error) {
    throw new Error(`Failed to get timeline: ${error.message}`);
  }
}

/**
 * Get report timeline
 * @param {number} reportId - Report ID
 */
async function getReportTimeline(reportId) {
  try {
    const events = await allAsync(`
      SELECT te.*,
             u.Username,
             p.First_Name || ' ' || p.Last_Name AS User_Name
      FROM TIMELINE_EVENTS te
      LEFT JOIN ONLINE_USER u ON te.User_ID = u.User_ID
      LEFT JOIN PERSON p ON u.Person_ID = p.Person_ID
      WHERE te.Report_ID = ?
      ORDER BY te.Event_Date DESC
    `, [reportId]);

    return events.map(e => ({
      ...e,
      metadata: e.Metadata ? JSON.parse(e.Metadata) : {}
    }));
  } catch (error) {
    throw new Error(`Failed to get timeline: ${error.message}`);
  }
}

/**
 * Get user activity feed
 * @param {number} userId - User ID
 * @param {number} limit - Max events
 */
async function getUserActivityFeed(userId, limit = 50) {
  try {
    const events = await allAsync(`
      SELECT te.*,
             CASE
               WHEN te.Item_ID IS NOT NULL THEN (SELECT Item_Name FROM FOUND_ITEM WHERE Item_ID = te.Item_ID)
               WHEN te.Report_ID IS NOT NULL THEN (SELECT Item_Name FROM LOST_REPORT WHERE Report_ID = te.Report_ID)
             END AS Related_Item_Name
      FROM TIMELINE_EVENTS te
      WHERE te.User_ID = ?
      ORDER BY te.Event_Date DESC
      LIMIT ?
    `, [userId, limit]);

    return events.map(e => ({
      ...e,
      metadata: e.Metadata ? JSON.parse(e.Metadata) : {}
    }));
  } catch (error) {
    throw new Error(`Failed to get activity feed: ${error.message}`);
  }
}

/**
 * Generate timeline summary for item
 * @param {number} itemId - Item ID
 */
async function getItemSummary(itemId) {
  try {
    const events = await getItemTimeline(itemId);

    return {
      totalEvents: events.length,
      createdDate: events[events.length - 1]?.Event_Date,
      lastActivity: events[0]?.Event_Date,
      timeline: events,
      status: determineStatus(events)
    };
  } catch (error) {
    throw new Error(`Failed to get summary: ${error.message}`);
  }
}

/**
 * Determine current status from timeline
 * @param {Array} events - Timeline events
 */
function determineStatus(events) {
  const latestEvent = events[0];

  if (!latestEvent) return 'unknown';

  if (latestEvent.Event_Type === 'claim_approved') return 'claimed';
  if (latestEvent.Event_Type === 'match_confirmed') return 'matched';
  if (latestEvent.Event_Type === 'match_found') return 'pending_confirmation';

  return 'unclaimed';
}

module.exports = {
  EVENT_TYPES,
  addEvent,
  getItemTimeline,
  getReportTimeline,
  getUserActivityFeed,
  getItemSummary
};
