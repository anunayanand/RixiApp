const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Project = require("../models/Project");
const Quiz = require("../models/Quiz");
const NewRegistration = require("../models/NewRegistration");
const Ambassador = require("../models/Ambassador");
const authRole = require("../middleware/authRole");
const bcrypt = require("bcrypt");
const axios = require("axios");
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
// Function to format name
function formatName(name = "") {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .split(" ")
    .map(word => {
      if (word.includes(".")) {
        return word
          .split(".")
          .map(part => part ? part[0].toUpperCase() + part.slice(1) : "")
          .join(".");
      }
      if (word.includes("-")) {
        return word
          .split("-")
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join("-");
      }
      if (word.includes("'")) {
        return word
          .split("'")
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join("'");
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}


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
      isCreated: false,
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

    if (!intern_id || !batch_no) {
      return res.status(400).json({ success: false, message: "Intern ID and Batch are required" });
    }

    const admin = await User.findById(req.session.user);
    const registration = await NewRegistration.findById(id);

    if (!registration || registration.status !== "approved" || registration.domain !== admin.domain) {
      return res.status(400).json({ success: false, message: "Invalid registration" });
    }

    // Check unique intern_id
    if (await User.findOne({ intern_id })) {
      return res.status(400).json({ success: false, message: "Intern ID already exists" });
    }

    const startDate = startingDate[batch_no];
    const hashedPassword = await bcrypt.hash(intern_id, 10);

    const formattedName = formatName(registration.name);

    const newUser = await User.create({
      name: formattedName,
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
      starting_date: startDate,
      role: "intern",
      referal_code: registration.referral_code || "",
      img_url: registration.profile_image_url,
      img_public_id: registration.profile_image_public_id
    });

    // ✅ Assign projects correctly
    const projects = await Project.find({
      domain: registration.domain,
      batch_no,
    });

    const duration = Number(registration.duration);

    const eligibleProjects = projects.filter(p => {
      if (p.week <= 4 && [4,6,8].includes(duration)) return true;
      if (p.week === 6 && [6,8].includes(duration)) return true;
      if (p.week === 8 && duration === 8) return true;
      return false;
    });

    if (eligibleProjects.length) {
      newUser.projectAssigned = eligibleProjects.map(p => ({
        projectId: p._id,
        week: p.week,
        status: "pending"
      }));
      await newUser.save();
    }

    // ✅ Update ambassador count
    if (registration.referral_code) {
      await Ambassador.findOneAndUpdate(
        { referralId: registration.referral_code },
        { $inc: { internCount: 1 } }
      );
    }

    // ✅ Mark registration created AFTER success
    registration.isCreated = true;
    await registration.save();

    // ✅ Send email (don’t break flow if fails)
    try {
      await axios.post(GOOGLE_SCRIPT_URL, {
        intern_id,
        name: formattedName,
        email: registration.email,
        domain: registration.domain,
        duration: registration.duration,
        batch_no,
        starting_date: new Date(startDate).toDateString(),
      });
      await User.findByIdAndUpdate(newUser._id, { confirmationSent: true });
    } catch (e) {
      console.log("Mail failed but user created");
    }

    res.json({ success: true, message: "Intern created successfully" });

  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});


module.exports = router;
