const mongoose = require("mongoose");

const bootcampManagerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "bootcamp_manager" },
  profile_image: { 
    type: String, 
    default: "https://i.pinimg.com/736x/e6/31/f1/e631f170b5dfc882ed2845b521653ecb.jpg" 
  },
  notifications: [
    {
      message: { type: String, required: true },
      date: { type: Date, default: Date.now },
      isRead: { type: Boolean, default: false }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("BootcampManager", bootcampManagerSchema);
