const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Admin = require("../models/Admin");
const SuperAdmin = require("../models/SuperAdmin");
const Project = require("../models/Project");
const Quiz = require("../models/Quiz");
const NewRegistration = require("../models/NewRegistration");
const Lecture = require("../models/Lecture");
const authRole = require("../middleware/authRole");
const bcrypt = require("bcrypt");
const axios = require("axios");
const { notify } = require("../services/notificationService");
const Notification = require("../models/Notification");
const GOOGLE_SCRIPT_URL = process.env.CNF_MAIL_SCRIPT_URL;
// Function to split intern_id into parts
const startingDate = {
  2601: "2026-01-01T00:00:00.000+00:00",
  2602: "2026-02-01T00:00:00.000+00:00",
  2603: "2026-03-01T00:00:00.000+00:00",
  2604: "2026-04-01T00:00:00.000+00:00",
  2605: "2026-05-01T00:00:00.000+00:00",
  2606: "2026-06-01T00:00:00.000+00:00",
  2607: "2026-07-01T00:00:00.000+00:00",
  2608: "2026-08-01T00:00:00.000+00:00",
  2609: "2026-09-01T00:00:00.000+00:00",
  2610: "2026-10-01T00:00:00.000+00:00",
  2611: "2026-11-01T00:00:00.000+00:00",
  2612: "2026-12-01T00:00:00.000+00:00",
};
router.get("/", authRole("admin"), async (req, res, next) => {
  try {
    const adminId = req.session.user;
    const admin = await Admin.findById(adminId);
    admin.isOnline = true;
    await admin.save();

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

    const superAdmin = await SuperAdmin.findOne({});
    const notices = superAdmin ? superAdmin.notice : [];

    // ===================================
    // 📈 Calculate Intern Progress
    // ===================================
    const arr = [0, 1, 2, 3, 4, 6, 8];
    let newNotificationCount = 0;

    for (const intern of interns) {
      const assignedProjects = intern.projectAssigned || [];
      const acceptedCount = assignedProjects.filter(
        (p) => p.status === "accepted",
      ).length;
      const duration = intern.duration || 1;
      const progress = intern.progress || 0;

      if (progress === 100) {
        const alreadyNotified = admin.notifiedInterns.includes(
          intern._id.toString(),
        );

        if (!alreadyNotified) {
          const message = `Intern ${intern.name} has successfully completed 100% progress.`;

          await notify({
            recipientId: admin._id,
            recipientModel: "Admin",
            title: "Intern Completed Internship",
            message,
            type: "progress"
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
      (i) => i.certificate_link && i.certificate_link.trim() !== "",
    ).length;

    // Meetings
    let upcomingMeetings = (admin.meetings || []).filter(
      (m) => m.status === "upcoming",
    );
    const getObjectIdTime = (id) =>
      new Date(parseInt(id.toString().substring(0, 8), 16) * 1000);
    upcomingMeetings = upcomingMeetings.sort(
      (a, b) => getObjectIdTime(b._id) - getObjectIdTime(a._id),
    );

    const quizzes = await Quiz.find({ domain: admin.domain }).sort({
      createdAt: -1,
    });
    const unreadCount = await Notification.countDocuments({
      recipientId: admin._id,
      recipientModel: "Admin",
      isRead: false
    });
    const registrations = await NewRegistration.find({
      status: "approved",
      domain: admin.domain,
      isCreated: false,
    }).sort({ approvedAt: -1 });
    
    // Lectures
    const lectures = await Lecture.find({ domain: admin.domain }).sort({ createdAt: -1 });

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
      unreadCount,
      registrations,
      lectures,
    });
  } catch (err) {
    next(err);
  }
});

// Accept registration and create user
router.post("/accept-registration/:id", authRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { intern_id, batch_no, internshipType } = req.body;
    // console.log('Parsed data:', { id, intern_id, batch_no, internshipType });
    if (!intern_id || !batch_no) {
      return res
        .status(400)
        .json({ success: false, message: "Intern ID and Batch are required" });
    }
    const adminId = req.session.user;
    const admin = await Admin.findById(adminId);

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
    registration.isCreated = true;
    await registration.save();
    // Hash the password (intern_id as password)
    const hashedPassword = await bcrypt.hash(intern_id, 10);
    const startDate = startingDate[batch_no];
    // Create new user
    const newUser = new User({
      name: registration.name,
      email: registration.email,
      password: hashedPassword,
      phone: registration.phone,
      domain: registration.domain,
      duration: registration.duration,
      internshipType: internshipType || "Internship",
      university: registration.university,
      college: registration.college,
      course: registration.course,
      branch: registration.branch,
      year_sem: registration.year_sem,
      img_url: registration.profile_image_url,
      img_public_id: registration.profile_image_public_id,
      referral_code: registration.referral_code,
      intern_id,
      batch_no,
      starting_date: startDate,
      role: "intern",
    });

    await newUser.save();

    // ✅ Assign eligible projects based on batch + domain + duration
    const projects = await Project.find({
      domain: registration.domain,
      batch_no: batch_no
    });

    const eligibleProjects = projects.filter(p => {
      if (p.week <= 4 && [4, 6, 8].includes(Number(registration.duration))) return true;
      if (p.week === 6 && [6, 8].includes(Number(registration.duration))) return true;
      if (p.week === 8 && [8].includes(Number(registration.duration))) return true;
      return false;
    });

    if (eligibleProjects.length > 0) {
      newUser.projectAssigned = eligibleProjects.map(p => ({
        projectId: p._id,
        week: p.week,
        status: "pending"
      }));
      await newUser.save();
    }

    function getOrdinal(day) {
      if (day > 3 && day < 21) return "th"; // 11–13
      switch (day % 10) {
        case 1:
          return "st";
        case 2:
          return "nd";
        case 3:
          return "rd";
        default:
          return "th";
      }
    }
    function formatDateWithOrdinal(dateValue) {
      const date = new Date(dateValue);

      const day = date.getDate();
      const month = date.toLocaleString("en-US", { month: "long" });
      const year = date.getFullYear();

      return `${day}${getOrdinal(day)} ${month} ${year}`;
    }
    //  console.log('Sending email with data:', {
    //   intern_id: intern_id,
    //   name: registration.name,
    //   email: registration.email,
    //   domain: registration.domain,
    //   duration: registration.duration,
    //   batch_no: batch_no,
    //   starting_date: formatDateWithOrdinal(startDate),
    // });
    try {
      await axios.post(
        GOOGLE_SCRIPT_URL,
        {
          intern_id: intern_id,
          name: registration.name,
          email: registration.email,
          domain: registration.domain,
          duration: registration.duration,
          batch_no: batch_no,
          starting_date: formatDateWithOrdinal(startDate),
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      await User.findByIdAndUpdate(newUser._id, { confirmationSent: true });
    } catch (mailError) {
      console.error("Email failed:", mailError.message);
      // ❗ Do NOT fail intern creation if mail fails
    }

    // await NewRegistration.findByIdAndDelete(id);

    res.json({ success: true, message: "Intern created successfully" });
  } catch (error) {
    // console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
// Update Admin Profile Settings
router.post("/update-admin-profile", authRole("admin"), async (req, res) => {
  try {
    const adminId = req.session.user;
    const { name, phone } = req.body;

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found." });
    }

    if (name) admin.name = name.trim();
    if (phone) admin.phone = phone.trim();

    await admin.save();
    
    res.json({ success: true, message: "Profile settings updated successfully!" });
  } catch (err) {
    console.error("Error updating admin profile:", err);
    res.status(500).json({ success: false, message: "Server Error while updating profile." });
  }
});

module.exports = router;
