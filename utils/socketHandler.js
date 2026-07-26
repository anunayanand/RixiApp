const { Server } = require("socket.io");
const ChatMessage = require("../models/ChatMessage");

module.exports = function (server) {
  const io = new Server(server, {
    cors: {
      origin: "*", // Adjust as needed
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    // console.log("New socket connection:", socket.id);

    // Join a room for a specific ticket
    socket.on("join_ticket", (ticketId) => {
      socket.join(ticketId);
      // console.log(`Socket ${socket.id} joined ticket room: ${ticketId}`);
    });

    // Handle message delivered receipt
    socket.on("message_delivered", async (data) => {
      try {
        const { messageId, ticketId } = data;
        const msg = await ChatMessage.findById(messageId);
        
        if (msg && msg.status === 'sent') {
          msg.status = 'delivered';
          await msg.save();
          // Broadcast to the room that message was delivered
          io.to(ticketId).emit("message_status_update", {
            messageId,
            status: 'delivered'
          });
        }
      } catch (err) {
        console.error("Error updating message to delivered:", err);
      }
    });

    // Handle message read receipt
    socket.on("message_read", async (data) => {
      try {
        const { messageId, ticketId } = data;
        const msg = await ChatMessage.findById(messageId);
        
        if (msg && (msg.status === 'sent' || msg.status === 'delivered' || msg.isRead === false)) {
          msg.status = 'read';
          msg.isRead = true; // Keep backward compatibility
          await msg.save();
          // Broadcast to the room that message was read
          io.to(ticketId).emit("message_status_update", {
            messageId,
            status: 'read'
          });
        }
      } catch (err) {
        console.error("Error updating message to read:", err);
      }
    });

    socket.on("disconnect", () => {
      // console.log("Socket disconnected:", socket.id);
    });
  });

  // Make io instance available globally or attach to app if needed
  global.io = io;
  return io;
};
