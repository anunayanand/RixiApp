const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Project = require("../models/Project");
const Quiz = require("../models/Quiz");
const NewRegistration = require("../models/NewRegistration");
const authRole = require("../middleware/authRole");
const bcrypt = require("bcrypt");

// Function to split intern_id into parts

router.get("/", authRole("admin"), async (req, res) => {
  try {
    const adminId = req.session.user;
    const admin = await User.findById(adminId);

    if (!admin) {
      req.flash("error", "Admin not found");
      return res.redirect("/login");
    }

    if (!admin.notifiedInterns) admin.notifiedInterns = [];

    // Get all interns in admin’s domain
    const interns = await User.find({
      role: "intern",
      domain: admin.domain,
    }).populate("projectAssigned.projectId");

    const superAdmin = await User.findOne({ role: "superAdmin" });
    const notices = superAdmin ? superAdmin.notice : [];

    // ===================================
    // 📈 Calculate Intern Progress
    // ===================================
    const arr = [0, 1, 2, 3, 4, 6, 8];
    let newNotificationCount = 0;

    for (const intern of interns) {
      const assignedProjects = intern.projectAssigned || [];
      const acceptedCount = assignedProjects.filter(
        (p) => p.status === "accepted"
      ).length;
      const duration = intern.duration || 1;
      const progress = Math.round((arr[acceptedCount] / duration) * 100);

      if (progress === 100) {
        const alreadyNotified = admin.notifiedInterns.includes(
          intern._id.toString()
        );

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
    const batches = [
      ...new Set(interns.map((i) => i.batch_no).filter(Boolean)),
    ];
    const projects = await Project.find({ domain: admin.domain });
    const certifiedInternsCount = interns.filter(
      (i) => i.certificate_link && i.certificate_link.trim() !== ""
    ).length;

    // Meetings
    let upcomingMeetings = (admin.meetings || []).filter(
      (m) => m.status === "upcoming"
    );
    const getObjectIdTime = (id) =>
      new Date(parseInt(id.toString().substring(0, 8), 16) * 1000);
    upcomingMeetings = upcomingMeetings.sort(
      (a, b) => getObjectIdTime(b._id) - getObjectIdTime(a._id)
    );

    const quizzes = await Quiz.find({ domain: admin.domain }).sort({
      createdAt: -1,
    });
    const notifications = admin.notifications.sort(
      (a, b) => b.createdAt - a.createdAt
    );
    const registrations = await NewRegistration.find({
      status: "approved",
      domain: admin.domain,
    }).sort({ approvedAt: -1 });
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
      registrations,
    });
  } catch (err) {
    req.flash("error", "Server Error");
    res.redirect("/admin-login");
  }
});

// Accept registration and create user
router.post("/accept-registration/:id", authRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { intern_id, batch_no } = req.body;
    // console.log('Parsed data:', { id, intern_id, batch_no });
    if (!intern_id || !batch_no) {
      return res
        .status(400)
        .json({ success: false, message: "Intern ID and Batch are required" });
    }
    const adminId = req.session.user;
    const admin = await User.findById(adminId);

    const registration = await NewRegistration.findById(id);
    if (
      !registration ||
      registration.status !== "approved" ||
      registration.domain !== admin.domain
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid registration" });
    }

    // Check if intern_id is unique
    const existingUser = await User.findOne({ intern_id });
    if (existingUser) {
      // console.log('Intern ID already exists:', intern_id);
      return res
        .status(400)
        .json({ success: false, message: "Intern ID already exists" });
    }

    // Hash the password (intern_id as password)
    const hashedPassword = await bcrypt.hash(intern_id, 10);

    // Create new user
    const newUser = new User({
      name: registration.name,
      email: registration.email,
      password: hashedPassword,
      phone: registration.phone,
      domain: registration.domain,
      duration: registration.duration,
      university: registration.university,
      college: registration.college,
      course: registration.course,
      branch: registration.branch,
      year_sem: registration.year_sem,
      intern_id,
      batch_no,
      role: "intern",
    });

    await newUser.save();

    // Optionally, mark registration as accepted or delete it
    await NewRegistration.findByIdAndDelete(id);

    res.json({ success: true, message: "Intern created successfully" });
  } catch (error) {
    // console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
