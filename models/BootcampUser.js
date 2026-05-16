const mongoose = require("mongoose");

const bootcampUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  profile_image: { 
    type: String, 
    default: "https://i.pinimg.com/736x/e6/31/f1/e631f170b5dfc882ed2845b521653ecb.jpg" 
  },
  otp: { type: String, default: null },
  otpExpiry: { type: Date, default: null },
  enrolledBootcamps: [
    {
      bootcamp_id: { type: mongoose.Schema.Types.ObjectId, ref: "Bootcamp" },
      progress: { type: Number, default: 0 },
      certificate_id: { type: String, default: null },
      certificate_date: { type: Date, default: null },
      attendance: [
        {
          session_id: { type: Number },
          status: { type: String, enum: ['present', 'absent', 'pending'], default: 'pending' }
        }
      ]
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("BootcampUser", bootcampUserSchema);
