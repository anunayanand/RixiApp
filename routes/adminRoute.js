const express = require('express');
const router = express.Router();
const User = require("../models/User");
const Project = require("../models/Project");
const Quiz = require("../models/Quiz");
const authRole = require('../middleware/authRole');

router.get("/admin", authRole("admin"), async (req, res) => {
  try {
    const adminId = req.session.user;
    const admin = await User.findById(adminId);

    if (!admin) {
      req.flash("error", "Admin not found");
      return res.redirect("/login");
    }

    if (!admin.notifiedInterns) admin.notifiedInterns = [];

    // Get all interns in admin’s domain
    const interns = await User.find({ role: "intern", domain: admin.domain })
      .populate("projectAssigned.projectId");

    const superAdmin = await User.findOne({ role: "superAdmin" });
    const notices = superAdmin ? superAdmin.notice : [];

    // ===================================
    // 📈 Calculate Intern Progress
    // ===================================
    const arr = [0, 1, 2, 3, 4, 6, 8];
    let newNotificationCount = 0;

    for (const intern of interns) {
      const assignedProjects = intern.projectAssigned || [];
      const acceptedCount = assignedProjects.filter(p => p.status === "accepted").length;
      const duration = intern.duration || 1;
      const progress = Math.round((arr[acceptedCount] / duration) * 100);

      if (progress === 100) {
        const alreadyNotified = admin.notifiedInterns.includes(intern._id.toString());

        if (!alreadyNotified) {
          const message = `Intern ${intern.name} has successfully completed 100% progress.`;

          admin.notifications.push({
            title: "Intern Completed Internship",
            message,
            type: "progress",
            createdAt: new Date(),
            isRead: false,
          });

          admin.notifiedInterns.push(intern._id.toString());
          newNotificationCount++;
        }
      }

      intern.tempProgress = progress;
    }

    if (newNotificationCount > 0) {
      await admin.save();
    }

    // ===============================
    // 📅 Other Dashboard Data
    // ===============================
    const batches = [...new Set(interns.map(i => i.batch_no).filter(Boolean))];
    const projects = await Project.find({ domain: admin.domain });
    const certifiedInternsCount = interns.filter(
      i => i.certificate_link && i.certificate_link.trim() !== ""
    ).length;

    // Meetings
    let upcomingMeetings = (admin.meetings || []).filter(m => m.status === "upcoming");
    const getObjectIdTime = id =>
      new Date(parseInt(id.toString().substring(0, 8), 16) * 1000);
    upcomingMeetings = upcomingMeetings.sort(
      (a, b) => getObjectIdTime(b._id) - getObjectIdTime(a._id)
    );

    const quizzes = await Quiz.find({ domain: admin.domain }).sort({ createdAt: -1 });
    const notifications = admin.notifications.sort((a, b) => b.createdAt - a.createdAt);

    // Render dashboard
    req.flash("info", `Welcome ${admin.name}`);
    res.render("admin", {
      admin,
      interns,
      projects,
      batches,
      certifiedInternsCount,
      notices,
      meetings: upcomingMeetings,
      showPasswordPopup: admin.isFirstLogin,
      quizzes,
      notifications,
    });

  } catch (err) {
    req.flash("error", "Server Error");
    res.redirect("/login");
  }
});

module.exports = router;
