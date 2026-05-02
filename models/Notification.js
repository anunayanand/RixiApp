const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipientId:   { type: mongoose.Schema.Types.ObjectId, required: true },
    recipientModel:{ type: String, enum: ["User", "Admin", "SuperAdmin"], required: true },
    title:         { type: String, required: true },
    message:       { type: String, required: true },
    type: {
      type: String,
      enum: ["project", "quiz", "meeting", "mail", "system", "registration"],
      default: "system"
    },
    isRead:        { type: Boolean, default: false },
    link:          { type: String, default: "" },  // optional deep-link
  },
  { timestamps: true }                              // createdAt, updatedAt auto-added
);

// Automatically expire notifications older than 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Fast queries by recipient + unread status
notificationSchema.index({ recipientId: 1, isRead: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
