const mongoose = require("mongoose");

const certificatePurchaseSchema = new mongoose.Schema({
  internId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  domain: { type: String },
  amount: { type: Number, required: true },
  transactionId: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("CertificatePurchase", certificatePurchaseSchema);
