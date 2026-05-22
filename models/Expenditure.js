const mongoose = require("mongoose");

const expenditureSchema = new mongoose.Schema({
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  description: { type: String, default: "" },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "SuperAdmin" },
  transactionId: { type: String, required: true },
  date : { type: Date, default: Date.now },
});

module.exports = mongoose.model("Expenditure", expenditureSchema);
