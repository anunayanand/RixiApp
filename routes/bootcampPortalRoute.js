const express = require("express");
const router = express.Router();
const { google } = require("googleapis");
const BootcampUser = require("../models/BootcampUser");
const Bootcamp = require("../models/Bootcamp");

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

// ==============================
// MIDDLEWARE
// ==============================
const requireBootcampUser = (req, res, next) => {
  if (req.session.bootcampUser) {
    next();
  } else {
    req.flash("error", "Please log in to access your portal.");
    res.redirect("/bootcamp-portal/login");
  }
};

// ==============================
// ROUTES
// ==============================

// GET Login Page
router.get("/login", (req, res) => {
  if (req.session.bootcampUser) {
    return res.redirect("/bootcamp-portal");
  }
  res.render("bootcampUser/login", { messages: req.flash() });
});

// POST Send OTP
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await BootcampUser.findOne({ email });
    if (!user) {
      req.flash("error", "No bootcamp account found with that email.");
      return res.redirect("/bootcamp-portal/login");
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    req.session.bootcampOtp = {
      email: user.email,
      otp: otp,
      expires: Date.now() + 10 * 60 * 1000, // 10 minutes valid
    };

    const subject = `Your Rixi Lab Bootcamp Login OTP`;
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
        padding:30px 20px !important;
      }

      .heading{
        font-size:30px !important;
      }

      .otp{
        font-size:34px !important;
        letter-spacing:6px !important;
      }

    }
  </style>
</head>

<body>

<table width="100%" bgcolor="#f5f5f5" cellpadding="0" cellspacing="0">
<tr>
<td align="center" style="padding:30px 15px;">

<table 
  width="600"
  class="container"
  cellpadding="0"
  cellspacing="0"
  bgcolor="#ffffff"
  style="max-width:600px;border-radius:24px;overflow:hidden;border:1px solid #ececec;"
>

<tr>
  <td height="8" bgcolor="#ff6600"></td>
</tr>

<tr>
<td class="content" style="padding:50px 40px;">

  <!-- Logo -->
  <table width="100%">
    <tr>
      <td align="center">

        <table 
          width="100"
          height="100"
          cellpadding="0"
          cellspacing="0"
          style="background:#fff3eb;border-radius:50%;"
        >
          <tr>
            <td align="center" valign="middle">

              <img 
                src="https://rixilab.tech/img/Rixi%20Lab%20New%20Logo%20PNG.png"
                width="60"
                alt="Rixi Lab"
              />

            </td>
          </tr>
        </table>

        <h1 
          class="heading"
          style="margin:25px 0 0;font-size:42px;line-height:1.2;color:#ff6600;"
        >
          Login Verification
        </h1>

        <p style="margin:15px 0 0;color:#777;font-size:17px;line-height:1.7;">
          Secure OTP verification for your account
        </p>

      </td>
    </tr>
  </table>

  <!-- Greeting -->
  <table width="100%" style="margin-top:50px;">
    <tr>
      <td>

        <p style="margin:0;font-size:20px;color:#222;">
          Hello <strong>${user.name}</strong>,
        </p>

        <p style="margin:25px 0 0;font-size:16px;line-height:1.9;color:#555;">
          You requested to log in to your Rixi Lab Bootcamp portal.
          Please use the OTP below to continue securely.
        </p>

      </td>
    </tr>
  </table>

  <!-- OTP -->
  <table width="100%" style="margin-top:40px;">
    <tr>
      <td align="center">

        <table 
          cellpadding="0"
          cellspacing="0"
          style="background:#fffaf7;border:2px solid #ffd8c2;border-radius:20px;"
        >
          <tr>
            <td style="padding:24px 40px;">

              <span 
                class="otp"
                style="font-size:50px;font-weight:bold;letter-spacing:12px;color:#ff6600;"
              >
                ${otp}
              </span>

            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

  <!-- Footer -->
  <table width="100%" style="margin-top:45px;">
    <tr>
      <td align="center">

        <p style="margin:0;color:#666;font-size:15px;line-height:1.8;">
          This OTP is valid for <strong>10 minutes</strong>.
        </p>

        <p style="margin:10px 0 0;color:#999;font-size:14px;line-height:1.8;">
          If you did not request this login, please ignore this email.
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

    const encodedMail = makeBody(user.email, process.env.EMAIL, subject, body);
    await gmail.users.messages.send({
      userId: "me",
      resource: { raw: encodedMail },
    });

    res.render("bootcampUser/verify-otp", {
      email: user.email,
      messages: req.flash(),
    });
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to send OTP. Please try again.");
    res.redirect("/bootcamp-portal/login");
  }
});

// POST Verify OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    const sessionOtp = req.session.bootcampOtp;

    if (!sessionOtp || sessionOtp.email !== email) {
      req.flash("error", "OTP session expired. Please request a new one.");
      return res.redirect("/bootcamp-portal/login");
    }

    if (Date.now() > sessionOtp.expires) {
      req.flash("error", "OTP has expired. Request a new one.");
      return res.redirect("/bootcamp-portal/login");
    }

    if (sessionOtp.otp !== otp) {
      req.flash("error", "Invalid OTP. Please try again.");
      return res.render("bootcampUser/verify-otp", {
        email,
        messages: req.flash(),
      });
    }

    const user = await BootcampUser.findOne({ email });
    req.session.bootcampUser = user._id;
    req.session.bootcampOtp = null; // Clear OTP

    res.redirect("/bootcamp-portal");
  } catch (err) {
    console.error(err);
    req.flash("error", "Verification failed.");
    res.redirect("/bootcamp-portal/login");
  }
});

// GET Dashboard
router.get("/", requireBootcampUser, async (req, res) => {
  try {
    const user = await BootcampUser.findById(req.session.bootcampUser).populate(
      "enrolledBootcamps.bootcamp_id",
    );
    res.render("bootcampUser/dashboard", { user, messages: req.flash() });
  } catch (err) {
    console.error(err);
    res.send("Server Error");
  }
});

// Download Certificate
router.get(
  "/download-certificate/:bootcampId",
  requireBootcampUser,
  async (req, res) => {
    try {
      const user = await BootcampUser.findById(
        req.session.bootcampUser,
      ).populate("enrolledBootcamps.bootcamp_id");
      if (!user) return res.status(404).send("User not found");

      const enrollment = user.enrolledBootcamps.find(
        (e) => e.bootcamp_id._id.toString() === req.params.bootcampId,
      );
      if (!enrollment)
        return res.status(400).send("Not enrolled in this bootcamp.");

      if (enrollment.progress < 100) {
        return res
          .status(400)
          .send("Certificate not unlocked yet. Complete all sessions.");
      }

      const bootcamp = enrollment.bootcamp_id;
      const {
        generateBootcampCertificatePDF,
      } = require("../services/pdfGenerator");

      const pdf = await generateBootcampCertificatePDF({
        name: user.name,
        bootcamp_name: bootcamp.name,
        certificate_id: enrollment.certificate_id,
        start_date: bootcamp.start_date,
        end_date: bootcamp.end_date,
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${user.name.replace(/\s+/g, "_")}_Bootcamp_Certificate.pdf`,
      );
      res.send(pdf);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error generating certificate");
    }
  },
);

// Logout
router.get("/logout", (req, res) => {
  req.session.bootcampUser = null;
  res.redirect("/bootcamp-portal/login");
});

module.exports = router;
