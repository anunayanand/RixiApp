const express = require("express");
const router = express.Router();
const ChatTicket = require("../models/ChatTicket");
const ChatMessage = require("../models/ChatMessage");
const User = require("../models/User");
const Admin = require("../models/Admin");

// Check authentication
const checkAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    next();
};

/**
 * =======================
 * INTERN ROUTES
 * =======================
 */

// 1. Intern: Raise a new ticket
router.post("/ticket", checkAuth, async (req, res) => {
    try {
        if (req.session.role !== "intern") return res.status(403).json({ success: false, message: "Forbidden" });

        const internId = req.session.user;
        const { subject } = req.body;

        if (!subject) {
            return res.status(400).json({ success: false, message: "Subject is required" });
        }

        // Check if an active ticket already exists for this intern
        const existingTicket = await ChatTicket.findOne({
            internId,
            status: { $in: ["pending", "accepted"] }
        });

        if (existingTicket) {
            return res.status(400).json({ success: false, message: "You already have an active ticket" });
        }

        // Get intern to find their domain
        const intern = await User.findById(internId);
        if (!intern) return res.status(404).json({ success: false, message: "Intern not found" });

        // Find the admin/mentor for this domain
        const admin = await Admin.findOne({ domain: intern.domain });
        if (!admin) return res.status(404).json({ success: false, message: "No mentor found for your domain" });

        const newTicket = new ChatTicket({
            internId,
            adminId: admin._id,
            subject
        });

        await newTicket.save();
        res.json({ success: true, ticket: newTicket });

    } catch (err) {
        console.error("Error creating chat ticket:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// 2. Intern / Admin: Get active ticket & messages
router.get("/ticket/status", checkAuth, async (req, res) => {
    try {
        const userId = req.session.user;
        const role = req.session.role; // 'intern' or 'admin'

        // If Intern: Get own active ticket
        if (role === 'intern') {
             const ticket = await ChatTicket.findOne({
                internId: userId,
                status: { $ne: "closed" }
            }).populate("adminId", "name img_url isOnline");

            if (!ticket) {
                return res.json({ success: true, ticket: null });
            }

            // Get unread count for this intern (messages from admin)
            const unreadCount = await ChatMessage.countDocuments({
                 ticketId: ticket._id,
                 senderRole: "admin",
                 isRead: false
            });

            return res.json({ success: true, ticket, unreadCount });
        } 
        
        // If Admin: Get specific ticket details is usually handled by a different flow, but we can do a quick check here
        res.status(400).json({ success: false, message: "Use /tickets for admin" });

    } catch (err) {
        console.error("Error getting chat ticket status:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

/**
 * =======================
 * ADMIN ROUTES
 * =======================
 */

// 3. Admin: List all tickets in domain
router.get("/tickets", checkAuth, async (req, res) => {
    try {
        if (req.session.role !== "admin") return res.status(403).json({ success: false, message: "Forbidden" });

        const adminId = req.session.user;

        // Fetch tickets
        const tickets = await ChatTicket.find({ adminId })
            .populate("internId", "name intern_id img_url batch_no isOnline")
            .sort({ updatedAt: -1 });

        // Augment tickets with unread counts
        const augmentedTickets = await Promise.all(tickets.map(async (t) => {
             const unreadCount = await ChatMessage.countDocuments({
                 ticketId: t._id,
                 senderRole: "intern",
                 isRead: false
             });
             const ticketObj = t.toObject();
             ticketObj.unreadCount = unreadCount;
             return ticketObj;
        }));

        res.json({ success: true, tickets: augmentedTickets });
    } catch (err) {
        console.error("Error fetching tickets:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// 4. Admin: Accept a ticket
router.post("/ticket/:id/accept", checkAuth, async (req, res) => {
    try {
        if (req.session.role !== "admin") return res.status(403).json({ success: false, message: "Forbidden" });

        const ticket = await ChatTicket.findOneAndUpdate(
            { _id: req.params.id, adminId: req.session.user },
            { status: "accepted" },
            { new: true }
        );

        if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });

        res.json({ success: true, ticket });
    } catch (err) {
        console.error("Error accepting ticket:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// 5. Admin: Close a ticket
router.post("/ticket/:id/close", checkAuth, async (req, res) => {
    try {
         if (req.session.role !== "admin") return res.status(403).json({ success: false, message: "Forbidden" });

         const ticket = await ChatTicket.findOneAndDelete({
            _id: req.params.id,
            adminId: req.session.user
         });

         if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });

         // Also delete all associated messages to completely remove the chat
         await ChatMessage.deleteMany({ ticketId: ticket._id });

        if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });

        res.json({ success: true, ticket });
    } catch (err) {
        console.error("Error closing ticket:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

/**
 * =======================
 * SHARED ROUTES
 * =======================
 */

// 6. Send a message
router.post("/message", checkAuth, async (req, res) => {
    try {
        const { ticketId, text } = req.body;
        const senderId = req.session.user;
        const senderRole = req.session.role;

        if (!ticketId || !text) {
             return res.status(400).json({ success: false, message: "Ticket ID and text are required" });
        }

        const ticket = await ChatTicket.findById(ticketId);
        if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });

        // Verify permission to post
        if (senderRole === 'intern' && ticket.internId.toString() !== senderId.toString()) {
            return res.status(403).json({ success: false, message: "Not your ticket" });
        }
        if (senderRole === 'admin' && ticket.adminId.toString() !== senderId.toString()) {
             return res.status(403).json({ success: false, message: "Not your ticket" });
        }
        if (ticket.status !== 'accepted') {
             return res.status(400).json({ success: false, message: "Ticket is not open for messaging" });
        }

        const msg = new ChatMessage({
             ticketId,
             senderId,
             senderRole,
             text
        });

        await msg.save();
        
        // Update ticket timestamp
        ticket.updatedAt = new Date();
        await ticket.save();

        res.json({ success: true, message: msg });
    } catch (err) {
        console.error("Error sending message:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// 7. Get messages (Polling endpoint)
router.get("/messages/:ticketId", checkAuth, async (req, res) => {
    try {
         const { ticketId } = req.params;
         const { lastMessageId } = req.query; // optional, to fetch only new messages
         const userId = req.session.user;
         const role = req.session.role;

         const ticket = await ChatTicket.findById(ticketId).populate('internId', 'isOnline').populate('adminId', 'isOnline');
         if (!ticket) {
             // If ticket is deleted (e.g. closed), return closed status to let frontend clean up
             return res.json({ success: true, status: 'closed' });
         }

         // Verify permission
         if (role === 'intern' && ticket.internId._id.toString() !== userId.toString()) {
              return res.status(403).json({ success: false, message: "Forbidden" });
         }
         if (role === 'admin' && ticket.adminId._id.toString() !== userId.toString()) {
              return res.status(403).json({ success: false, message: "Forbidden" });
         }

         let query = { ticketId };
         if (lastMessageId) {
              query._id = { $gt: lastMessageId };
         }

         const messages = await ChatMessage.find(query).sort({ createdAt: 1 });

         // Optional: return opponent's online status alongside the messages pool
         const opponentIsOnline = role === "intern" ? ticket.adminId.isOnline : ticket.internId.isOnline;

         res.json({ success: true, messages, status: ticket.status, opponentIsOnline });
    } catch (err) {
        console.error("Error getting messages:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// 8. Mark messages as read
router.post("/mark-read/:ticketId", checkAuth, async (req, res) => {
    try {
        const { ticketId } = req.params;
        const role = req.session.role;

        // The opposing role whose messages you are reading
        const targetRole = role === "intern" ? "admin" : "intern";

        await ChatMessage.updateMany(
            { ticketId, senderRole: targetRole, isRead: false },
            { $set: { isRead: true } }
        );

        res.json({ success: true });
    } catch (err) {
        console.error("Error marking messages read:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// 9. Global unread count across all accepted tickets (for the dashboard badge)
router.get("/unread-badge", checkAuth, async (req, res) => {
    try {
        const userId = req.session.user;
        const role = req.session.role;

        if (role === "admin") {
            const tickets = await ChatTicket.find({ adminId: userId, status: "accepted" }).select("_id");
            const ticketIds = tickets.map(t => t._id);
            const count = await ChatMessage.countDocuments({
                ticketId: { $in: ticketIds },
                senderRole: "intern",
                isRead: false
            });
            return res.json({ success: true, count });
        } else if (role === "intern") {
            const ticket = await ChatTicket.findOne({ internId: userId, status: "accepted" }).select("_id");
            if (!ticket) return res.json({ success: true, count: 0 });
            
            const count = await ChatMessage.countDocuments({
                ticketId: ticket._id,
                senderRole: "admin",
                isRead: false
            });
            return res.json({ success: true, count });
        }

        res.json({ success: true, count: 0 });
    } catch (err) {
         console.error("Error getting unread badge:", err);
         res.status(500).json({ success: false, message: "Server error" });
    }
});
// 10. Ping admin online status
router.get("/ping-admin", checkAuth, async (req, res) => {
    try {
        if (req.session.role !== "intern") return res.json({ success: false });
        const intern = await User.findById(req.session.user);
        if (!intern) return res.json({ success: false });
        
        const admin = await Admin.findOne({ domain: intern.domain });
        if (!admin) return res.json({ success: false });
        
        res.json({ success: true, isOnline: admin.isOnline });
    } catch (err) {
        res.json({ success: false });
    }
});
// 11. Ping intern online status
router.get("/ping-intern/:internId", checkAuth, async (req, res) => {
    try {
        if (req.session.role !== "admin") return res.json({ success: false });
        const intern = await User.findById(req.params.internId);
        if (!intern) return res.json({ success: false });
        
        res.json({ success: true, isOnline: intern.isOnline });
    } catch (err) {
        res.json({ success: false });
    }
});

module.exports = router;
