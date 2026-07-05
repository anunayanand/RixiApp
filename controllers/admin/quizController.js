const Quiz = require("../../models/Quiz");
const User = require("../../models/User");
const SuperAdmin = require("../../models/SuperAdmin");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const { notify } = require("../../services/notifications/notificationService");
const asyncHandler = require("../../utils/asyncHandler");

// ------------------- Cloudinary Storage -------------------
const quizStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "quiz_images",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});
exports.quizUpload = multer({ storage: quizStorage });

// ------------------- 1️⃣ CREATE QUIZ -------------------
exports.createQuiz = asyncHandler(async (req, res) => {
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
});

// ------------------- 2️⃣ ASSIGN QUIZ -------------------
exports.assignQuiz = asyncHandler(async (req, res) => {
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
  
  if (!interns.length) {
    return res.status(404).json({ success: false, message: "No eligible interns found for this quiz." });
  }

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
});

// ------------------- 8️⃣ DELETE WHOLE QUIZ -------------------
exports.deleteQuiz = asyncHandler(async (req, res) => {
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
});

// ------------------- 9️⃣ TOGGLE QUIZ START/STOP -------------------
exports.toggleQuiz = asyncHandler(async (req, res) => {
  const { quizId, isClosed } = req.body;
  await Quiz.findByIdAndUpdate(quizId, { isClosed });
  req.flash("success", `Response ${isClosed ? "Disabled" : "Enabled"}`);
});
