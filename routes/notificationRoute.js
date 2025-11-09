const express = require("express");
const router = express.Router();
const User = require("../models/User");

// ✅ Helper: Determine redirect path (optional fallback)
function getRedirectPath(role) {
  switch (role) {
    case "superAdmin":
      return "/superAdmin";
    case "admin":
      return "/admin";
    case "intern":
      return "/intern";
    default:
      return "/login";
  }
}

// ✅ Delete (mark as read) — AJAX version
router.post("/notification/read/:id", async (req, res) => {
  try {
    const userId = req.session.user;
    const { id } = req.params;

    if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    const beforeCount = user.notifications.length;

    user.notifications = user.notifications.filter(
      (n) => n._id.toString() !== id.toString()
    );

    await user.save();
    const afterCount = user.notifications.length;

    return res.json({
      success: true,
      message: "Notification removed successfully",
      removed: beforeCount !== afterCount,
      remaining: afterCount,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to remove notification" });
  }
});

// ✅ Clear all notifications — AJAX version
router.post("/notification/clear", async (req, res) => {
  try {
    const userId = req.session.user;

    if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    const count = user.notifications.length;
    user.notifications = [];
    await user.save();

    return res.json({
      success: true,
      message: `Cleared ${count} notifications.`,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to clear notifications" });
  }
});

module.exports = router;
