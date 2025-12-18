const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authRole = require("../middleware/authRole");
const Ambassador = require("../models/Ambassador");
const NewRegistration = require("../models/NewRegistration");

router.get("/", authRole("superAdmin"), async (req, res) => {
  try {
    const interns = await User.find({ role: "intern" });
    const batches = [...new Set(interns.map(i => i.batch_no))];
    const admins = await User.find({ role: "admin" });
    const ambassadors = await Ambassador.find({});
    const superAdmin = await User.findOne({ role: "superAdmin" });
    const registrations = await NewRegistration.find({ status: "pending" }).sort({ createdAt: -1 });
    if (!superAdmin) {
      req.flash("error", "SuperAdmin not found");
      return res.redirect("/login");
    }

    // ==============================
    // 🔔 Notification Logic
    // ==============================
    if (!superAdmin.notifiedInterns) superAdmin.notifiedInterns = [];
    const arr = [0, 1, 2, 3, 4, 6, 8];
    let newNotificationCount = 0;

    for (const intern of interns) {
      const assignedProjects = intern.projectAssigned || [];
      const acceptedCount = assignedProjects.filter(p => p.status === "accepted").length;
      const duration = intern.duration || 1;
      const progress = Math.round((arr[acceptedCount] / duration) * 100);

      intern.intern_progress = progress;

      if (progress === 100) {
        const alreadyNotified = superAdmin.notifiedInterns.includes(intern._id.toString());
        if (!alreadyNotified) {
          const message = `Intern ${intern.name} from domain "${intern.domain}" has completed 100% progress.`;

          superAdmin.notifications.push({
            title: "Intern Completed Internship",
            message,
            type: "progress",
            createdAt: new Date(),
            isRead: false,
          });

          superAdmin.notifiedInterns.push(intern._id.toString());
          newNotificationCount++;
        }
      }
    }

    if (newNotificationCount > 0) {
      await superAdmin.save();
    }

    // ==============================
    // 🧾 Count Certified Interns
    // ==============================
    const certifiedInternsCount = interns.filter(
      i => i.completion_date
    ).length;

    // ==============================
    // 🧭 Ambassador Count
    // ==============================
    const ambassadorCount = ambassadors.length;

    // ==============================
    // 📅 Aggregate Meetings
    // ==============================
    const meetingsMap = new Map();
    interns.forEach(intern => {
      intern.meetings.forEach(meeting => {
        const key = `${intern.domain}-${intern.batch_no}-${meeting.week}-${meeting.title}`;
        if (!meetingsMap.has(key)) {
          meetingsMap.set(key, {
            ...meeting.toObject(),
            domain: intern.domain,
            batch_no: intern.batch_no
          });
        }
      });
    });

    const getObjectIdTime = id =>
      new Date(parseInt(id.toString().substring(0, 8), 16) * 1000);

    const meetings = Array.from(meetingsMap.values()).sort(
      (a, b) => getObjectIdTime(b._id) - getObjectIdTime(a._id)
    );

    // ==============================
    // 📢 Admin Notices
    // ==============================
    const adminNotices = admins.flatMap(a =>
      a.notice.map(n => ({
        title: n.title,
        description: n.description,
        adminName: a.name
      }))
    );

    // Sort notifications newest first
    const notifications = superAdmin.notifications.sort((a, b) => b.createdAt - a.createdAt);

    // Render Dashboard (no flash for normal)
    res.render("superAdmin", {
      interns,
      admins,
      superAdmin,
      ambassadors,
      batches,
      certifiedInternsCount,
      ambassadorCount,
      adminNotices,
      meetings,
      notifications,
      showPasswordPopup: superAdmin.isFirstLogin,
      registrations
    });
  } catch (err) {
    req.flash("error", "Failed to load Super Admin Dashboard");
    res.redirect("/login");
  }
});

// Approve or reject registration
router.post("/registration/:id/:action", authRole("superAdmin"), async (req, res) => {
  try {
    const { id, action } = req.params;
    const superAdmin = await User.findOne({ role: "superAdmin" });

    if (action === "approve") {
      await NewRegistration.findByIdAndUpdate(id, {
        status: "approved",
        approvedBy: superAdmin._id,
        approvedAt: new Date()
      });
      res.json({ success: true, message: "Registration approved" });
    } else if (action === "reject") {
      await NewRegistration.findByIdAndUpdate(id, {
        status: "rejected",
        approvedBy: superAdmin._id,
        approvedAt: new Date()
      });
      res.json({ success: true, message: "Registration rejected" });
    } else {
      res.status(400).json({ success: false, message: "Invalid action" });
    }
  } catch (error) {
    // console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
