const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Quiz = require("../models/Quiz");

// GET /intern/quiz/:quizId - render quiz page
router.get("/quiz/:quizId", async (req, res) => {
  try {
    const userAgent = req.headers["user-agent"];

    if (/mobile|android|iphone|ipad|tablet/i.test(userAgent)) {
      req.flash("error", "Quiz can only be taken on a desktop / laptop.");
      return res.redirect("/intern");
    }

    const intern_id = req.session.user;
    const { quizId } = req.params;

    const intern = await User.findById(intern_id);
    if (!intern) {
      req.flash("error", "Unauthorized access");
      return res.redirect("/login");
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      req.flash("error", "Quiz not found");
      return res.redirect("/intern");
    }

    const assignment = intern.quizAssignments.find(
      (a) => a.quizId.toString() === quizId.toString()
    );

    if (!assignment) {
      req.flash("error", "This quiz is not assigned to you");
      return res.redirect("/intern");
    }

    if (assignment.attemptCount >= 2) {
      req.flash("error", "You have reached the maximum attempts for this quiz");
      return res.redirect("/intern");
    }

    // Quiz duration: 1.5 minutes per question
    const numQuestions = quiz.questions.length;
    const quizDuration = numQuestions * 1.5;

    res.render("quiz", {
      quiz,
      intern,
      assignment,
      messages: req.flash(),
      quizDuration,
    });
  } catch (error) {
    req.flash("error", "Failed to load quiz");
    res.redirect("/intern");
  }
});

// POST /intern/quiz/:quizId/submit - handle quiz submission
router.post("/quiz/:quizId/submit", async (req, res) => {
  try {
    const intern_id = req.session.user;
    const { quizId } = req.params;

    // 1️⃣ Find intern
    const intern = await User.findById(intern_id);
    if (!intern) {
      req.flash("error", "Unauthorized access");
      return res.redirect("/login");
    }

    // 2️⃣ Find quiz
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      req.flash("error", "Quiz not found");
      return res.redirect("/intern/my-quizzes");
    }

    // 3️⃣ Find assignment
    const assignmentIndex = intern.quizAssignments.findIndex(
      (a) => a.quizId.toString() === quizId.toString()
    );

    if (assignmentIndex === -1) {
      req.flash("error", "This quiz is not assigned to you");
      return res.redirect("/intern/my-quizzes");
    }

    const assignment = intern.quizAssignments[assignmentIndex];

    // 4️⃣ Check attempt limit
    if (assignment.attemptCount >= 2) {
      req.flash("error", "You have reached the maximum attempts for this quiz");
      return res.redirect("/intern");
    }

    // 5️⃣ Calculate score
    const answers = req.body.answers || {};
    let score = 0;

    quiz.questions.forEach((q, index) => {
      const key = index.toString();
      const selected = answers[key];
      if (selected != null && Number(selected) === Number(q.correctAnswer)) {
        score += 1;
      }
    });

    const totalQuestions = quiz.questions.length;
    const percentage = ((score / totalQuestions) * 100).toFixed(2);

    // 6️⃣ Update intern record
    if (percentage >= 60) {
      intern.isPassed = true;
    }

    assignment.score = score;
    assignment.attemptCount += 1;
    intern.quizAssignments[assignmentIndex] = assignment;

    if (!intern.quiz_score || score > intern.quiz_score) {
      intern.quiz_score = score;
    }

    await intern.save();

    // 7️⃣ Notify SuperAdmin and Admins
    const notificationMessage = `${intern.name} has submitted the quiz "${quiz.title}" (Week ${quiz.week}) in domain "${quiz.domain}".`;

    // SuperAdmin notification
    const superAdmin = await User.findOne({ role: "superAdmin" });
    if (superAdmin) {
      superAdmin.notifications.push({
        title: "Quiz Submitted by Intern",
        message: notificationMessage,
        type: "quizSubmitted",
        createdAt: new Date(),
        isRead: false,
      });
      await superAdmin.save();
    }

    // Admin notification
    const admins = await User.find({ role: "admin", domain: intern.domain });
    for (let admin of admins) {
      admin.notifications.push({
        title: "Quiz Submitted",
        message: notificationMessage,
        type: "quizSubmitted",
        createdAt: new Date(),
        isRead: false,
      });
      await admin.save();
    }

    // 8️⃣ Confirmation message to intern
    req.flash(
      "success",
      `Quiz submitted successfully! You scored ${score}/${totalQuestions} (${percentage}%).`
    );
    res.redirect("/intern");
  } catch (error) {
    req.flash("error", "Failed to submit quiz");
    res.redirect("/intern");
  }
});

module.exports = router;
