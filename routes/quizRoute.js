const express = require("express");
const router = express.Router();
const Quiz = require("../models/Quiz");
const User = require("../models/User");
const SuperAdmin = require("../models/SuperAdmin");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const { notify } = require("../services/notificationService");

// ------------------- Cloudinary Storage -------------------
const quizStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "quiz_images",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});
const quizUpload = multer({ storage: quizStorage });

// ------------------- 1️⃣ CREATE QUIZ -------------------
router.post("/create", quizUpload.array("images"), async (req, res) => {
  try {
    const { title, week, domain, questions } = req.body;
    const files = req.files;

    // 🧩 Prepare questions with optional image uploads
    const questionsWithImages = questions.map((q, index) => ({
      questionText: q.questionText,
      options: q.options,
      correctAnswer: q.correctAnswer,
      image: files[index] ? files[index].path : null,
    }));

    // 🆕 Create quiz
    const quiz = new Quiz({
      title,
      week: Number(week),
      domain,
      questions: questionsWithImages,
    });

    await quiz.save();

    // 🟣 Notify SuperAdmin
    const superAdmin = await SuperAdmin.findOne({});
    if (superAdmin) {
      await notify({
        recipientId: superAdmin._id,
        recipientModel: "SuperAdmin",
        title: "New Quiz Created",
        message: `A new quiz "${title}" (Week ${week}) has been created for domain "${domain}".`,
        type: "quizAssigned"
      });
    }

    res.json({ success: true, message: "Quiz created successfully. Notification sent to SuperAdmin." });
  } catch (error) {
    console.error("Error creating quiz:", error);
    res.status(500).json({ success: false, message: "Failed to create quiz" });
  }
});

// ------------------- 2️⃣ ASSIGN QUIZ -------------------
router.post("/assign", async (req, res) => {
  try {
    const { quizId, batch } = req.body;
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      req.flash("error", "Quiz not found");
      return res.redirect("/admin");
    }

    // 🔹 Get interns in the same domain and batch whose duration matches quiz.week exactly
    const interns = await User.find({
      batch_no: batch,
      domain: quiz.domain,
      duration: quiz.week,  // Exact match: only interns with matching duration
      role: "intern",
    });
    // console.log(`Found ${interns.length} interns for batch ${batch}, domain ${quiz.domain}, week ${quiz.week}`);
    if (!interns.length) {
      return res.status(404).json({ success: false, message: "No eligible interns found for this quiz." });
    }

    // ... (logic remains same) ...
    // Note: I will provide the full logic to avoid previous mistakes.
    
    // (Actual logic below)
    const notificationPayloads = [];

    for (let intern of interns) {
      if (!intern.quizAssignments) intern.quizAssignments = [];
      
      const alreadyAssigned = intern.quizAssignments.some(
        (q) => q && q.quizId && q.quizId.toString() === quiz._id.toString()
      );

      if (!alreadyAssigned) {
        intern.quizAssignments.push({
          quizId: quiz._id,
          batch,
          assigned: true,
          score: 0,
          attemptCount: 0,
        });
        await intern.save();

        notificationPayloads.push({
          recipientId: intern._id,
          recipientModel: "User",
          title: "New Quiz Assigned",
          message: `A new quiz "${quiz.title}" (Week ${quiz.week}) has been assigned to you. Check your dashboard to attempt it.`,
          type: "quizAssigned"
        });
      }
    }
    
    if (notificationPayloads.length > 0) {
      await notify(notificationPayloads);
    }

    await Quiz.findByIdAndUpdate(quiz._id, { $addToSet: { assignedBatches: batch } });

    const superAdmin = await SuperAdmin.findOne({});
    if (superAdmin) {
      await notify({
        recipientId: superAdmin._id,
        recipientModel: "SuperAdmin",
        title: "Quiz Assigned to Interns",
        message: `Quiz "${quiz.title}" (Week ${quiz.week}) has been assigned to batch "${batch}" in domain "${quiz.domain}".`,
        type: "quizAssigned"
      });
    }

    res.json({ success: true, message: "Quiz assigned successfully. Notifications sent." });
  } catch (error) {
    console.error("Error assigning quiz:", error);
    res.status(500).json({ success: false, message: "Failed to assign quiz" });
  }
});

// ------------------- 8️⃣ DELETE WHOLE QUIZ -------------------
router.post("/delete-quiz/:quizId", async (req, res) => {
  try {
    const quizId = req.params.quizId;

    const quiz = await Quiz.findByIdAndDelete(quizId);
    if (!quiz) {
      return res.status(404).json({ success: false, message: "Quiz not found" });
    }

    await User.updateMany(
      {},
      {
        $pull: { quizAssignments: { quizId: quizId } },
        $set: { quiz_score: 0 },
      }
    );

    res.json({ success: true, message: "Quiz deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete quiz" });
  }
});

// ------------------- 9️⃣ TOGGLE QUIZ START/STOP -------------------
router.post("/toggle-start", async (req, res) => {
  try {
    const { quizId, isClosed } = req.body;
    await Quiz.findByIdAndUpdate(quizId, { isClosed });
    req.flash("success", `Response ${isClosed ? "Disabled" : "Enabled"}`);
  } catch (err) {
    req.flash("error", "Quiz Route Error");
  }
});

module.exports = router;
