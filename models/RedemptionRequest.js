const mongoose = require("mongoose");

const redemptionRequestSchema = new mongoose.Schema({
  internId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  rewardType: { 
    type: String, 
    enum: [
      "Crunchyroll Premium 1 Month", 
      "Amazon/Flipkart/Myntra Rs 200", 
      "Amazon/Flipkart/Myntra Rs 500",
      "Amazon Rs 200 Voucher",
      "Amazon Rs 500 Voucher"
    ], 
    required: true 
  },
  pointsUsed: { 
    type: Number, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ["Pending", "Approved", "Rejected"], 
    default: "Pending" 
  },
  voucherCode: { type: String },
  moneySpent: { type: Number },
  processedAt: { type: Date },
  transactionId: { type: String },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model("RedemptionRequest", redemptionRequestSchema);
