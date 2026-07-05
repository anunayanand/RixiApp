const User = require("../../models/User");
const Admin = require("../../models/Admin");
const SuperAdmin = require("../../models/SuperAdmin");
const Ambassador = require("../../models/Ambassador");
const NewRegistration = require("../../models/NewRegistration");
const Feedback = require("../../models/Feedback");
const Notification = require("../../models/Notification");
const { generateSignature } = require("../../routes/common/profileRoute");
const { notify } = require("../../services/notifications/notificationService");
const { generateBatchAnalysis } = require("../../services/ai/groqService");
const { generateReceiptPDF } = require("../../services/documents/pdfGenerator");
const asyncHandler = require('../../utils/asyncHandler');

exports.renderDashboard = asyncHandler(async (req, res, next) => {
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

        await notify({
          recipientId: superAdmin._id,
          recipientModel: "SuperAdmin",
          title: "Intern Completed Internship",
          message,
          type: "progress"
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

  // Get unread notification count
  const unreadCount = await Notification.countDocuments({
    recipientId: superAdmin._id,
    recipientModel: "SuperAdmin",
    isRead: false
  });

  // ==============================
  // 🏆 Top 5 Ambassadors
  // ==============================
  // Count successful referrals for each ambassador
  const referralMap = new Map();
  ambassadors.forEach(amb => {
    if (amb.referralId) {
      referralMap.set(amb.referralId.trim(), 0);
    }
  });
  
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
      let rCode = amb.referralId ? amb.referralId.trim() : "";
      let calculatedRfs = referralMap.get(rCode) || 0;
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
    unreadCount,
    showPasswordPopup: superAdmin.isFirstLogin,
    registrations,
    topAmbassadorLabels,
    topAmbassadorData,
    generateSignature,
    batches: batches,
    feedbacks: feedbacks,
  });
});

exports.approveOrRejectRegistration = asyncHandler(async (req, res) => {
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
});

exports.sendOfferLetter = asyncHandler(async (req, res) => {
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
  const { sendBulkOfferLetterMails } = require("../offerLetterMailRoute");

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
});

exports.renderMailCenter = asyncHandler(async (req, res, next) => {
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
  const unreadCount = await Notification.countDocuments({
    recipientId: superAdmin._id,
    recipientModel: "SuperAdmin",
    isRead: false
  });
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
    unreadCount,
    registrations,
  });
});

exports.renderBatchReport = asyncHandler(async (req, res, next) => {
  const { batch_no } = req.params;
  
  const interns = await User.find({ role: "intern", batch_no: batch_no });
  
  if (!interns || interns.length === 0) {
    return res.status(404).send("<h2>No interns found for this batch.</h2>");
  }

  const totalInterns = interns.length;
  let totalProjects = 0;
  let totalIncome = 0;
  
  let certifiedInterns = 0;
  let totalQuizScore = 0;
  let quizTakers = 0;
  let projectsAccepted = 0;
  let projectsRejected = 0;
  let projectsPending = 0;
  let referralCount = 0;

  const domainDistribution = {};
  const durationDistribution = {};
  const projectsPerInternDist = {};
  const collegeDistribution = {};
  
  const scoreDistribution = {
    "< 50%": 0,
    "50-60%": 0,
    "61-70%": 0,
    "71-80%": 0,
    "81-90%": 0,
    "91-100%": 0
  };
  
  const ambassadorsList = await Ambassador.find({});
  const ambassadorMap = {};
  ambassadorsList.forEach(amb => { 
    if (amb.referralId) {
      ambassadorMap[amb.referralId.trim()] = amb.name; 
    }
  });
  const ambassadorDistribution = {};
  
  const internDetails = interns.map(intern => {
    const income = intern.amountPaid || 0;
    totalIncome += income;
    
    if (intern.isPassed) certifiedInterns++;
    if (intern.quiz_score) {
      totalQuizScore += intern.quiz_score;
      quizTakers++;
      
      const score = intern.quiz_score;
      if (score < 50) scoreDistribution["< 50%"]++;
      else if (score <= 60) scoreDistribution["50-60%"]++;
      else if (score <= 70) scoreDistribution["61-70%"]++;
      else if (score <= 80) scoreDistribution["71-80%"]++;
      else if (score <= 90) scoreDistribution["81-90%"]++;
      else scoreDistribution["91-100%"]++;
    }
    if (intern.referal_code) {
      referralCount++;
      const rCode = intern.referal_code.trim();
      const ambName = ambassadorMap[rCode] || rCode;
      ambassadorDistribution[ambName] = (ambassadorDistribution[ambName] || 0) + 1;
    }

    let projectsCount = 0;
    if (intern.projectAssigned && Array.isArray(intern.projectAssigned)) {
      projectsCount = intern.projectAssigned.length;
      intern.projectAssigned.forEach(p => {
        if (p.status === 'accepted') projectsAccepted++;
        else if (p.status === 'rejected') projectsRejected++;
        else projectsPending++;
      });
    }
    totalProjects += projectsCount;
    
    const domain = intern.domain || "Unknown";
    domainDistribution[domain] = (domainDistribution[domain] || 0) + 1;
    
    const duration = intern.duration || 0;
    durationDistribution[duration] = (durationDistribution[duration] || 0) + 1;
    
    const college = intern.college || "Unknown";
    collegeDistribution[college] = (collegeDistribution[college] || 0) + 1;
    
    projectsPerInternDist[projectsCount] = (projectsPerInternDist[projectsCount] || 0) + 1;
    
    return {
      name: intern.name,
      intern_id: intern.intern_id,
      domain: domain,
      duration: duration,
      amountPaid: income,
      isPassed: intern.isPassed,
      quizScore: intern.quiz_score || 0,
      progress: intern.progress || 0
    };
  });
  
  internDetails.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  // Find top domains and colleges
  const topDomains = Object.entries(domainDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(entry => entry[0]);
    
  const topCollegesList = Object.entries(collegeDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(entry => entry[0]);

  const averageQuizScore = quizTakers > 0 ? (totalQuizScore / quizTakers).toFixed(1) : 0;
  const certificationRate = totalInterns > 0 ? Math.round((certifiedInterns / totalInterns) * 100) : 0;

  const stats = {
    batchNo: batch_no,
    totalInterns,
    totalProjects,
    totalIncome,
    certifiedInterns,
    certificationRate,
    averageQuizScore,
    projectsAccepted,
    projectsRejected,
    projectsPending,
    topDomains,
    topColleges: topCollegesList,
    referralCount
  };

  // Generate AI Analysis
  const aiAnalysis = await generateBatchAnalysis(stats);

  const topColleges = Object.entries(collegeDistribution).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topAmbassadors = Object.entries(ambassadorDistribution).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const reportData = {
    batch_no,
    stats,
    aiAnalysis,
    graphs: {
      domains: Object.keys(domainDistribution),
      domainCounts: Object.values(domainDistribution),
      durations: Object.keys(durationDistribution),
      durationCounts: Object.values(durationDistribution),
      projects: Object.keys(projectsPerInternDist),
      projectCounts: Object.values(projectsPerInternDist),
      colleges: topColleges.map(e => e[0]),
      collegeCounts: topColleges.map(e => e[1]),
      ambassadors: topAmbassadors.map(e => e[0]),
      ambassadorCounts: topAmbassadors.map(e => e[1]),
      scores: Object.keys(scoreDistribution),
      scoreCounts: Object.values(scoreDistribution)
    },
    interns: internDetails
  };

  res.render("batchReportPDF", reportData);
});

exports.downloadReceipt = asyncHandler(async (req, res) => {
  const registration = await NewRegistration.findById(req.params.id);
  if (!registration) {
    return res.status(404).send("Registration not found");
  }
  const pdfBuffer = await generateReceiptPDF(registration);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="RixiLab_Receipt_${registration.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`
  );
  res.send(pdfBuffer);
});
