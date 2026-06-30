const express = require('express');
const router = express.Router();
const User = require("../../models/User");
const Admin = require("../../models/Admin");
const Ambassador = require("../../models/Ambassador");
const SuperAdmin = require("../../models/SuperAdmin");

// Cache to reduce database write frequency
const lastHeartbeatCache = new Map();
const DB_UPDATE_INTERVAL = 60000; // 1 minute in milliseconds

// Heartbeat route - clients should call this every 30 seconds
router.post("/heartbeat", async (req, res) => {
  try {
    if (!req.session || !req.session.user || !req.session.role) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const userId = req.session.user;
    const userRole = req.session.role;
    const now = new Date();
    const nowMs = now.getTime();
    
    // Create a unique cache key for this user
    const cacheKey = `${userRole}:${userId}`;
    const lastUpdate = lastHeartbeatCache.get(cacheKey) || 0;

    // Only update database if it's been more than DB_UPDATE_INTERVAL since last update
    if (nowMs - lastUpdate > DB_UPDATE_INTERVAL) {
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
      
      // Update cache after successful DB update
      lastHeartbeatCache.set(cacheKey, nowMs);
    }

    res.json({ success: true, timestamp: now });
  } catch (err) {
    // console.error("Heartbeat error:", err);
    res.status(500).json({ error: "Heartbeat failed" });
  }
});

// Cleanup cache periodically to prevent memory leaks (runs every hour)
setInterval(() => {
  const nowMs = Date.now();
  for (const [key, timestamp] of lastHeartbeatCache.entries()) {
    // If we haven't seen a heartbeat for > 2 hours, remove from cache
    if (nowMs - timestamp > 2 * 60 * 60 * 1000) {
      lastHeartbeatCache.delete(key);
    }
  }
}, 60 * 60 * 1000);

module.exports = router;
