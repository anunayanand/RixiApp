const mongoose = require("mongoose");

const newRegistrationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  university: { type: String, required: true },
  college: { type: String, required: true },
  course: { type: String, required: true },
  branch: { type: String, required: true },
  year_sem: { type: String, required: true },
  domain: { type: String, required: true },
  duration: { type: Number, required: true },
  referral_code: { type: String, default: "" },
  payID: { type: String, default: "" },
  order_id: { type: String, default: "" },
  terms: { type: Boolean, required: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  isCreated: { type: Boolean, default: false },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  approvedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  payment_status: {
    type: String,
    enum: ["PENDING", "SUCCESS", "FAILED"],
    default: "PENDING"
  },
  // Profile image fields
  profile_image_url: { 
    type: String, 
    default: "https://i.pinimg.com/736x/e6/31/f1/e631f170b5dfc882ed2845b521653ecb.jpg" 
  },
  profile_image_public_id: { type: String }
});

module.exports = mongoose.model("NewRegistration", newRegistrationSchema);