const express = require('express');
const router = express.Router();
const User = require("../models/User");
const Admin = require("../models/Admin");
const Ambassador = require("../models/Ambassador");
const SuperAdmin = require("../models/SuperAdmin");

// Heartbeat route - clients should call this every 30 seconds
router.post("/heartbeat", async (req, res) => {
  try {
    if (!req.session || !req.session.user || !req.session.role) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const userId = req.session.user;
    const userRole = req.session.role;
    const now = new Date();

    // Update lastHeartbeat timestamp based on role
    switch (userRole) {
      case "intern":
        await User.findByIdAndUpdate(userId, { 
          isOnline: true, 
          lastHeartbeat: now 
        });
        break;
      case "admin":
        await Admin.findByIdAndUpdate(userId, { 
          isOnline: true, 
          lastHeartbeat: now 
        });
        break;
      case "ambassador":
        await Ambassador.findByIdAndUpdate(userId, { 
          isOnline: true, 
          lastHeartbeat: now 
        });
        break;
      case "superAdmin":
        await SuperAdmin.findByIdAndUpdate(userId, { 
          isOnline: true, 
          lastHeartbeat: now 
        });
        break;
    }

    res.json({ success: true, timestamp: now });
  } catch (err) {
    // console.error("Heartbeat error:", err);
    res.status(500).json({ error: "Heartbeat failed" });
  }
});

module.exports = router;
