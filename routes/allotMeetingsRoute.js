const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/User");
const Admin = require("../models/Admin");
const authRole = require("../middleware/authRole");

// =============================
// 📌 ALLOT MEETING (SuperAdmin Only)
// =============================
router.post("/allot-meetings", authRole("superAdmin"), async (req, res) => {
  try {
    const { domain, week, batch_no, title, link, scheduledTime } = req.body;

    const interns = await User.find({ role: "intern", domain, batch_no });
    const admins = await Admin.find({ domain });

    if (!interns.length && !admins.length) {
      req.flash("error", "No interns or admins found for selected criteria");
      return res.redirect("/superAdmin");
    }

    // ✅ Generate one shared _id for all
    const meetingId = new mongoose.Types.ObjectId();

    const meetingObj = {
      _id: meetingId,
      link,
      title,
      scheduledTime,
      week,
      status: "upcoming",
      attendance: "pending"
    };

    let allottedCount = 0;

    // ===== Interns =====
    for (let intern of interns) {
      if (week <= intern.duration) {
        intern.meetings = intern.meetings || [];
        intern.meetings.push(meetingObj);
        await intern.save();
        allottedCount++;
      }
    }

    // ===== Admins =====
    for (let admin of admins) {
      admin.meetings.push(meetingObj);
      await admin.save();
      allottedCount++;
    }

    console.log("✅ Meeting Allotted with ID:", meetingObj._id);

    if (allottedCount === 0) {
      req.flash("warning", "No meetings allotted. Possibly all interns exceed the week limit.");
    } else {
      req.flash("success", `Meeting allotted successfully to ${allottedCount} users.`);
    }

    res.redirect("/superAdmin");
  } catch (err) {
    console.log(err);
    req.flash("error", "Error while allotting meeting");
    res.redirect("/superAdmin");
  }
});



// =============================
// 📌 UPDATE MEETING (SuperAdmin Only)
// =============================
router.post("/update-meeting/:meetingId", authRole("superAdmin"), async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { domain, batch_no, title, link, scheduledTime, week, status } = req.body;

    // Fetch interns and admins separately
    const interns = await User.find({ role: "intern", domain, batch_no });
    const admins = await Admin.find({ domain });

    if (!interns.length && !admins.length) {
      req.flash("error", "No interns or admins found for selected domain and batch");
      return res.redirect("/superAdmin");
    }

    let updatedCount = 0;

    // ===== Update interns =====
    for (let intern of interns) {
      // Only update if week <= intern.duration
      if (week <= intern.duration) {
        intern.meetings = intern.meetings || [];
        const meetingIndex = intern.meetings.findIndex(m => m._id.toString() === meetingId);
        if (meetingIndex !== -1) {
          const meeting = intern.meetings[meetingIndex];
          if (title !== undefined) meeting.title = title;
          if (link !== undefined) meeting.link = link;
          if (scheduledTime !== undefined) meeting.scheduledTime = scheduledTime;
          if (week !== undefined) meeting.week = week;
          if (status !== undefined) meeting.status = status;
          await intern.save();
          updatedCount++;
        }
      }
    }

    // ===== Update admins =====
    for (let admin of admins) {
      const meetingIndex = admin.meetings.findIndex(m => m._id.toString() === meetingId);
      if (meetingIndex !== -1) {
        const meeting = admin.meetings[meetingIndex];
        if (title !== undefined) meeting.title = title;
        if (link !== undefined) meeting.link = link;
        if (scheduledTime !== undefined) meeting.scheduledTime = scheduledTime;
        if (week !== undefined) meeting.week = week;
        if (status !== undefined) meeting.status = status;
        await admin.save();
        updatedCount++;
      }
    }

    if (updatedCount === 0) {
      req.flash("warning", "No meetings updated. Possibly due to week restrictions for interns.");
    } else {
      req.flash("success", `Meeting updated successfully for ${updatedCount} users.`);
    }

    res.redirect("/superAdmin");
  } catch (err) {
    console.log(err);
    req.flash("error", "Error while updating meeting");
    res.redirect("/superAdmin");
  }
});



// =============================
// 📌 DELETE MEETING (SuperAdmin Only)
// =============================
router.post("/delete-meeting/:meetingId", authRole("superAdmin"), async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { domain, batch_no } = req.body;

    // Fetch interns and admins separately
    const interns = await User.find({ role: "intern", domain, batch_no });
    const admins = await Admin.find({ domain });

    if (!interns.length && !admins.length) {
      req.flash("error", "No interns or admins found for selected domain and batch");
      return res.redirect("/superAdmin");
    }

    let deletedCount = 0;

    // ===== Delete from interns =====
    for (let intern of interns) {
      const originalLength = intern.meetings.length;
      intern.meetings = intern.meetings.filter(m => m._id.toString() !== meetingId);
      if (intern.meetings.length !== originalLength) {
        await intern.save();
        deletedCount++;
      }
    }

    // ===== Delete from admins =====
    for (let admin of admins) {
      const originalLength = admin.meetings.length;
      admin.meetings = admin.meetings.filter(m => m._id.toString() !== meetingId);
      if (admin.meetings.length !== originalLength) {
        await admin.save();
        deletedCount++;
      }
    }

    if (deletedCount === 0) {
      req.flash("warning", "No meetings were deleted. Meeting may not exist for selected users.");
    } else {
      req.flash("success", `Meeting deleted successfully for ${deletedCount} users.`);
    }

    res.redirect("/superAdmin");
  } catch (err) {
    console.log(err);
    req.flash("error", "Error while deleting meeting");
    res.redirect("/superAdmin");
  }
});





module.exports = router;
