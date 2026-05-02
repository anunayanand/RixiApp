const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");

function getModel(role) {
  if (role === "admin")      return "Admin";
  if (role === "superAdmin") return "SuperAdmin";
  return "User"; // intern
}

// GET  /notifications          — fetch latest 20 for current user (AJAX)
router.get("/notifications", async (req, res) => {
  try {
    if (!req.session.user) return res.status(401).json({ success: false, error: "Unauthorized" });
    const model = getModel(req.session.role);
    const notifications = await Notification
      .find({ recipientId: req.session.user, recipientModel: model })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    const unreadCount = await Notification.countDocuments({
      recipientId: req.session.user,
      recipientModel: model,
      isRead: false
    });
    return res.json({ success: true, notifications, unreadCount });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch notifications" });
  }
});

// POST /notification/read/:id  — mark one as read (NOT delete)
router.post("/notification/read/:id", async (req, res) => {
  try {
    if (!req.session.user) return res.status(401).json({ success: false, error: "Unauthorized" });
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    return res.json({ success: true });
  } catch (err) {
    console.error("Error marking notification as read:", err);
    return res.status(500).json({ success: false, error: "Failed to mark notification as read" });
  }
});

// POST /notification/clear     — mark all as read
router.post("/notification/clear", async (req, res) => {
  try {
    if (!req.session.user) return res.status(401).json({ success: false, error: "Unauthorized" });
    const model = getModel(req.session.role);
    await Notification.updateMany(
      { recipientId: req.session.user, recipientModel: model, isRead: false },
      { isRead: true }
    );
    return res.json({ success: true });
  } catch (err) {
    console.error("Error clearing notifications:", err);
    return res.status(500).json({ success: false, error: "Failed to clear notifications" });
  }
});

module.exports = router;
