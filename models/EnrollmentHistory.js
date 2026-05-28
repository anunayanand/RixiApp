const mongoose = require("mongoose");

const enrollmentHistorySchema = new mongoose.Schema({
  internId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: { type: String, required: true },
  email: { type: String, required: true },
  amountPaid: { type: Number, required: true },
  transactionId: { type: String, required: true },
  enrollmentDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("EnrollmentHistory", enrollmentHistorySchema);
