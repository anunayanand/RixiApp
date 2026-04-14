const express = require('express');
const router = express.Router();
const User = require("../models/User");
const Feedback = require("../models/Feedback");
const authRole = require("../middleware/authRole");

// GET: Render Feedback Page
router.get("/intern/feedback", authRole("intern"), async (req, res, next) => {
  try {
    const intern = await User.findById(req.session.user);
    if (!intern) {
      req.flash("error", "Intern not found");
      return res.redirect("/login");
    }

    // Check if feedback is already submitted
    let existingFeedback = null;
    if (intern.feedbackSubmitted) {
      existingFeedback = await Feedback.findOne({ userId: intern._id });
    }

    res.render("feedback", { intern, existingFeedback });
  } catch (err) {
    console.error("Feedback GET Error:", err);
    next(err);
  }
});

// POST: Submit Feedback
router.post("/intern/feedback", authRole("intern"), async (req, res, next) => {
  try {
    const intern = await User.findById(req.session.user);
    if (!intern) {
      return res.status(404).json({ success: false, message: "Intern not found" });
    }

    if (intern.feedbackSubmitted) {
      return res.status(400).json({ success: false, message: "Feedback already submitted" });
    }

    const {
      overallRating,
      quizRating,
      projectRating,
      experienceText,
      suggestions,
      linkedinUrl,
      githubUrl,
      profilePictureConsent
    } = req.body;

    // Validate required fields
    if (!overallRating || !quizRating || !projectRating || !experienceText || !suggestions || !linkedinUrl) {
      return res.status(400).json({ success: false, message: "Please provide all required fields: ratings, experience text, improvement suggestions and LinkedIn URL." });
    }

    // Create Feedback Document
    const feedback = new Feedback({
      userId: intern._id,
      overallRating: parseInt(overallRating, 10),
      quizRating: parseInt(quizRating, 10),
      projectRating: parseInt(projectRating, 10),
      experienceText: experienceText.trim(),
      suggestions: suggestions ? suggestions.trim() : "",
      linkedinUrl: linkedinUrl ? linkedinUrl.trim() : "",
      githubUrl: githubUrl ? githubUrl.trim() : "",
      profilePictureConsent: profilePictureConsent === true || profilePictureConsent === 'true'
    });

    await feedback.save();

    // Mark user as feedback submitted
    intern.feedbackSubmitted = true;
    await intern.save();

    return res.json({ success: true, message: "Feedback submitted successfully. Thank you!" });
  } catch (err) {
    console.error("Feedback POST Error:", err);
    return res.status(500).json({ success: false, message: "Server error while saving feedback" });
  }
});

module.exports = router;
