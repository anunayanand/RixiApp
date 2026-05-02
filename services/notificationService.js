const Notification = require("../models/Notification");

/**
 * Create a notification for one or more recipients.
 *
 * @param {Object|Object[]} payload
 *   Each payload: { recipientId, recipientModel, title, message, type, link? }
 */
async function notify(payload) {
  try {
    const items = Array.isArray(payload) ? payload : [payload];
    await Notification.insertMany(items, { ordered: false });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
}

module.exports = { notify };
