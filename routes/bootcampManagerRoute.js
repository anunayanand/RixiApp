const express = require("express");
const router = express.Router();
const authRole = require("../middleware/authRole");
const BootcampManager = require("../models/BootcampManager");
const Bootcamp = require("../models/Bootcamp");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const { google } = require("googleapis");
const mongoose = require("mongoose");

const rawUrl = process.env.BASE_URL || 'https://rixilab.tech';
const BASE_URL = rawUrl.replace('https://', 'www.');

// ==============================
// GMAIL API CONFIGURATION
// ==============================
const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI,
);
oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });
const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

function makeBody(to, from, subject, message) {
  const str = [
    'Content-Type: text/html; charset="UTF-8"\n',
    "MIME-Version: 1.0\n",
    "Content-Transfer-Encoding: 7bit\n",
    "to: ",
    to,
    "\n",
    "from: ",
    from,
    "\n",
    "subject: ",
    subject,
    "\n\n",
    message,
  ].join("");
  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

async function sendCompletionEmail(user, bootcamp) {
  const certificateLink = `${process.env.BASE_URL || "https://www.rixilab.tech"}/bootcamp-portal/login`;

  const subject = `Congratulations on Completing ${bootcamp.name} - Rixi Lab`;

  const body = `

<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>

<style>

body{
  margin:0;
  padding:0;
  background:#f5f5f5;
  font-family:Arial,sans-serif;
}

table{
  border-spacing:0;
}

img{
  border:0;
  display:block;
}

@media screen and (max-width:600px){

  .container{
    width:100% !important;
  }

  .content{
    padding:24px 16px !important;
  }

  .heading{
    font-size:24px !important;
    line-height:1.3 !important;
  }

  .subtext{
    font-size:13px !important;
    line-height:1.7 !important;
  }

  .normal-text{
    font-size:13px !important;
    line-height:1.8 !important;
  }

  .achievement-title{
    font-size:15px !important;
  }

  .list-text{
    font-size:13px !important;
  }

  .button{
    display:block !important;
    width:100% !important;
    box-sizing:border-box !important;
    padding:14px 18px !important;
    font-size:14px !important;
    border-radius:10px !important;
  }

  .achievement-card{
    padding:20px !important;
  }

  .footer-text{
    font-size:11px !important;
  }

}

</style>
</head>

<body>

<table width="100%" bgcolor="#f5f5f5" cellpadding="0" cellspacing="0">
<tr>
<td align="center" style="padding:24px 12px;">

<table
  width="600"
  class="container"
  cellpadding="0"
  cellspacing="0"
  bgcolor="#ffffff"
  style="
    max-width:600px;
    border-radius:22px;
    overflow:hidden;
    border:1px solid #ececec;
  "
>

<tr>
  <td height="6" bgcolor="#ff6600"></td>
</tr>

<tr>
<td class="content" style="padding:40px 30px;">

<!-- Logo -->
<table width="100%">
<tr>
<td align="center">

<table
  width="88"
  height="88"
  cellpadding="0"
  cellspacing="0"
  style="
    background:#fff3eb;
    border-radius:50%;
  "
>
<tr>
<td align="center" valign="middle">

<img
  src="https://rixilab.tech/img/Rixi%20Lab%20New%20Logo%20PNG.png"
  width="52"
  alt="Rixi Lab"
/>

</td>
</tr>
</table>

<h1
  class="heading"
  style="
    margin:22px 0 0;
    font-size:32px;
    line-height:1.25;
    color:#ff6600;
    font-weight:bold;
  "
>
  Congratulations 
</h1>

<p
  class="subtext"
  style="
    margin:12px 0 0;
    color:#777;
    font-size:14px;
    line-height:1.7;
  "
>
  You have successfully completed your bootcamp journey
</p>

</td>
</tr>
</table>

<!-- Greeting -->
<table width="100%" style="margin-top:38px;">
<tr>
<td>

<p
  style="
    margin:0;
    font-size:14px;
    color:#222;
    font-weight:500;
  "
>
  Hi <strong>${user.name}</strong>,
</p>

<p
  class="normal-text"
  style="
    margin:18px 0 0;
    font-size:12px;
    line-height:1.9;
    color:#555;
  "
>
  You’ve officially completed the program and your certificate
  is now ready to download from your dashboard.
</p>

<p
  class="normal-text"
  style="
    margin:16px 0 0;
    font-size:12px;
    line-height:1.9;
    color:#555;
  "
>
  Keep building, keep learning, and continue creating amazing things ahead.
  We’re excited to see what you achieve next.
</p>

</td>
</tr>
</table>

<!-- Achievement Information -->
<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  style="
    margin-top:28px;
    background:#fffaf7;
    border:1px solid #ffd8c2;
    border-radius:16px;
  "
>
<tr>
<td class="achievement-card" style="padding:24px;">

<p
  class="achievement-title"
  style="
    margin:0 0 16px;
    font-size:12px;
    font-weight:bold;
    color:#222;
  "
>
  Completion Details
</p>

<ul style="padding-left:18px;margin:0;color:#555;">

<li
  class="list-text"
  style="
    margin-bottom:10px;
    line-height:1.8;
    font-size:12px;
  "
>
  <strong>Bootcamp:</strong>
  ${bootcamp.name}
</li>

<li
  class="list-text"
  style="
    margin-bottom:10px;
    line-height:1.8;
    font-size:12px;
  "
>
  <strong>Status:</strong>
  Successfully Completed
</li>

<li
  class="list-text"
  style="
    line-height:1.8;
    font-size:12px;
  "
>
  <strong>Certificate:</strong>
  Available for Download
</li>

</ul>

</td>
</tr>
</table>

<!-- Button -->
<table width="100%" style="margin-top:32px;">
<tr>
<td align="center">

<a
  href="${certificateLink}"
  class="button"
  style="
    background:#ff6600;
    color:#ffffff;
    text-decoration:none;
    padding:14px 24px;
    border-radius:12px;
    font-weight:bold;
    display:inline-block;
    font-size:14px;
    line-height:1.2;
    box-sizing:border-box;
    max-width:100%;
  "
>
  Download Certificate
</a>

</td>
</tr>
</table>

<!-- Footer -->
<table
  width="100%"
  style="
    margin-top:40px;
    border-top:1px solid #ececec;
  "
>
<tr>
<td align="center" style="padding-top:24px;">

<p
  class="footer-text"
  style="
    margin:0;
    color:#888;
    font-size:12px;
    line-height:1.8;
  "
>
  Rixi Lab Bootcamp • Learn. Build. Grow.
</p>

<!-- Social Icons -->
<p style="margin:18px 0 0;">

<a
  href="https://www.instagram.com/rixilab.in"
  style="display:inline-block;margin:0 6px;"
>
  <img
    src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png"
    width="24"
    alt="Instagram"
  />
</a>

<a
  href="https://www.linkedin.com/company/rixilab"
  style="display:inline-block;margin:0 6px;"
>
  <img
    src="https://cdn-icons-png.flaticon.com/512/174/174857.png"
    width="24"
    alt="LinkedIn"
  />
</a>

<a
  href="https://www.facebook.com/rixilab"
  style="display:inline-block;margin:0 6px;"
>
  <img
    src="https://cdn-icons-png.flaticon.com/512/733/733547.png"
    width="24"
    alt="Facebook"
  />
</a>

<a
  href="https://www.youtube.com/@RixiLab"
  style="display:inline-block;margin:0 6px;"
>
  <img
    src="https://cdn-icons-png.flaticon.com/512/1384/1384060.png"
    width="24"
    alt="YouTube"
  />
</a>

</p>

<p
  class="footer-text"
  style="
    margin:18px 0 0;
    color:#999;
    font-size:11px;
    line-height:1.8;
  "
>
  © ${new Date().getFullYear()} Rixi Lab • ${BASE_URL}
</p>

</td>
</tr>
</table>

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`;

  const encodedMail = makeBody(user.email, `"Rixi Lab" <${process.env.EMAIL}>`, subject, body);

  try {
    await gmail.users.messages.send({
      userId: "me",
      resource: {
        raw: encodedMail,
      },
    });
  } catch (err) {
    console.error("Failed to send completion email:", err.message);
  }
}

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "bootcamps",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
  },
});
const upload = multer({ storage });

// Ensure only bootcamp managers can access
router.use(authRole("bootcamp_manager"));

// Dashboard route
router.get("/", async (req, res) => {
  try {
    const manager = await BootcampManager.findById(req.session.user);
    if (!manager) {
      req.flash("error", "Manager not found");
      return res.redirect("/login");
    }

    const bootcamps = await Bootcamp.find().populate("usersEnrolled");

    res.render("bootcampManager/dashboard", {
      manager: manager,
      bootcamps: bootcamps,
      messages: req.flash(),
    });
  } catch (err) {
    console.error(err);
    req.flash("error", "Server error loading dashboard");
    res.redirect("/login");
  }
});

// Render create page
router.get("/create", async (req, res) => {
  try {
    const manager = await BootcampManager.findById(req.session.user);
    res.render("bootcampManager/create", { manager });
  } catch (err) {
    console.error(err);
    req.flash("error", "Error loading create page");
    res.redirect("/bootcampManager");
  }
});

// Manage Bootcamps page
router.get("/manage", async (req, res) => {
  try {
    const manager = await BootcampManager.findById(req.session.user);
    const bootcamps = await Bootcamp.find().populate("usersEnrolled");
    res.render("bootcampManager/manage", {
      manager,
      bootcamps,
      messages: req.flash(),
    });
  } catch (err) {
    console.error(err);
    req.flash("error", "Error loading manage page");
    res.redirect("/bootcampManager");
  }
});

// Handle bootcamp creation
router.post("/create", upload.single("banner_img"), async (req, res) => {
  try {
    const {
      bootcamp_id,
      name,
      description,
      isPaid,
      amount,
      start_date,
      end_date,
      session_name,
      session_instructor,
      session_link,
      session_time,
      session_expiryTime,
      session_details,
    } = req.body;

    if (!req.file) {
      req.flash("error", "Please upload a banner image");
      return res.redirect("/bootcampManager/create");
    }

    const banner_img = req.file.path;
    const banner_public_id = req.file.filename;

    let formattedSessions = [];
    if (session_name) {
      if (Array.isArray(session_name)) {
        for (let i = 0; i < session_name.length; i++) {
          formattedSessions.push({
            session_id: i + 1,
            session_name: session_name[i],
            instructor: session_instructor[i],
            link: session_link[i],
            time: new Date(session_time[i] + "Z"),
            expiryTime: new Date(session_expiryTime[i] + "Z"),
            details: session_details[i] || "",
          });
        }
      } else {
        formattedSessions.push({
          session_id: 1,
          session_name: session_name,
          instructor: session_instructor,
          link: session_link,
          time: new Date(session_time + "Z"),
          expiryTime: new Date(session_expiryTime + "Z"),
          details: session_details || "",
        });
      }
    }

    const newBootcamp = new Bootcamp({
      bootcamp_id,
      name,
      description,
      banner_img,
      banner_public_id,
      isPaid: isPaid === "true",
      payment: {
        amount: amount ? Number(amount) : 0,
        currency: "INR",
      },
      start_date: start_date ? new Date(start_date + "Z") : undefined,
      end_date: end_date ? new Date(end_date + "Z") : undefined,
      sessions: formattedSessions,
      usersEnrolled: [],
      status: "draft", // saved as draft; manager publishes explicitly
    });

    await newBootcamp.save();
    req.flash("success", "Bootcamp created successfully!");
    res.redirect("/bootcampManager/manage");
  } catch (err) {
    console.error(err);
    req.flash("error", "Error creating bootcamp: " + err.message);
    res.redirect("/bootcampManager/create");
  }
});

// Render Users View
router.get("/users", async (req, res) => {
  try {
    const manager = await BootcampManager.findById(req.session.user);
    const BootcampUser = require("../models/BootcampUser");
    const users = await BootcampUser.find().populate(
      "enrolledBootcamps.bootcamp_id",
    );
    res.render("bootcampManager/users", { manager, users });
  } catch (err) {
    console.error(err);
    req.flash("error", "Error loading users page");
    res.redirect("/bootcampManager");
  }
});

// Render Attendance View
router.get("/attendance", async (req, res) => {
  try {
    const manager = await BootcampManager.findById(req.session.user);
    const bootcamps = await Bootcamp.find();

    const bootcampId = req.query.bootcamp_id;
    const sessionId = req.query.session_id;

    let selectedBootcamp = null;
    let enrolledUsers = [];
    if (bootcampId) {
      selectedBootcamp = await Bootcamp.findById(bootcampId);
      const BootcampUser = require("../models/BootcampUser");
      enrolledUsers = await BootcampUser.find({
        "enrolledBootcamps.bootcamp_id": new mongoose.Types.ObjectId(
          bootcampId,
        ),
      });
    }

    res.render("bootcampManager/attendance", {
      manager,
      bootcamps,
      selectedBootcamp,
      enrolledUsers,
      selectedSessionId: sessionId,
    });
  } catch (err) {
    console.error(err);
    req.flash("error", "Error loading attendance page");
    res.redirect("/bootcampManager");
  }
});

// Update Attendance POST
router.post("/attendance/update", async (req, res) => {
  try {
    const { bootcamp_id, session_id, user_id, status } = req.body;
    const BootcampUser = require("../models/BootcampUser");

    const user = await BootcampUser.findById(user_id);
    if (user) {
      const enrollment = user.enrolledBootcamps.find(
        (b) => b.bootcamp_id.toString() === bootcamp_id,
      );
      if (enrollment) {
        const sessionRecord = enrollment.attendance.find(
          (a) => String(a.session_id) === String(session_id),
        );
        if (sessionRecord) {
          sessionRecord.status = status;
        } else {
          enrollment.attendance.push({ session_id: Number(session_id), status });
        }

        // Recalculate progress
        const bootcamp = await Bootcamp.findById(bootcamp_id);
        if (bootcamp && bootcamp.sessions.length > 0) {
          const totalSessions = bootcamp.sessions.length;
          const presentSessions = enrollment.attendance.filter(
            (a) => a.status === "present",
          ).length;
          enrollment.progress = Math.round(
            (presentSessions / totalSessions) * 100,
          );

          if (enrollment.progress === 100 && !enrollment.certificate_id) {
            const countObj = await BootcampUser.aggregate([
              { $unwind: "$enrolledBootcamps" },
              {
                $match: {
                  "enrolledBootcamps.bootcamp_id": new mongoose.Types.ObjectId(
                    bootcamp_id,
                  ),
                  "enrolledBootcamps.certificate_id": { $ne: null },
                },
              },
              { $count: "total" },
            ]);

            const count = countObj.length > 0 ? countObj[0].total + 1 : 1;

            // 01, 02, 003, 099, 999
            const serialNumber = String(count).padStart(2, "0");

            enrollment.certificate_id = `${bootcamp.bootcamp_id}${serialNumber}`;
            enrollment.certificate_date = new Date(
              new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
            );

            // Send email asynchronously
            sendCompletionEmail(user, bootcamp).catch(console.error);
          }
        } else {
          enrollment.progress = 0;
        }

        user.markModified("enrolledBootcamps");
        await user.save();
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Bulk Update Attendance POST
router.post("/attendance/bulk-update", async (req, res) => {
  try {
    const { bootcamp_id, session_id, users, status } = req.body;
    const BootcampUser = require("../models/BootcampUser");

    let userIds = [];
    try {
      userIds = JSON.parse(users);
    } catch (e) {
      if (typeof users === "string") userIds = users.split(",");
      else if (Array.isArray(users)) userIds = users;
    }

    const bootcamp = await Bootcamp.findById(bootcamp_id);

    for (let user_id of userIds) {
      const user = await BootcampUser.findById(user_id);
      if (user) {
        const enrollment = user.enrolledBootcamps.find(
          (b) => b.bootcamp_id.toString() === bootcamp_id,
        );
        if (enrollment) {
          const sessionRecord = enrollment.attendance.find(
            (a) => String(a.session_id) === String(session_id),
          );
          if (sessionRecord) {
            sessionRecord.status = status;
          } else {
            enrollment.attendance.push({ session_id: Number(session_id), status });
          }

          // Recalculate progress
          if (bootcamp && bootcamp.sessions.length > 0) {
            const totalSessions = bootcamp.sessions.length;
            const presentSessions = enrollment.attendance.filter(
              (a) => a.status === "present",
            ).length;
            enrollment.progress = Math.round(
              (presentSessions / totalSessions) * 100,
            );

            if (enrollment.progress === 100 && !enrollment.certificate_id) {
              const countObj = await BootcampUser.aggregate([
                { $unwind: "$enrolledBootcamps" },
                {
                  $match: {
                    "enrolledBootcamps.bootcamp_id":
                      new mongoose.Types.ObjectId(bootcamp_id),
                    "enrolledBootcamps.certificate_id": { $ne: null },
                  },
                },
                { $count: "total" },
              ]);

              const count = countObj.length > 0 ? countObj[0].total + 1 : 1;
              const serialNumber = String(count).padStart(2, "0");

              enrollment.certificate_id = `${bootcamp.bootcamp_id}${serialNumber}`;
              enrollment.certificate_date = new Date(
                new Date().toLocaleString("en-US", {
                  timeZone: "Asia/Kolkata",
                }),
              );

              // Send email asynchronously
              sendCompletionEmail(user, bootcamp).catch(console.error);
            }
          } else {
            enrollment.progress = 0;
          }

          user.markModified("enrolledBootcamps");
          await user.save();
        }
      }
    }

    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.json({
        success: true,
        message: "Attendance updated successfully.",
      });
    }
    req.flash("success", "Bulk attendance updated successfully.");
    res.redirect(
      `/bootcampManager/attendance?bootcamp_id=${bootcamp_id}&session_id=${session_id}`,
    );
  } catch (err) {
    console.error(err);
    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.status(500).json({ success: false, message: "Server error" });
    }
    req.flash("error", "Server error during bulk update.");
    res.redirect("/bootcampManager/attendance");
  }
});

// ── Publish / Unpublish Toggle ──
router.post("/bootcamp/:id/toggle-publish", async (req, res) => {
  try {
    const bootcamp = await Bootcamp.findById(req.params.id);
    if (!bootcamp) {
      req.flash("error", "Bootcamp not found");
      return res.redirect("/bootcampManager");
    }
    bootcamp.status = bootcamp.status === "live" ? "draft" : "live";
    await bootcamp.save();
    req.flash(
      "success",
      `Bootcamp is now ${bootcamp.status === "live" ? "Published (Live)" : "Unpublished (Draft)"}`,
    );
    res.redirect("/bootcampManager/manage");
  } catch (err) {
    console.error(err);
    req.flash("error", "Error toggling publish status");
    res.redirect("/bootcampManager");
  }
});

// ── Close / Reopen Registration Toggle ──
router.post("/bootcamp/:id/toggle-close", async (req, res) => {
  try {
    const bootcamp = await Bootcamp.findById(req.params.id);
    if (!bootcamp) {
      req.flash("error", "Bootcamp not found");
      return res.redirect("/bootcampManager");
    }
    bootcamp.status = bootcamp.status === "closed" ? "draft" : "closed";
    await bootcamp.save();
    req.flash(
      "success",
      `Bootcamp registration is now ${bootcamp.status === "closed" ? "Closed" : "Reopened (Draft)"}`,
    );
    res.redirect("/bootcampManager/manage");
  } catch (err) {
    console.error(err);
    req.flash("error", "Error toggling close status");
    res.redirect("/bootcampManager");
  }
});

// ── Edit Bootcamp – Render Form ──
router.get("/edit/:id", async (req, res) => {
  try {
    const manager = await BootcampManager.findById(req.session.user);
    const bootcamp = await Bootcamp.findById(req.params.id);
    if (!bootcamp) {
      req.flash("error", "Bootcamp not found");
      return res.redirect("/bootcampManager");
    }
    res.render("bootcampManager/edit", {
      manager,
      bootcamp,
      messages: req.flash(),
    });
  } catch (err) {
    console.error(err);
    req.flash("error", "Error loading edit page");
    res.redirect("/bootcampManager");
  }
});

// ── Edit Bootcamp – Handle Submission ──
router.post("/edit/:id", upload.single("banner_img"), async (req, res) => {
  try {
    const {
      name,
      description,
      isPaid,
      amount,
      start_date,
      end_date,
      session_name,
      session_instructor,
      session_link,
      session_time,
      session_expiryTime,
      session_details,
    } = req.body;

    const bootcamp = await Bootcamp.findById(req.params.id);
    if (!bootcamp) {
      req.flash("error", "Bootcamp not found");
      return res.redirect("/bootcampManager");
    }

    let banner_img = bootcamp.banner_img;
    let banner_public_id = bootcamp.banner_public_id;

    if (req.file) {
      if (bootcamp.banner_public_id) {
        try {
          await cloudinary.uploader.destroy(bootcamp.banner_public_id);
        } catch (e) {
          console.error("Error deleting old banner:", e);
        }
      }
      banner_img = req.file.path;
      banner_public_id = req.file.filename;
    }

    // Helper: user enters IST time → convert to UTC for MongoDB storage
    function parseIST(val) {
      if (!val) return null;

      let year, month, day, hour, minute;

      if (val.includes(",")) {
        // Handle altFormat: "d M Y, h:i K" e.g. "20 May 2026, 10:30 AM"
        const parts = val.match(
          /(\d+)\s+([A-Za-z]+)\s+(\d+),\s+(\d+):(\d+)\s+(AM|PM)/i,
        );
        if (parts) {
          day = parseInt(parts[1], 10);
          const monthStr = parts[2].substring(0, 3).toLowerCase();
          const months = {
            jan: 1,
            feb: 2,
            mar: 3,
            apr: 4,
            may: 5,
            jun: 6,
            jul: 7,
            aug: 8,
            sep: 9,
            oct: 10,
            nov: 11,
            dec: 12,
          };
          month = months[monthStr];
          year = parseInt(parts[3], 10);
          hour = parseInt(parts[4], 10);
          minute = parseInt(parts[5], 10);
          if (parts[6].toUpperCase() === "PM" && hour < 12) hour += 12;
          if (parts[6].toUpperCase() === "AM" && hour === 12) hour = 0;
        } else {
          return null;
        }
      } else {
        // Handle standard format: "YYYY-MM-DDTHH:mm"
        const normalized = val.replace("T", " ").trim();
        const [datePart, timePart] = normalized.split(" ");
        if (!datePart || !timePart) return null;
        const [y, m, d] = datePart.split("-").map(Number);
        const [h, min] = timePart.split(":").map(Number);
        year = y;
        month = m;
        day = d;
        hour = h;
        minute = min;
      }

      // Return exact time as UTC without offset
      const istMs = Date.UTC(year, month - 1, day, hour, minute);
      return new Date(istMs);
    }

    let formattedSessions = [];
    if (session_name) {
      if (Array.isArray(session_name)) {
        for (let i = 0; i < session_name.length; i++) {
          formattedSessions.push({
            session_id: i + 1,
            session_name: session_name[i],
            instructor: session_instructor[i],
            link: session_link[i],
            time: parseIST(session_time[i]),
            expiryTime: parseIST(session_expiryTime[i]),
            details: session_details
              ? Array.isArray(session_details)
                ? session_details[i]
                : session_details
              : "",
          });
        }
      } else {
        formattedSessions.push({
          session_id: 1,
          session_name: session_name,
          instructor: session_instructor,
          link: session_link,
          time: parseIST(session_time),
          expiryTime: parseIST(session_expiryTime),
          details: session_details || "",
        });
      }
    }

    await Bootcamp.findByIdAndUpdate(req.params.id, {
      name,
      description,
      banner_img,
      banner_public_id,
      isPaid: isPaid === "true" || isPaid === "on",
      payment: {
        amount: amount ? Number(amount) : 0,
        currency: "INR",
      },
      start_date: start_date ? parseIST(start_date) : null,
      end_date: end_date ? parseIST(end_date) : null,
      sessions: formattedSessions,
    });

    req.flash("success", "Bootcamp updated successfully!");
    res.redirect("/bootcampManager/manage");
  } catch (err) {
    console.error(err);
    req.flash("error", "Error updating bootcamp: " + err.message);
    res.redirect(`/bootcampManager/edit/${req.params.id}`);
  }
});

module.exports = router;
