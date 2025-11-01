const express = require("express");
const router = express.Router();
const Quiz = require("../models/Quiz");
const User = require("../models/User");
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

    const questionsWithImages = questions.map((q, index) => ({
      questionText: q.questionText,
      options: q.options,
      correctAnswer: q.correctAnswer,
      image: files[index] ? files[index].path : null,
    }));

    const quiz = new Quiz({
      title,
      week : Number(week),
      domain,
      questions: questionsWithImages,
    });

    await quiz.save();
    req.flash("success", "Quiz created successfully");
    res.redirect("/admin"); // Redirect to your quiz list page
  } catch (error) {
    console.error(error);
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

    await User.updateMany(
      { batch_no: batch, domain: quiz.domain,duration : quiz.week, role: "intern" },
      {
        $addToSet: {
          quizAssignments: {
            quizId: quiz._id,
            batch,
            assigned: true,
            score: 0,
            attemptCount: 0,
          },
        },
      }
    );
     await Quiz.findByIdAndUpdate(
      quiz._id,
      { $addToSet: { assignedBatches: batch } } // add batch only if not already present
    );

    req.flash("success", "Quiz assigned successfully");
    res.redirect("/admin");
  } catch (error) {
    console.error(error);
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
    $pull: { quizAssignments: { quizId: quizId } }, // remove the quiz assignment
    $set: { quiz_score: 0 } // reset score
  }
);


    req.flash("success", "Quiz deleted successfully");
    res.redirect("/admin");
  } catch (error) {
    console.error(error);
    req.flash("error", "Failed to delete quiz");
    res.redirect("/admin");
  }
});

router.post('/toggle-start', async (req, res) => {
  try {
    const { quizId, isClosed } = req.body;

    await Quiz.findByIdAndUpdate(quizId, { isClosed });

    req.flash("success",`Response ${isClosed ? 'Disabled' : 'Enabled'}`)
  } catch(err) {
    req.flash("error","Quiz Route Error");
  }
});

module.exports = router;
