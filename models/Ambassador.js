const mongoose = require("mongoose");

const ambassadorSchema = new mongoose.Schema({
  referralId: { type: String, unique: true, required: true },
  ambassador_id : {type:String, required : true, unique : true},
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true,  },
  password: { type: String, required: true },
  isFirstLogin: { type: Boolean, default: true },
  isOnline: { type: Boolean, default: false },
  college: { type: String },
  university: { type: String },
  designation: { type: String },
  role: { type: String, default: "ambassador", immutable: true },
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    pincode: { type: String },
  },
  gender: { type: String, enum: ["Male", "Female", "Other"] },
  joining_date: { type: Date, default: Date.now, immutable: true },
  lastHeartbeat: { type: Date, default: null },
  linkedin_profile_url: { type: String },
  insta_profile_url: { type: String },
  internCount: { type: Number, default: 0 },
  offer_letter_link: { type: String },
  certificate_link :{ type: String },
  offer_letter_sent : { type: Boolean, default: false },
  certificate_sent : { type: Boolean, default: false },
  bronze_mail_sent: { type: Boolean, default: false },
  silver_mail_sent: { type: Boolean, default: false },
  gold_mail_sent: { type: Boolean, default: false },
  badge: { 
    type: String, 
    enum: ["None", "Bronze", "Silver", "Gold"], 
    default: "None" 
  },
  img_url: { type: String ,default: "https://i.pinimg.com/736x/e6/31/f1/e631f170b5dfc882ed2845b521653ecb.jpg" },
}, { timestamps: true });

// 🏅 Badge updater method
ambassadorSchema.methods.updateBadge = function () {
  if (this.internCount >= 50) this.badge = "Gold";
  else if (this.internCount >= 25) this.badge = "Silver";
  else if (this.internCount >= 10) this.badge = "Bronze";
  else this.badge = "None";
};

// 🔄 Pre-save hook to auto-update badge
ambassadorSchema.pre("save", function(next) {
  this.updateBadge();
  next();
});

module.exports = mongoose.model("Ambassador", ambassadorSchema);
