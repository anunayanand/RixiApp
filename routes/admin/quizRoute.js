const express = require("express");
const router = express.Router();
const quizController = require('../../controllers/admin/quizController');

// ------------------- 1️⃣ CREATE QUIZ -------------------
router.post("/create", quizController.quizUpload.array("images"), quizController.createQuiz);

// ------------------- 2️⃣ ASSIGN QUIZ -------------------
router.post("/assign", quizController.assignQuiz);

// ------------------- 8️⃣ DELETE WHOLE QUIZ -------------------
router.post("/delete-quiz/:quizId", quizController.deleteQuiz);

// ------------------- 9️⃣ TOGGLE QUIZ START/STOP -------------------
router.post("/toggle-start", quizController.toggleQuiz);

module.exports = router;
