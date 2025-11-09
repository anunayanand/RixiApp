const express = require('express');
const router = express.Router();
const Project = require("../models/Project");
const User = require("../models/User");
const authRole = require('../middleware/authRole');

router.post("/admin/projects", authRole("admin"), async (req, res) => {
  try {
    const adminId = req.session.user;
    const admin = await User.findById(adminId);
    if (!admin) return res.status(404).send("Admin not found");

    let { title, description, downloadLink, uploadLink, week, batch_no } = req.body;
    week = Number(week);

    // ✅ Create new project
    const newProject = new Project({
      title,
      description,
      domain: admin.domain,
      downloadLink,
      uploadLink,
      week,
      batch_no,
      createdBy: admin._id
    });
    await newProject.save();

    // 🔹 Determine eligible intern durations
    const allDurations = [4, 6, 8];
    const eligibleDurations = allDurations.filter(d => d >= week);

    // 🔹 Assign project to eligible interns
    const interns = await User.find({
      role: "intern",
      domain: admin.domain,
      batch_no,
      duration: { $in: eligibleDurations }
    });

    // 🟢 Notification object for interns
    const internNotification = {
      title: "New Project Assigned",
      message: `A new project "${title}" has been assigned for Week ${week}. Check your dashboard for details.`,
      type: "project",
      createdAt: new Date(),
      isRead: false
    };

    // Push notification and project assignment
    for (let intern of interns) {
      intern.projectAssigned.push({
        projectId: newProject._id,
        week: newProject.week,
        status: "pending"
      });
      intern.notifications.push(internNotification);
      await intern.save();
    }

    // 🟣 Notify SuperAdmin
    const superAdmin = await User.findOne({ role: "superAdmin" });
    if (superAdmin) {
      superAdmin.notifications.push({
        title: "New Project Created",
        message: `A new project "${title}" has been created by ${admin.name} for domain "${admin.domain}" (Week ${week}).`,
        type: "project",
        createdAt: new Date(),
        isRead: false
      });
      await superAdmin.save();
    }

    req.flash('success', 'Project Created Successfully! Notifications sent.');
    res.redirect("/admin#uploadProject");
  } catch (err) {
    req.flash('error', 'Project Creation Failed! ' + err.message);
    res.redirect('/admin#uploadproject');
  }
});

module.exports = router;
