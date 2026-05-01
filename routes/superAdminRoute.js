const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Admin = require("../models/Admin");
const SuperAdmin = require("../models/SuperAdmin");
const authRole = require("../middleware/authRole");
const Ambassador = require("../models/Ambassador");
const NewRegistration = require("../models/NewRegistration");
const Feedback = require("../models/Feedback");
const { generateSignature } = require("./profileRoute");


router.get("/", authRole("superAdmin"), async (req, res, next) => {
  try {
    const interns = await User.find({ role: "intern" });
    const batches = [...new Set(interns.map(i => i.batch_no))];
    const admins = await Admin.find({});
    const ambassadors = await Ambassador.find({});
    const superAdmin = await SuperAdmin.findOne({});
    const registrations = await NewRegistration.find({ status: "pending" }).sort({ createdAt: -1 });
    const feedbacks = await Feedback.find({}).populate("userId", "name email domain batch_no duration img_url intern_id").sort({ submittedAt: -1 });
    
    if (!superAdmin) {
      req.flash("error", "SuperAdmin not found");
      return res.redirect("/login");
    }
    superAdmin.isOnline = true;
    await superAdmin.save();
    // ==============================
    // 🔔 Notification Logic
    // ==============================
    if (!superAdmin.notifiedInterns) superAdmin.notifiedInterns = [];
    const arr = [0, 1, 2, 3, 4, 6, 8];
    let newNotificationCount = 0;

    for (const intern of interns) {
      const assignedProjects = intern.projectAssigned || [];
      const acceptedCount = assignedProjects.filter(p => p.status === "accepted").length;
      const progress = intern.progress || 0;

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
    // 📅 Aggregate Meetings (unique by meeting _id)
    // ==============================
    const meetingsMap = new Map();
    
    // Process intern meetings
    interns.forEach(intern => {
      const meetings = intern.meetings || [];
      meetings.forEach(meeting => {
        // Use meeting _id as the key to uniquely identify each meeting
        const key = meeting._id.toString();
        if (!meetingsMap.has(key)) {
          meetingsMap.set(key, {
            ...meeting.toObject(),
            domain: intern.domain,
            batch_no: intern.batch_no
          });
        }
      });
    });
    
    // Process admin meetings (check for duplicates with intern meetings)
    admins.forEach(admin => {
      const meetings = admin.meetings || [];
      meetings.forEach(meeting => {
        const key = meeting._id.toString();
        if (!meetingsMap.has(key)) {
          meetingsMap.set(key, {
            ...meeting.toObject(),
            domain: admin.domain,
            batch_no: "admin"
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

    // ==============================
    // 🏆 Top 5 Ambassadors
    // ==============================
    // Count successful referrals for each ambassador
    const referralMap = new Map();
    ambassadors.forEach(amb => referralMap.set(amb.ambassador_id, 0));
    
    // We count interns who have a referral code matching an ambassador
    interns.forEach(intern => {
      let rCode = intern.referal_code ? intern.referal_code.trim() : "";
      if (rCode && referralMap.has(rCode)) {
        referralMap.set(rCode, referralMap.get(rCode) + 1);
      }
    });

    const topAmbassadors = ambassadors
      .map(amb => {
        // Fallback: If calculated referrals is 0, use the ambassador's internCount
        let calculatedRfs = referralMap.get(amb.ambassador_id) || 0;
        let finalRfs = Math.max(calculatedRfs, amb.internCount || 0);

        return {
          name: amb.name,
          referrals: finalRfs
        };
      })
      .sort((a, b) => b.referrals - a.referrals)
      .slice(0, 5);

    const topAmbassadorLabels = topAmbassadors.map(a => a.name);
    const topAmbassadorData = topAmbassadors.map(a => a.referrals);
    const internsNotSent = interns.filter(i => !i.offer_letter_sent);

    
    // Debugging (optional, checking values)
    // console.log("topAmbassadorLabels:", topAmbassadorLabels, "topAmbassadorData:", topAmbassadorData);

    // Render Dashboard (no flash for normal)
    res.render("superAdmin", {
      interns,
      internsNotSent,
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
      registrations,
      topAmbassadorLabels,
      topAmbassadorData,
      generateSignature,
      batches: batches,
      feedbacks: feedbacks,
    });
  } catch (err) {
    next(err);
  }
});

// Approve or reject registration
router.post("/registration/:id/:action", authRole("superAdmin"), async (req, res) => {
  try {
    const { id, action } = req.params;
    const superAdmin = await SuperAdmin.findOne({});

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

// Send offer letter to interns
router.post("/send-offer-letter", authRole("superAdmin"), async (req, res) => {
  try {
    const { interns } = req.body;

    // Normalize interns to array
    const internIds = interns
      ? Array.isArray(interns)
        ? interns
        : [interns]
      : [];

    // Validation: interns must be selected
    if (!internIds.length) {
      return res.json({ success: false, message: "No interns selected" });
    }

    // Fetch selected interns from DB
    const matchedInterns = await User.find({ intern_id: { $in: internIds } });

    if (!matchedInterns.length) {
      return res.json({ success: false, message: "No matching interns found" });
    }

    // Import the send function
    const { sendBulkOfferLetterMails } = require("./offerLetterMailRoute");

    // Send emails
    const results = await sendBulkOfferLetterMails(matchedInterns);

    // Flash messages
    const successCount = results.filter(r => r.status === "fulfilled").length;
    const failedCount = results.filter(r => r.status === "rejected").length;

    if (failedCount === 0) {
      res.json({ success: true, message: `${successCount} offer letters sent successfully.` });
    } else {
      res.json({ success: false, message: `${successCount} sent, ${failedCount} failed.` });
    }
  } catch (err) {
    // console.error("Error in send offer letter route:", err);
    res.json({ success: false, message: "Server error while sending offer letters." });
  }
});

// GET: Mail Center page
router.get("/mail-center", authRole("superAdmin"), async (req, res, next) => {
  try {
    const interns  = await User.find({ role: "intern" });
    const batches  = [...new Set(interns.map(i => i.batch_no).filter(Boolean))];
    const superAdmin = await SuperAdmin.findOne({});

    if (!superAdmin) {
      req.flash("error", "SuperAdmin not found");
      return res.redirect("/login");
    }

    // Derived counts for stat cards
    const pendingOfferCount = interns.filter(i => !i.offer_letter_sent).length;
    const pendingConfirmationCount = interns.filter(i => !i.confirmationSent).length;
    const pendingCompletionCount = interns.filter(i => i.isPassed && !i.completionSent).length;
    const totalSentOffer = interns.filter(i => i.offer_letter_sent).length;
    const totalSentConfirmation = interns.filter(i => i.confirmationSent).length;
    const totalSentCompletion = interns.filter(i => i.completionSent).length;
    const notifications = superAdmin.notifications.sort((a, b) => b.createdAt - a.createdAt);
    const registrations = await NewRegistration.find({ status: "pending" }).sort({ createdAt: -1 });

    res.render("mailCenter", {
      interns,
      batches,
      superAdmin,
      pendingOfferCount,
      pendingConfirmationCount,
      pendingCompletionCount,
      totalSentOffer,
      totalSentConfirmation,
      totalSentCompletion,
      notifications,
      registrations,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
