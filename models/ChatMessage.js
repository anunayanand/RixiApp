const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema({
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ChatTicket",
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  senderRole: {
    type: String,
    enum: ["intern", "admin"],
    required: true
  },
  text: {
    type: String,
    // No longer strictly required since an image might not have text
  },
  type: {
    type: String,
    enum: ["text", "image"],
    default: "text"
  },
  imageUrl: {
    type: String
  },
  status: {
    type: String,
    enum: ["sent", "delivered", "read"],
    default: "sent"
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
