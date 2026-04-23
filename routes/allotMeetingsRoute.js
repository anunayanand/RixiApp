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

    // Convert the user-picked time (IST) to a proper Date with IST offset
    // Flatpickr sends "YYYY-MM-DD HH:mm" — the admin picks IST time
    const istScheduledTime = new Date(scheduledTime + ":00+05:30");

    const interns = await User.find({ role: "intern", domain, batch_no });
    const admins = await Admin.find({ domain });

    if (!interns.length && !admins.length) {
      return res.json({ success: false, message: "No interns or admins found for selected criteria" });
    }

    // ✅ Generate one shared _id for all
    const meetingId = new mongoose.Types.ObjectId();

    const meetingObj = {
      _id: meetingId,
      link,
      title,
      scheduledTime: istScheduledTime,
      week,
      status: "upcoming",
      attendance: "pending"
    };

    let allottedCount = 0;

    // ===== Interns =====
    for (let intern of interns) {
      if (week <= intern.duration) {
        intern.meetings = intern.meetings || [];
        
        // Check if meeting already exists
        const existingMeeting = intern.meetings.find(m => m._id.toString() === meetingId.toString());
        if (!existingMeeting) {
          intern.meetings.push(meetingObj);
          await intern.save();
          allottedCount++;
        }
      }
    }

    // ===== Admins =====
    for (let admin of admins) {
      // Check if meeting already exists
      const existingMeeting = admin.meetings.find(m => m._id.toString() === meetingId.toString());
      if (!existingMeeting) {
        admin.meetings.push(meetingObj);
        await admin.save();
        allottedCount++;
      }
    }

    // console.log("✅ Meeting Allotted with ID:", meetingObj._id);

    if (allottedCount === 0) {
      return res.json({ success: true, message: "No meetings allotted. Possibly all interns exceed the week limit." });
    } else {
      return res.json({ success: true, message: `Meeting allotted successfully to ${allottedCount} users.` });
    }
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: "Error while allotting meeting" });
  }
});



// =============================
// 📌 UPDATE MEETING (SuperAdmin Only)
// =============================
router.post("/update-meeting/:meetingId", authRole("superAdmin"), async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { title, link, scheduledTime, week, status } = req.body;

    // Convert the user-picked time (IST) to proper Date with IST offset
    const istScheduledTime = scheduledTime ? new Date(scheduledTime + ":00+05:30") : undefined;

    // Find ALL interns who have this meeting (regardless of domain/batch)
    const interns = await User.find({ 
      role: "intern",
      "meetings._id": meetingId 
    });
    
    // Find ALL admins who have this meeting
    const admins = await Admin.find({ 
      "meetings._id": meetingId 
    });

    if (!interns.length && !admins.length) {
      return res.json({ success: false, message: "Meeting not found for any users" });
    }

    let updatedCount = 0;

    // ===== Update interns =====
    for (let intern of interns) {
      intern.meetings = intern.meetings || [];
      const meetingIndex = intern.meetings.findIndex(m => m._id.toString() === meetingId);
      if (meetingIndex !== -1) {
        const meeting = intern.meetings[meetingIndex];
        if (title !== undefined) meeting.title = title;
        if (link !== undefined) meeting.link = link;
        if (istScheduledTime !== undefined) meeting.scheduledTime = istScheduledTime;
        if (week !== undefined) meeting.week = week;
        if (status !== undefined) meeting.status = status;
        await intern.save();
        updatedCount++;
      }
    }

    // ===== Update admins =====
    for (let admin of admins) {
      const meetingIndex = admin.meetings.findIndex(m => m._id.toString() === meetingId);
      if (meetingIndex !== -1) {
        const meeting = admin.meetings[meetingIndex];
        if (title !== undefined) meeting.title = title;
        if (link !== undefined) meeting.link = link;
        if (istScheduledTime !== undefined) meeting.scheduledTime = istScheduledTime;
        if (week !== undefined) meeting.week = week;
        if (status !== undefined) meeting.status = status;
        await admin.save();
        updatedCount++;
      }
    }

    if (updatedCount === 0) {
      return res.json({ success: true, message: "No meetings updated." });
    } else {
      return res.json({ success: true, message: `Meeting updated successfully for ${updatedCount} users.` });
    }
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: "Error while updating meeting" });
  }
});



// =============================
// 📌 DELETE MEETING (SuperAdmin Only)
// =============================
router.post("/delete-meeting/:meetingId", authRole("superAdmin"), async (req, res) => {
  try {
    const { meetingId } = req.params;

    // Find ALL interns who have this meeting (regardless of domain/batch)
    const interns = await User.find({ 
      role: "intern",
      "meetings._id": meetingId 
    });
    
    // Find ALL admins who have this meeting
    const admins = await Admin.find({ 
      "meetings._id": meetingId 
    });

    if (!interns.length && !admins.length) {
      return res.json({ success: false, message: "Meeting not found for any users" });
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
      return res.json({ success: true, message: "No meetings were deleted." });
    } else {
      return res.json({ success: true, message: `Meeting deleted successfully for ${deletedCount} users.` });
    }
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: "Error while deleting meeting" });
  }
});



// ===========================================
// 📅 SYNC ALL MEETINGS TO ALL INTERNS (SuperAdmin)
// ===========================================
router.post("/sync-all-meetings", authRole("superAdmin"), async (req, res) => {
  try {
    // Get all admins
    const admins = await Admin.find({});
    
    if (admins.length === 0) {
      req.flash("warning", "No admins found");
      return res.redirect("/superAdmin");
    }

    let totalSynced = 0;
    let internsProcessed = 0;

    for (const admin of admins) {
      const adminMeetings = admin.meetings || [];
      
      if (adminMeetings.length === 0) continue;

      // Get all interns in admin's domain
      const interns = await User.find({ 
        role: "intern", 
        domain: admin.domain 
      });

      for (let intern of interns) {
        const existingMeetingIds = (intern.meetings || []).map(m => m._id.toString());
        let meetingsAdded = 0;

        for (const meeting of adminMeetings) {
          if (!existingMeetingIds.includes(meeting._id.toString())) {
            intern.meetings = intern.meetings || [];
            intern.meetings.push({
              _id: meeting._id,
              link: meeting.link,
              title: meeting.title,
              scheduledTime: meeting.scheduledTime,
              week: meeting.week,
              status: meeting.status,
              attendance: "pending"
            });
            meetingsAdded++;
          }
        }

        if (meetingsAdded > 0) {
          await intern.save();
          totalSynced += meetingsAdded;
        }
        internsProcessed++;
      }
    }

    req.flash("success", `Synced ${totalSynced} meetings to ${internsProcessed} interns`);
    res.redirect("/superAdmin");
  } catch (err) {
    console.log(err);
    req.flash("error", "Error while syncing meetings");
    res.redirect("/superAdmin");
  }
});


// ===========================================
// 🧹 CLEANUP DUPLICATE MEETINGS (SuperAdmin)
// ===========================================
router.post("/cleanup-duplicate-meetings", authRole("superAdmin"), async (req, res) => {
  try {
    // Clean up User (intern) meetings
    const users = await User.find({ role: "intern" });
    let totalRemovedFromUsers = 0;

    for (let user of users) {
      if (user.meetings && user.meetings.length > 0) {
        const meetingIds = user.meetings.map(m => m._id.toString());
        const uniqueMeetingIds = [...new Set(meetingIds)];
        
        if (meetingIds.length !== uniqueMeetingIds.length) {
          // Remove duplicates
          const uniqueMeetings = user.meetings.filter((meeting, index, self) => 
            index === self.findIndex(m => m._id.toString() === meeting._id.toString())
          );
          
          const removed = meetingIds.length - uniqueMeetings.length;
          user.meetings = uniqueMeetings;
          await user.save();
          totalRemovedFromUsers += removed;
        }
      }
    }

    // Clean up Admin meetings
    const admins = await Admin.find({});
    let totalRemovedFromAdmins = 0;

    for (let admin of admins) {
      if (admin.meetings && admin.meetings.length > 0) {
        const meetingIds = admin.meetings.map(m => m._id.toString());
        const uniqueMeetingIds = [...new Set(meetingIds)];
        
        if (meetingIds.length !== uniqueMeetingIds.length) {
          const uniqueMeetings = admin.meetings.filter((meeting, index, self) => 
            index === self.findIndex(m => m._id.toString() === meeting._id.toString())
          );
          
          const removed = meetingIds.length - uniqueMeetings.length;
          admin.meetings = uniqueMeetings;
          await admin.save();
          totalRemovedFromAdmins += removed;
        }
      }
    }

    req.flash("success", `Cleaned up ${totalRemovedFromUsers} duplicate meetings from interns and ${totalRemovedFromAdmins} from admins`);
    res.redirect("/superAdmin");
  } catch (err) {
    console.log(err);
    req.flash("error", "Error while cleaning up duplicate meetings");
    res.redirect("/superAdmin");
  }
});


module.exports = router;
