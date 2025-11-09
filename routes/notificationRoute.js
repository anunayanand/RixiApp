const express = require("express");
const router = express.Router();
const User = require("../models/User");

// ✅ Helper: Determine redirect path based on role
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

// ✅ Delete one notification (mark as read)
router.post("/notification/read/:id", async (req, res) => {
  try {
    const userId = req.session.user;
    const { id } = req.params;
    const user = await User.findById(userId);

    if (!user) return res.redirect("/login");

    // Remove the specific notification
    user.notifications = user.notifications.filter(
      (n) => n._id.toString() !== id.toString()
    );
    await user.save();

    const redirectPath = getRedirectPath(user.role);
    res.redirect(redirectPath);
  } catch {
    res.redirect("/login");
  }
});

// ✅ Delete all notifications
router.post("/notification/clear", async (req, res) => {
  try {
    const userId = req.session.user;
    const user = await User.findById(userId);

    if (!user) return res.redirect("/login");

    user.notifications = [];
    await user.save();

    const redirectPath = getRedirectPath(user.role);
    res.redirect(redirectPath);
  } catch {
    res.redirect("/login");
  }
});

module.exports = router;
