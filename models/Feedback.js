const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  overallRating: {
    type: Number,
    required: true,
    min: 0,
    max: 5
  },
  quizRating: {
    type: Number,
    required: true,
    min: 0,
    max: 5
  },
  projectRating: {
    type: Number,
    required: true,
    min: 0,
    max: 5
  },
  experienceText: {
    type: String,
    required: true
  },
  suggestions: {
    type: String,
    default: ""
  },
  linkedinUrl: {
    type: String,
    default: ""
  },
  githubUrl: {
    type: String,
    default: ""
  },
  profilePictureConsent: {
    type: Boolean,
    default: false
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Feedback", feedbackSchema);
