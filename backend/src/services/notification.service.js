/**
 * Notification Service
 * Handles email notifications and real-time alerts
 */

const nodemailer = require('nodemailer');

// Email transporter configuration
let transporter = null;

/**
 * Initialize email service
 */
function initializeEmailService() {
  const emailConfig = {
    host: process.env.SMTP_HOST || 'localhost',
    port: process.env.SMTP_PORT || 1025,
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    } : null
  };

  transporter = nodemailer.createTransport(emailConfig);
}

/**
 * Send match notification email
 * @param {Object} params - Email parameters
 */
async function sendMatchNotification(params) {
  try {
    if (!transporter) initializeEmailService();

    const {
      recipientEmail,
      recipientName,
      foundItemName,
      foundItemColor,
      foundItemBrand,
      lostReportDate,
      matchScore,
      matchLink
    } = params;

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@findit.local',
      to: recipientEmail,
      subject: `🎉 Potential Match Found for "${foundItemName}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16213D;">Good News, ${recipientName}!</h2>

          <p>We found a potential match for an item you reported as lost:</p>

          <div style="background: #FBF3DC; padding: 20px; border-left: 4px solid #D4A24E; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #4A2511;">${foundItemName}</h3>
            <p>
              <strong>Color:</strong> ${foundItemColor}<br>
              <strong>Brand:</strong> ${foundItemBrand || 'Unknown'}<br>
              <strong>Match Score:</strong> ${matchScore}%<br>
              <strong>Date:</strong> ${new Date(lostReportDate).toLocaleDateString()}
            </p>
          </div>

          <p>
            <a href="${matchLink}" style="display: inline-block; background: #16213D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
              View Match Details
            </a>
          </p>

          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This is an automated message from FindIT Lost & Found System
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send claim decision notification
 * @param {Object} params - Email parameters
 */
async function sendClaimNotification(params) {
  try {
    if (!transporter) initializeEmailService();

    const {
      recipientEmail,
      recipientName,
      itemName,
      claimStatus,
      claimLink
    } = params;

    const statusEmoji = claimStatus === 'Approved' ? '✅' : '❌';
    const statusMessage = claimStatus === 'Approved'
      ? 'Your claim has been approved!'
      : 'Your claim has been rejected.';

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@findit.local',
      to: recipientEmail,
      subject: `${statusEmoji} Claim Decision for "${itemName}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16213D;">Claim Update</h2>

          <p>${statusMessage}</p>

          <div style="background: #FBF3DC; padding: 20px; border-left: 4px solid ${claimStatus === 'Approved' ? '#2F9E58' : '#D2691E'}; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #4A2511;">${itemName}</h3>
            <p><strong>Status:</strong> ${claimStatus}</p>
          </div>

          <p>
            <a href="${claimLink}" style="display: inline-block; background: #16213D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
              View Details
            </a>
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Emit real-time notification via Socket.io
 * @param {Object} io - Socket.io instance
 * @param {number} userId - User ID
 * @param {Object} notification - Notification data
 */
function emitRealTimeNotification(io, userId, notification) {
  io.to(`user_${userId}`).emit('notification', {
    id: notification.Notification_ID,
    type: notification.Type,
    title: notification.Title,
    message: notification.Message,
    data: notification.Data,
    read: notification.Is_Read === 'N',
    timestamp: new Date()
  });
}

/**
 * Broadcast match update to both parties
 * @param {Object} io - Socket.io instance
 * @param {number} itemOwner - Staff/Admin who registered item
 * @param {number} reportOwner - Student who reported loss
 * @param {Object} matchData - Match information
 */
function broadcastMatchUpdate(io, itemOwner, reportOwner, matchData) {
  // Notify staff/admin about new match
  emitRealTimeNotification(io, itemOwner, {
    Notification_ID: 1,
    Type: 'MATCH_FOUND',
    Title: 'New Match Found',
    Message: `Found item "${matchData.foundItemName}" matches report "${matchData.lostItemName}"`,
    Data: matchData,
    Is_Read: 'N'
  });

  // Notify student about potential match
  emitRealTimeNotification(io, reportOwner, {
    Notification_ID: 2,
    Type: 'MATCH_FOUND',
    Title: 'Potential Match!',
    Message: `We found "${matchData.foundItemName}" - it might be your lost item!`,
    Data: matchData,
    Is_Read: 'N'
  });
}

/**
 * Send message notification
 * @param {Object} io - Socket.io instance
 * @param {number} recipientId - Recipient user ID
 * @param {Object} message - Message data
 */
function notifyNewMessage(io, recipientId, message) {
  emitRealTimeNotification(io, recipientId, {
    Notification_ID: 3,
    Type: 'NEW_MESSAGE',
    Title: 'New Message',
    Message: `${message.senderName}: ${message.preview}`,
    Data: message,
    Is_Read: 'N'
  });
}

module.exports = {
  initializeEmailService,
  sendMatchNotification,
  sendClaimNotification,
  emitRealTimeNotification,
  broadcastMatchUpdate,
  notifyNewMessage
};
