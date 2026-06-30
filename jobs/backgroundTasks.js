const cron = require("node-cron");
const axios = require('axios');
const { exportData } = require("../scripts/downloadData");

const User = require("../models/User");
const Admin = require("../models/Admin");
const Ambassador = require("../models/Ambassador");
const SuperAdmin = require("../models/SuperAdmin");

const urlIn = "https://rixilab.in";
const urlTech = "https://rixilab.tech";

const interval = 60000;

function reloadWebsite() {
  axios
    .get(urlIn)
    .then((response) => {
      // console.log("website reloded .in");
    })
    .catch((error) => {
      console.error(`Error (.in) : ${error.message}`);
    });

  axios
    .get(urlTech)
    .then((response) => {
      // console.log("website reloded .tech");
    })
    .catch((error) => {
      console.error(`Error (.tech) : ${error.message}`);
    });
}

setInterval(reloadWebsite, interval);

// Cleanup mechanism: Mark users as offline if no heartbeat received in 2 minutes
const HEARTBEAT_TIMEOUT = 2 * 60 * 1000; // 2 minutes
const CLEANUP_INTERVAL = 30000; // Check every 30 seconds

setInterval(async () => {
  try {
    const cutoff = new Date(Date.now() - HEARTBEAT_TIMEOUT);
    
    // Update all users with lastHeartbeat older than cutoff to isOnline: false
    await User.updateMany(
      { isOnline: true, lastHeartbeat: { $lt: cutoff } },
      { $set: { isOnline: false } }
    );
    
    await Admin.updateMany(
      { isOnline: true, lastHeartbeat: { $lt: cutoff } },
      { $set: { isOnline: false } }
    );
    
    await Ambassador.updateMany(
      { isOnline: true, lastHeartbeat: { $lt: cutoff } },
      { $set: { isOnline: false } }
    );
    
    await SuperAdmin.updateMany(
      { isOnline: true, lastHeartbeat: { $lt: cutoff } },
      { $set: { isOnline: false } }
    );
    
    // console.log("isOnline cleanup completed");
  } catch (err) {
    // console.error("Error during isOnline cleanup:", err);
  }
}, CLEANUP_INTERVAL);

// ==============================
// MONTHLY DATABASE BACKUP (Last day of every month at 23:59)
// ==============================
// Cron runs at 21:59 on days 28-31 — we check inside if it's truly the last day
cron.schedule("59 21 28-31 * *", async () => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  // If tomorrow is the 1st, today is the last day of the month
  if (tomorrow.getDate() === 1) {
    // console.log("[Monthly Backup] Running end-of-month DB backup...");
    await exportData();
    // console.log("[Monthly Backup] Done.");
  }
});
