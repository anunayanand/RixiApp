const express = require("express");
const router = express.Router();
const startQuizController = require("../../controllers/intern/startQuizController");
const authRole = require("../../middleware/authRole"); // ensure you have this if used in index.js, or not needed if mapped in index.js

// Assuming the route mapping includes the authRole, but to be safe let's add authRole if not present
// The original file didn't use authRole on the router itself, it might be in index.js.
// original: router.get("/quiz/:quizId", async (req, res) => { ... })
router.get("/quiz/:quizId", startQuizController.renderQuizPage);
router.post("/quiz/:quizId/submit", startQuizController.submitQuiz);

module.exports = router;
