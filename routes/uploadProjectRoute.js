const express = require('express');
const router = express.Router();
const Project = require("../models/Project");
const User = require("../models/User");
const Admin = require("../models/Admin");
const SuperAdmin = require("../models/SuperAdmin");
const authRole = require('../middleware/authRole');
const { notify } = require("../services/notificationService");

router.post("/admin/projects", authRole("admin"), async (req, res) => {
  try {
    const adminId = req.session.user;
    const admin = await Admin.findById(adminId);
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

    // Push project assignment
    const notificationPayloads = [];
    for (let intern of interns) {
      intern.projectAssigned = intern.projectAssigned || [];
      intern.projectAssigned.push({
        projectId: newProject._id,
        week: newProject.week,
        status: "pending"
      });
      await intern.save();

      notificationPayloads.push({
        recipientId: intern._id,
        recipientModel: "User",
        title: "New Project Assigned",
        message: `A new project "${title}" has been assigned for Week ${week}. Check your dashboard for details.`,
        type: "project"
      });
    }
    
    if (notificationPayloads.length > 0) {
      await notify(notificationPayloads);
    }

    // 🟣 Notify SuperAdmin
    const superAdmin = await SuperAdmin.findOne({});
    if (superAdmin) {
      await notify({
        recipientId: superAdmin._id,
        recipientModel: "SuperAdmin",
        title: "New Project Created",
        message: `A new project "${title}" has been created by ${admin.name} for domain "${admin.domain}" (Week ${week}).`,
        type: "project"
      });
    }

    res.json({ success: true, message: 'Project Created Successfully! Notifications sent.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Project Creation Failed! ' + err.message });
  }
});

module.exports = router;
