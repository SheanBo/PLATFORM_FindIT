/**
 * Messaging Service
 * Handles user-to-user messaging and communication
 */

const { getAsync, runAsync, allAsync } = require('../database/init');

/**
 * Send message between users
 * @param {number} senderId - Sender user ID
 * @param {number} recipientId - Recipient user ID
 * @param {string} message - Message content
 * @param {number} relatedItemId - Related item/report ID (optional)
 * @param {string} relatedType - Type of related item (optional)
 */
async function sendMessage(senderId, recipientId, message, relatedItemId = null, relatedType = null) {
  try {
    const result = await runAsync(`
      INSERT INTO USER_MESSAGES (Sender_ID, Recipient_ID, Message_Content, Related_Item_ID, Related_Type, Is_Read, Date_Sent)
      VALUES (?, ?, ?, ?, ?, 'N', CURRENT_TIMESTAMP)
    `, [senderId, recipientId, message, relatedItemId, relatedType]);

    return {
      success: true,
      messageId: result.lastID,
      message: 'Message sent'
    };
  } catch (error) {
    throw new Error(`Failed to send message: ${error.message}`);
  }
}

/**
 * Get conversation between two users
 * @param {number} userId1 - First user ID
 * @param {number} userId2 - Second user ID
 * @param {number} limit - Max messages to retrieve
 */
async function getConversation(userId1, userId2, limit = 50) {
  try {
    const messages = await allAsync(`
      SELECT m.*,
             sp.First_Name || ' ' || sp.Last_Name AS Sender_Name,
             su.Username AS Sender_Username,
             rp.First_Name || ' ' || rp.Last_Name AS Recipient_Name,
             ru.Username AS Recipient_Username
      FROM USER_MESSAGES m
      JOIN ONLINE_USER su ON m.Sender_ID = su.User_ID
      JOIN PERSON sp ON su.Person_ID = sp.Person_ID
      JOIN ONLINE_USER ru ON m.Recipient_ID = ru.User_ID
      JOIN PERSON rp ON ru.Person_ID = rp.Person_ID
      WHERE (m.Sender_ID = ? AND m.Recipient_ID = ?) OR (m.Sender_ID = ? AND m.Recipient_ID = ?)
      ORDER BY m.Date_Sent DESC
      LIMIT ?
    `, [userId1, userId2, userId2, userId1, limit]);

    // Mark messages as read
    await runAsync(
      'UPDATE USER_MESSAGES SET Is_Read = "Y" WHERE (Recipient_ID = ? AND Sender_ID = ?)',
      [userId1, userId2]
    );

    return messages.reverse(); // Return in chronological order
  } catch (error) {
    throw new Error(`Failed to get conversation: ${error.message}`);
  }
}

/**
 * Get user's inbox (conversations list)
 * @param {number} userId - User ID
 */
async function getInbox(userId) {
  try {
    const conversations = await allAsync(`
      SELECT
        CASE
          WHEN Sender_ID = ? THEN Recipient_ID
          ELSE Sender_ID
        END AS Other_User_ID,
        CASE
          WHEN Sender_ID = ? THEN (SELECT p.First_Name || ' ' || p.Last_Name FROM PERSON p JOIN ONLINE_USER u ON p.Person_ID = u.Person_ID WHERE u.User_ID = Recipient_ID)
          ELSE (SELECT p.First_Name || ' ' || p.Last_Name FROM PERSON p JOIN ONLINE_USER u ON p.Person_ID = u.Person_ID WHERE u.User_ID = Sender_ID)
        END AS Other_User_Name,
        MAX(Date_Sent) AS Last_Message_Date,
        (SELECT Message_Content FROM USER_MESSAGES m2
         WHERE (m2.Sender_ID = ? AND m2.Recipient_ID = ? OR m2.Sender_ID = ? AND m2.Recipient_ID = ?)
         ORDER BY m2.Date_Sent DESC LIMIT 1) AS Last_Message,
        COUNT(CASE WHEN Recipient_ID = ? AND Is_Read = 'N' THEN 1 END) AS Unread_Count
      FROM USER_MESSAGES
      WHERE Sender_ID = ? OR Recipient_ID = ?
      GROUP BY Other_User_ID
      ORDER BY Last_Message_Date DESC
    `, [userId, userId, userId, userId, userId, userId, userId, userId]);

    return conversations;
  } catch (error) {
    throw new Error(`Failed to get inbox: ${error.message}`);
  }
}

/**
 * Get unread message count
 * @param {number} userId - User ID
 */
async function getUnreadCount(userId) {
  try {
    const result = await getAsync(
      'SELECT COUNT(*) AS count FROM USER_MESSAGES WHERE Recipient_ID = ? AND Is_Read = "N"',
      [userId]
    );

    return result.count || 0;
  } catch (error) {
    return 0;
  }
}

/**
 * Mark message as read
 * @param {number} messageId - Message ID
 */
async function markAsRead(messageId) {
  try {
    await runAsync(
      'UPDATE USER_MESSAGES SET Is_Read = "Y" WHERE Message_ID = ?',
      [messageId]
    );

    return { success: true };
  } catch (error) {
    throw new Error(`Failed to mark as read: ${error.message}`);
  }
}

module.exports = {
  sendMessage,
  getConversation,
  getInbox,
  getUnreadCount,
  markAsRead
};
