const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  emp_id: { type: String, unique: true, sparse: true },
  designation: { type: String },
  domain: { type: String },
  img_url: {
    type: String,
    default:
      "https://i.pinimg.com/736x/e6/31/f1/e631f170b5dfc882ed2845b521653ecb.jpg",
  },
  img_public_id: { type: String },
  isFirstLogin: { type: Boolean, default: true },
  lastLogin: { type: Date },
  joining_date: { type: Date,default: Date.now },
  isOnline: { type: Boolean, default: false },
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
  notifications: [
    {
      title: { type: String, required: true },
      message: { type: String, required: true },
      type: {
        type: String,
        enum: ["meeting", "project", "quizAssigned", "quizSubmitted", "progress"],
        required: true,
      },
      createdAt: { type: Date, default: Date.now },
      isRead: { type: Boolean, default: false },
    },
  ],
  notifiedInterns: [{ type: String, default: [] }],
  notice: [
    {
      title: { type: String },
      description: { type: String },
    },
  ],
  twoFASecret: { type: String, default: null },
  resetToken: { type: String, default: null },
  otp: String,
  otpExpiry: Date,
});

module.exports = mongoose.model("Admin", adminSchema);