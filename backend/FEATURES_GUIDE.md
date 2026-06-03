# Phase 2.4: Additional Features Guide

## Overview

Phase 2.4 implements rich user experience features to increase engagement and improve communication between users and staff.

---

## 1. Real-Time Notifications (Socket.io)

### Features
- **Instant Match Alerts** - Notify users when new matches are found
- **Claim Decision Updates** - Immediate notification of claim approvals/rejections  
- **Message Notifications** - Real-time alerts for new messages
- **System Alerts** - Important updates and announcements

### Implementation

```javascript
// Server setup
const { initializeEmailService } = require('./services/notification.service');
const io = require('socket.io')(server);

initializeEmailService();

// Client connection
io.on('connection', (socket) => {
  socket.join(`user_${userId}`);
});

// Send notification
emitRealTimeNotification(io, userId, {
  Type: 'MATCH_FOUND',
  Title: 'New Match Found',
  Message: 'Found item matches your report',
  Data: matchData
});
```

### Event Types
```
- MATCH_FOUND: New potential match discovered
- MATCH_CONFIRMED: Match has been confirmed
- MATCH_REJECTED: Match was rejected
- CLAIM_FILED: New claim received
- CLAIM_APPROVED: Claim was approved
- CLAIM_REJECTED: Claim was rejected
- NEW_MESSAGE: New message received
- STATUS_CHANGED: Item/report status changed
- SYSTEM_ALERT: Important system announcement
```

---

## 2. Email Notifications

### Automatic Emails
- **Match Found** - Alert when potential match discovered
- **Claim Decision** - Notify of approval or rejection
- **New Message** - Alert when message received

### Configuration

```env
# .env configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@findit.local
```

### Email Templates

**Match Notification:**
```
Subject: 🎉 Potential Match Found for "Black Wallet"
- Includes item details
- Match score and date
- Call-to-action button
- Unsubscribe option
```

**Claim Decision:**
```
Subject: ✅ Claim Decision for "iPhone 12"
- Approval/rejection status
- Item details
- Next steps
```

---

## 3. User Favorites/Bookmarks

### Features
- **Save Items** - Bookmark found items for later review
- **Watch Reports** - Track specific lost reports
- **Favorites List** - View all saved items in one place
- **Quick Reference** - Instant access to important items

### Database Schema

```sql
USER_FAVORITES
- Favorite_ID (PK)
- User_ID (FK)
- Item_ID
- Item_Type ('found_item' | 'lost_report')
- Date_Added
```

### API Usage

```javascript
// Add favorite
POST /api/favorites
{
  itemId: 123,
  itemType: 'found_item'
}

// Get user favorites
GET /api/favorites
Returns: array of favorited items

// Remove favorite
DELETE /api/favorites/:itemId/:itemType
```

---

## 4. User Messaging System

### Features
- **Direct Messages** - Communicate directly with staff/other users
- **Message History** - Complete conversation threads
- **Read Status** - See if messages have been read
- **Related Items** - Link messages to specific items/matches

### Database Schema

```sql
USER_MESSAGES
- Message_ID (PK)
- Sender_ID (FK)
- Recipient_ID (FK)
- Message_Content
- Related_Item_ID
- Related_Type
- Is_Read
- Date_Sent
- Date_Read
```

### Inbox Structure

```
Conversation with "John Smith"
- Last message: "Have you claimed it yet?"
- Unread: 2
- Last activity: 2 hours ago
```

### API Usage

```javascript
// Send message
POST /api/messages
{
  recipientId: 456,
  message: "Hi, I found your wallet!",
  relatedItemId: 123,
  relatedType: "found_item"
}

// Get inbox
GET /api/messages/inbox
Returns: conversation list with unread counts

// Get conversation
GET /api/messages/conversation/:userId
Returns: full message thread

// Mark as read
PUT /api/messages/:messageId/read
```

---

## 5. Item Timeline & Activity Tracking

### Features
- **Complete History** - Track all events for an item
- **Status Changes** - See when status changed and why
- **Match Timeline** - View match discovery and confirmation
- **User Activity Feed** - See user's recent activities

### Timeline Events

```
Item Created → Match Found → Match Confirmed → Claim Filed → Claim Approved → Item Transferred

Report Filed → Match Found → Match Confirmed → Claim Approved → Resolved
```

### Database Schema

```sql
TIMELINE_EVENTS
- Event_ID (PK)
- Item_ID (FK)
- Report_ID (FK)
- User_ID (FK)
- Event_Type (see types below)
- Event_Title
- Event_Description
- Metadata (JSON)
- Event_Date
```

### Event Types

```
ITEM LIFECYCLE:
- item_registered: Item added to system
- status_changed: Item status updated
- item_transferred: Item given to claimant

MATCHING:
- match_found: Auto/manual match created
- match_confirmed: Match approved
- match_rejected: Match rejected

CLAIMS:
- claim_filed: Claim submitted
- claim_approved: Claim approved
- claim_rejected: Claim rejected

COMMUNICATION:
- message_sent: Message sent to user
```

### API Usage

```javascript
// Get item timeline
GET /api/items/:id/timeline
Returns: chronological event list

// Get report timeline
GET /api/reports/:id/timeline
Returns: chronological event list

// Get user activity feed
GET /api/users/activity
Returns: user's recent activities

// Get item summary
GET /api/items/:id/summary
Returns: timeline + current status
```

---

## 6. Notification Preferences

### User Settings

```sql
NOTIFICATION_PREFERENCES
- Email_On_Match (Y/N)
- Email_On_Claim (Y/N)
- Email_On_Message (Y/N)
- Push_Notifications (Y/N)
- Notification_Frequency (IMMEDIATE/DAILY_DIGEST/WEEKLY_DIGEST)
```

### API Usage

```javascript
// Get preferences
GET /api/users/preferences/notifications

// Update preferences
PUT /api/users/preferences/notifications
{
  emailOnMatch: true,
  emailOnClaim: true,
  pushNotifications: false,
  frequency: "DAILY_DIGEST"
}
```

---

## 7. Analytics & Engagement

### Tracked Metrics

```
- Messages sent/received
- Items favorited
- Matches viewed
- Claims filed
- User engagement frequency
```

### Database Schema

```sql
USER_ANALYTICS
- Analytics_ID (PK)
- User_ID (FK)
- Event_Type
- Event_Date
- Count
```

---

## 8. Real-World Workflows

### Workflow 1: Discovering a Match

```
1. Staff registers found item
   → Timeline: "Item Registered"
   → Notification sent to staff

2. System finds match to report
   → Timeline: "Match Found"
   → Notifications sent to both parties
   → Email: Match notification to student

3. Student confirms match
   → Timeline: "Match Confirmed"
   → Messages available between parties
   → Notification: Staff alerted

4. Student files claim
   → Timeline: "Claim Filed"
   → Messages enable communication
   → Staff reviews and approves
   → Timeline: "Claim Approved"
   → Email: Claim decision to student
```

### Workflow 2: User Communication

```
1. User sends message
   → Real-time notification to recipient
   → Message stored with read status

2. Recipient views inbox
   → Sees all conversations
   → Unread count per conversation
   → Can mark as read

3. Recipient replies
   → Thread grows chronologically
   → Related to item/match when applicable
   → Both parties notified
```

---

## 9. Database Triggers

Automatic timeline events created by:

```
INSERT on FOUND_ITEM      → Event: item_registered
INSERT on LOST_REPORT     → Event: report_filed
INSERT on ITEM_MATCH      → Event: match_found
UPDATE on FOUND_ITEM      → Event: status_changed
INSERT on CLAIM           → Event: claim_filed
```

---

## 10. Performance Considerations

### Optimization Tips

1. **Message Query Optimization**
   - Index on (Recipient_ID, Is_Read) for unread count
   - Paginate messages in conversations
   - Cache inbox summaries (5-min TTL)

2. **Timeline Performance**
   - Only show last 50 events by default
   - Use Event_Date index for fast retrieval
   - Archive old events after 6 months

3. **Notification Batching**
   - Combine multiple events into daily digest if preferred
   - Queue notifications for off-peak sending
   - Cache unread counts

### Sample Queries

```sql
-- Unread messages for user
SELECT COUNT(*) FROM USER_MESSAGES 
WHERE Recipient_ID = ? AND Is_Read = 'N'
-- With index: <1ms

-- Get inbox
SELECT DISTINCT Sender_ID, Count(*) unread, MAX(Date_Sent) last_date
FROM USER_MESSAGES
WHERE Recipient_ID = ? GROUP BY Sender_ID
-- With index: <5ms

-- Item timeline
SELECT * FROM TIMELINE_EVENTS 
WHERE Item_ID = ? ORDER BY Event_Date DESC LIMIT 50
-- With index: <2ms
```

---

## 11. Testing

### Unit Tests
- Message creation and retrieval
- Favorite add/remove
- Timeline event creation
- Notification dispatching

### Integration Tests
- Full workflows (match → claim → resolution)
- Message threading
- Real-time updates
- Email sending

---

## 12. Future Enhancements

- [ ] Notification scheduling (quiet hours)
- [ ] Message search and filtering
- [ ] Message attachments
- [ ] Read receipts/typing indicators
- [ ] Message reactions/emojis
- [ ] Saved message templates
- [ ] Auto-reply messages
- [ ] Team collaboration features
- [ ] Advanced timeline filtering
- [ ] Analytics dashboard

---

**Last Updated:** June 2026
**Phase:** 2.4 - Complete
**Status:** All features operational
