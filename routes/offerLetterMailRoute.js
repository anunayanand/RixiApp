const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { google } = require("googleapis");
const rawUrl = process.env.BASE_URL || 'https://rixilab.tech';
const BASE_URL = rawUrl.replace('https://', 'www.');

// ==============================
// CONFIGURATION
// ==============================
const oAuth2Client = new google.auth.OAuth2(
  process.env.PROJECT_INFO_CLIENT_ID,
  process.env.PROJECT_INFO_CLIENT_SECRET,
  process.env.PROJECT_INFO_REDIRECT_URI
);

oAuth2Client.setCredentials({
  refresh_token: process.env.PROJECT_INFO_REFRESH_TOKEN
});

const gmail = google.gmail({
  version: "v1",
  auth: oAuth2Client
});

// ==============================
// HELPER: Encode Email for Gmail API
// ==============================
function makeBody(to, from, subject, message) {
  const str = [
    "Content-Type: text/html; charset=\"UTF-8\"\n",
    "MIME-Version: 1.0\n",
    "Content-Transfer-Encoding: 7bit\n",
    "to: ", to, "\n",
    "from: ", from, "\n",
    "subject: ", subject, "\n\n",
    message
  ].join('');

  const encodedMail = Buffer.from(str).toString("base64").replace(/\+/g, '-').replace(/\//g, '_');
  return encodedMail;
}

// ==============================
// HELPER: Send Bulk Offer Letter Emails
// ==============================
async function sendBulkOfferLetterMails(interns) {
  const sendPromises = interns.map(async (intern) => {
    try {
      const { name, email, intern_id } = intern;

      const subject = `Internship Offer Letter Available, Login to Rixi Lab Portal`;
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
    padding:24px 18px !important;
  }

  .heading{
    font-size:24px !important;
    line-height:1.3 !important;
  }

  .normal-text{
    font-size:13px !important;
    line-height:1.8 !important;
  }

  .button{
    display:block !important;
    width:100% !important;
    box-sizing:border-box !important;
  }

  .card-padding{
    padding:18px !important;
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
  width="620"
  class="container"
  cellpadding="0"
  cellspacing="0"
  bgcolor="#ffffff"
  style="
    max-width:620px;
    border-radius:24px;
    overflow:hidden;
    border:1px solid #ececec;
  "
>

<tr>
  <td height="6" bgcolor="#ff6600"></td>
</tr>

<tr>
<td class="content" style="padding:42px 34px;">

<!-- Logo -->
<table width="100%">
<tr>
<td align="center">

<table
  width="90"
  height="90"
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
  width="54"
  alt="Rixi Lab"
/>

</td>
</tr>
</table>

<h1
  class="heading"
  style="
    margin:24px 0 0;
    font-size:32px;
    line-height:1.25;
    color:#ff6600;
    font-weight:bold;
  "
>
  Offer Letter Available 
</h1>

<p
  style="
    margin:12px 0 0;
    color:#777;
    font-size:14px;
    line-height:1.7;
  "
>
  Your internship offer letter is now ready
</p>

</td>
</tr>
</table>

<!-- Greeting -->
<table width="100%" style="margin-top:40px;">
<tr>
<td>

<p
  style="
    margin:0;
    font-size:15px;
    color:#222;
    font-weight:500;
  "
>
  Dear <strong>${name}</strong>,
</p>

<p
  class="normal-text"
  style="
    margin:18px 0 0;
    font-size:13px;
    line-height:1.9;
    color:#555;
  "
>
  We are pleased to inform you that your
  <strong>Internship Offer Letter</strong>
  is now available on the official Rixi Lab portal.
</p>

<p
  class="normal-text"
  style="
    margin:18px 0 0;
    font-size:13px;
    line-height:1.9;
    color:#555;
  "
>
  Please use the credentials below to access your dashboard and download your offer letter.
</p>

</td>
</tr>
</table>

<!-- Credentials Card -->
<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  style="
    margin-top:30px;
    background:#fffaf7;
    border:1px solid #ffd8c2;
    border-radius:18px;
  "
>
<tr>
<td class="card-padding" style="padding:24px;">

<p
  style="
    margin:0;
    font-size:13px;
    font-weight:bold;
    color:#222;
  "
>
  Login Credentials
</p>

<table width="100%" style="margin-top:16px;">
<tr>
<td
  style="
    font-size:13px;
    color:#555;
    line-height:2;
  "
>

<strong>Email ID:</strong> ${email}<br/>
<strong>Intern ID:</strong> ${intern_id}<br/>
<strong>Default Password:</strong> Your Intern ID

</td>
</tr>
</table>

</td>
</tr>
</table>

<!-- Instructions -->
<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  style="
    margin-top:24px;
    background:#fff7f0;
    border-radius:18px;
    border:1px solid #ffe0c7;
  "
>
<tr>
<td class="card-padding" style="padding:24px;">

<p
  style="
    margin:0;
    font-size:13px;
    font-weight:bold;
    color:#ff6600;
  "
>
  How to Access Your Offer Letter
</p>

<table width="100%" style="margin-top:16px;">
<tr>
<td
  style="
    font-size:13px;
    color:#555;
    line-height:2;
  "
>

1. Visit the Rixi Lab website<br/>
2. Navigate to the Login page<br/>
3. Login using your registered email ID<br/>
4. Use your Intern ID as the default password<br/>
5. Download your Offer Letter from the dashboard

</td>
</tr>
</table>

</td>
</tr>
</table>

<!-- Button -->
<table width="100%" style="margin-top:34px;">
<tr>
<td align="center">

<a
  href="https://rixilab.tech"
  class="button"
  style="
    background:#ff6600;
    color:#ffffff;
    text-decoration:none;
    padding:14px 28px;
    border-radius:12px;
    font-weight:bold;
    display:inline-block;
    font-size:14px;
  "
>
  Login & Download Offer Letter
</a>

</td>
</tr>
</table>

<!-- Extra Info -->
<table width="100%" style="margin-top:30px;">
<tr>
<td>

<p
  class="normal-text"
  style="
    margin:0;
    font-size:13px;
    line-height:1.9;
    color:#555;
  "
>
  Once logged in, we recommend changing your password for better security.
</p>

<p
  class="normal-text"
  style="
    margin:16px 0 0;
    font-size:13px;
    line-height:1.9;
    color:#555;
  "
>
  If you face any difficulties accessing your account,
  feel free to reach out to our support team on WhatsApp.
</p>

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
  Rixi Lab • Rethink Innovate eXecute Inspire
</p>

<p style="margin:18px 0 0;">

<a href="https://www.instagram.com/rixilab.in" style="display:inline-block;margin:0 6px;">
  <img
    src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png"
    width="24"
    alt="Instagram"
  />
</a>

<a href="https://www.linkedin.com/company/rixilab" style="display:inline-block;margin:0 6px;">
  <img
    src="https://cdn-icons-png.flaticon.com/512/174/174857.png"
    width="24"
    alt="LinkedIn"
  />
</a>

<a href="https://www.facebook.com/rixilab" style="display:inline-block;margin:0 6px;">
  <img
    src="https://cdn-icons-png.flaticon.com/512/733/733547.png"
    width="24"
    alt="Facebook"
  />
</a>

<a href="https://www.youtube.com/@RixiLab" style="display:inline-block;margin:0 6px;">
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

      const encodedMail = makeBody(email, `"Rixi Lab" <${process.env.PROJECT_INFO_EMAIL}>`, subject, body);
      await gmail.users.messages.send({
        userId: 'me',
        resource: {
          raw: encodedMail
        }
      });

      await User.findOneAndUpdate({ intern_id }, { offer_letter_sent: true });

      // console.log(`✅ Offer Letter sent to ${email}`);
      return { status: "fulfilled", email, intern_id };
    } catch (err) {
      // console.error(`❌ Offer Letter failed for ${intern.email}:`, err.message);
      return { status: "rejected", email: intern.email, intern_id: intern.intern_id, reason: err.message };
    }
  });

  return Promise.all(sendPromises);
}

// ==============================
// ROUTE: Send Offer Letter Mail
// ==============================
router.post("/send-offerletter-mail", async (req, res) => {
  try {
    // console.log("Offer letter mail route called with body:", req.body);
    const { interns } = req.body;

    // Normalize interns to array
    const internIds = interns
      ? Array.isArray(interns)
        ? interns
        : [interns]
      : [];

    // Validation: interns must be selected
    if (!internIds.length) {
      return res.status(400).json({ success: false, message: "No interns selected for offer letter mail." });
    }

    // Fetch selected interns from DB
    const matchedInterns = await User.find({ intern_id: { $in: internIds } });

    if (!matchedInterns.length) {
      return res.status(404).json({ success: false, message: "No matching interns found in the database." });
    }

    // Send emails
    const results = await sendBulkOfferLetterMails(matchedInterns);

    // Update DB for all successful sends
    const successfulInternIds = results
      .filter(r => r.status === "fulfilled")
      .map(r => r.intern_id);

    if (successfulInternIds.length > 0) {
      const updateResult = await User.updateMany(
        { intern_id: { $in: successfulInternIds } },
        { $set: { offer_letter_sent: true } }
      );
      // console.log("DB update result:", updateResult);
    }

    // Flash messages
    const successCount = results.filter(r => r.status === "fulfilled").length;
    const failedCount = results.filter(r => r.status === "rejected").length;
    // console.log(`Success: ${successCount}, Failed: ${failedCount}`);
    res.json({ success: true, sent: successCount, failed: failedCount });
  } catch (err) {
    // console.error("Error in offer letter route:", err);
    res.status(500).json({ success: false, message: "Server error while sending offer letters." });
  }
});

module.exports = router;
