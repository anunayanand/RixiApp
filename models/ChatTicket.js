const mongoose = require("mongoose");

const chatTicketSchema = new mongoose.Schema({
  internId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "closed"],
    default: "pending"
  }
}, { timestamps: true });

module.exports = mongoose.model("ChatTicket", chatTicketSchema);
