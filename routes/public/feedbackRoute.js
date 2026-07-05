const express = require('express');
const router = express.Router();
const authRole = require("../../middleware/authRole");
const feedbackController = require("../../controllers/public/feedbackController");

// GET: Render Feedback Page
router.get("/intern/feedback", authRole("intern"), feedbackController.getFeedbackPage);

// POST: Submit Feedback
router.post("/intern/feedback", authRole("intern"), feedbackController.submitFeedback);

module.exports = router;
