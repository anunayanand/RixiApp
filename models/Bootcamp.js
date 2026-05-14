const mongoose = require("mongoose");

const bootcampSchema = new mongoose.Schema({
  bootcamp_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  banner_img: { type: String, required: true },
  banner_public_id: { type: String }, // For Cloudinary
  isPaid: { type: Boolean, default: false },
  payment: {
    amount: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' }
  },
  sessions: [
    {
      session_id: { type: String, required: true },
      details: { type: String },
      time: { type: Date, required: true }, // Assumed IST
      link: { type: String, required: true },
      instructor: { type: String, required: true },
      expiryTime: { type: Date, required: true } // Assumed IST
    }
  ],
  usersEnrolled: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BootcampUser"
    }
  ],
  status: { type: String, enum: ['draft', 'live', 'expired'], default: 'draft' },
  start_date: { type: Date }, // IST
  end_date: { type: Date },   // IST
  creationDate: { type: Date, default: Date.now } // IST
});

module.exports = mongoose.model("Bootcamp", bootcampSchema);
