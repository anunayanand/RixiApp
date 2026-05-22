const mongoose = require("mongoose");

const paymentTransactionSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, required: true },
  recipientModel: { type: String, enum: ['Ambassador', 'Admin'], required: true },
  recipientName: { type: String, required: true },
  recipientEmail: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['AmbassadorWithdrawal', 'AdminSalary', 'PFWithdrawal'], required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  transactionId: { type: String, default: "" },
  title: { type: String, default: "" },
  paymentDetails: { type: String, default: "" },
  requestedAt: { type: Date, default: Date.now },
  processedAt: { type: Date },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String, default: "" }
});

module.exports = mongoose.model("PaymentTransaction", paymentTransactionSchema);
