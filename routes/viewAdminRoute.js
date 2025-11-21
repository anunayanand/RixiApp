const express = require('express');
const router = express.Router();
const User = require("../models/User");
const Project = require("../models/Project");
const Quiz = require("../models/Quiz");
const authRole = require('../middleware/authRole');

// ==========================================
// 🔹 SUPERADMIN VIEWING SPECIFIC ADMIN
// ==========================================
router.get("/superAdmin/admin/:adminId", authRole("superAdmin"), async (req, res) => {
  try {
    const admin = await User.findById(req.params.adminId);
    if (!admin || admin.role !== "admin") return res.redirect("/superAdmin");

    // Fetch interns under that admin’s domain
    const interns = await User.find({ role: "intern", domain: admin.domain })
      .populate("projectAssigned.projectId");

    const projects = await Project.find({ domain: admin.domain });
    const batches = [...new Set(interns.map(i => i.batch_no).filter(Boolean))];
    const certifiedInternsCount = interns.filter(
      i => i.certificate_link && i.certificate_link.trim() !== ""
    ).length;

    const superAdmin = await User.findOne({ role: "superAdmin" });
    const notices = superAdmin ? superAdmin.notice : [];

    // ✅ Filter upcoming meetings
    let upcomingMeetings = (admin.meetings || []).filter(m => m.status === "upcoming");
    const getObjectIdTime = id =>
      new Date(parseInt(id.toString().substring(0, 8), 16) * 1000);
    upcomingMeetings = upcomingMeetings.sort(
      (a, b) => getObjectIdTime(b._id) - getObjectIdTime(a._id)
    );

    const quizzes = await Quiz.find({ domain: admin.domain }).sort({ createdAt: -1 });
    const showPasswordPopup = false;

    req.flash('info', `Viewing Admin: ${admin.name}`);
    res.render("admin", {
      admin,
      interns,
      projects,
      batches,
      certifiedInternsCount,
      notices,
      meetings: upcomingMeetings,
      showPasswordPopup,
      quizzes,
      notifications: admin.notifications || [],
    });

  } catch (err) {
    console.error(err);
    res.redirect("/superAdmin");
  }
});

module.exports = router;
