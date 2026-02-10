const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String , default: "intern" },
  domain: { type: String },
  college: { type: String },
  isFirstLogin: { type: Boolean, default: true },
  duration: { type: Number },
  branch: { type: String },
  course: { type: String },
  university: { type: String },
  year_sem: { type: String },
  intern_id: { type: String, unique: true, sparse: true },
  phone: { type: String, required: true },
  batch_no: { type: String },
  isOnline: { type: Boolean, default: false },
  certificate_id: {
    type: String,
    unique: true,
    default: function () {
      return `TEMP-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    },
  },
  referal_code: { type: String, default: "" },
  certificate_link: { type: String, default: "" },
  offer_letter: { type: String, default: "" },
  img_url: {
    type: String,
    default:
      "https://i.pinimg.com/736x/e6/31/f1/e631f170b5dfc882ed2845b521653ecb.jpg",
  },
  img_public_id: { type: String },
  joining_date: { type: Date, default: Date.now, immutable: true },
  starting_date: { type: Date },
  completion_date: { type: Date },
  lastLogin: { type: Date },
  confirmationSent: { type: Boolean, default: false },
  completionSent: { type: Boolean, default: false },
  whatsappLink: { type: String, default: "" },
  offer_letter_sent: { type: Boolean, default: false },
  quiz_score: { type: Number, default: 0 },
  isPassed: { type: Boolean, default: false },
  screenshot_img: { type: String, default: "" },
  screenshot_public_id: { type: String },
  lastHeartbeat: { type: Date, default: null },

  projectAssigned: [
    {
      projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
      },
      week: Number,
      status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending",
      },
    },
  ],

  quizAssignments: [
    {
      quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz" },
      assigned: { type: Boolean, default: true },
      batch: { type: String, required: true },
      score: { type: Number, default: 0 },
      attemptCount: { type: Number, default: 0 },
    },
  ],

  meetings: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, required: true },
      link: { type: String, required: true },
      title: { type: String, required: true },
      scheduledTime: { type: Date, required: true },
      week: { type: Number, required: true },
      status: {
        type: String,
        enum: ["upcoming", "completed", "cancelled"],
        default: "upcoming",
      },
      attendance: {
        type: String,
        enum: ["pending", "present", "absent"],
        default: "pending",
      },
    },
  ],
});

module.exports = mongoose.model("User", userSchema);
