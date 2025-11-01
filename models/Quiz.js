const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: { type: [String], validate: v => v.length === 4 },
  correctAnswer: { type: Number, required: true }, // index 0-3
  image: { type: String, default: null }, // optional
});

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  week: { type: Number, required: true },
  domain: { type: String, required: true }, // admin domain
  questions: [questionSchema],
  assignedBatches: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
  isClosed : {type: Boolean, default: false}
});

module.exports = mongoose.model("Quiz", quizSchema);
