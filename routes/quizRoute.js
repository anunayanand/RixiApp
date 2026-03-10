const express = require("express");
const router = express.Router();
const Quiz = require("../models/Quiz");
const User = require("../models/User");
const SuperAdmin = require("../models/SuperAdmin");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

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
      superAdmin.notifications.push({
        title: "New Quiz Created",
        message: `A new quiz "${title}" (Week ${week}) has been created for domain "${domain}".`,
        type: "quizAssigned",
        createdAt: new Date(),
        isRead: false,
      });
      await superAdmin.save();
    }

    req.flash("success", "Quiz created successfully. Notification sent to SuperAdmin.");
    res.redirect("/admin");
  } catch (error) {
    req.flash("error", "Failed to create quiz");
    res.redirect("/admin");
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
      req.flash("warning", "No eligible interns found for this quiz.");
      return res.redirect("/admin");
    }

    // 🔹 Notification for interns
    const internNotification = {
      title: "New Quiz Assigned",
      message: `A new quiz "${quiz.title}" (Week ${quiz.week}) has been assigned to you. Check your dashboard to attempt it.`,
      type: "quizAssigned",
      createdAt: new Date(),
      isRead: false,
    };

    // 🔹 Assign quiz and push notification for each intern
    for (let intern of interns) {
      // 🛡️ Defensive: Initialize arrays if they don't exist (for old database records)
      if (!intern.quizAssignments) {
        intern.quizAssignments = [];
      }
      if (!intern.notifications) {
        intern.notifications = [];
      }

      // 🧹 Remove null entries from quizAssignments array
      const originalLength = intern.quizAssignments.length;
      intern.quizAssignments = intern.quizAssignments.filter(q => q !== null && q !== undefined);
      const removedCount = originalLength - intern.quizAssignments.length;
      
      if (removedCount > 0) {
        console.log(`🧹 Removed ${removedCount} null entries from quizAssignments for intern ${intern._id}`);
        await intern.save(); // Save after cleaning null entries
      }

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
        intern.notifications.push(internNotification);
        await intern.save();
      }
    }

    // 🔹 Add batch to quiz.assignedBatches if not already present
    await Quiz.findByIdAndUpdate(quiz._id, {
      $addToSet: { assignedBatches: batch },
    });

    // 🔹 Notify superAdmin
    const superAdmin = await SuperAdmin.findOne({});
    if (superAdmin) {
      superAdmin.notifications.push({
        title: "Quiz Assigned to Interns",
        message: `Quiz "${quiz.title}" (Week ${quiz.week}) has been assigned to batch "${batch}" in domain "${quiz.domain}".`,
        type: "quizAssigned",
        createdAt: new Date(),
        isRead: false,
      });
      await superAdmin.save();
    }

    req.flash("success", "Quiz assigned successfully. Notifications sent.");
    // console.log(`✅ Quiz "${quiz.title}" assigned successfully to batch "${batch}"`);
    res.redirect("/admin");
  } catch (error) {
    console.error("Error assigning quiz:", error);
    req.flash("error", "Failed to assign quiz");
    res.redirect("/admin");
  }
});

// ------------------- 8️⃣ DELETE WHOLE QUIZ -------------------
router.post("/delete-quiz/:quizId", async (req, res) => {
  try {
    const quizId = req.params.quizId;

    const quiz = await Quiz.findByIdAndDelete(quizId);
    if (!quiz) {
      req.flash("error", "Quiz not found");
      return res.redirect("/admin/quizzes");
    }

    await User.updateMany(
      {},
      {
        $pull: { quizAssignments: { quizId: quizId } },
        $set: { quiz_score: 0 },
      }
    );

    req.flash("success", "Quiz deleted successfully");
    res.redirect("/admin");
  } catch (error) {
    req.flash("error", "Failed to delete quiz");
    res.redirect("/admin");
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
