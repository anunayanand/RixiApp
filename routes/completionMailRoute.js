const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { google } = require("googleapis");
const rawUrl = process.env.BASE_URL || 'https://rixilab.in';
const BASE_URL = rawUrl.replace('https://', 'www.');

// ==============================
// CONFIGURATION
// ==============================
const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

oAuth2Client.setCredentials({
  refresh_token: process.env.REFRESH_TOKEN
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
// HELPER: Send Bulk Completion Emails
// ==============================
async function sendBulkCompletionMails(interns) {
  // console.log("🔍 [DEBUG] sendBulkCompletionMails called with", interns.length, "interns");
  
  const sendPromises = interns.map(async (intern) => {
    try {
      const { intern_id, name, email, domain } = intern;
      // console.log("🔍 [DEBUG] Processing intern:", { intern_id, email, name });

      const subject = `Congratulations on Completing Your Internship at Rixi Lab Technologies`;
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
    font-size:26px !important;
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
  src="https://rixilab.in/img/Rixi%20Lab%20New%20Logo%20PNG.png"
  width="54"
  alt="Rixi Lab Technologies"
/>

</td>
</tr>
</table>

<h1
  class="heading"
  style="
    margin:24px 0 0;
    font-size:34px;
    line-height:1.25;
    color:#ff6600;
    font-weight:bold;
  "
>
  Congratulations
</h1>

<p
  style="
    margin:12px 0 0;
    color:#777;
    font-size:14px;
    line-height:1.7;
  "
>
  Internship Successfully Completed
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
  Hi <strong>${name}</strong>,
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
  We are delighted to inform you that your internship with
  <strong>Rixi Lab Technologies</strong> in the domain of
  <strong>${domain}</strong> has been successfully completed.
  Congratulations on reaching this important milestone in your journey.
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
  Your dedication, consistency, and hard work throughout the internship
  have truly been appreciated by our team.
</p>

</td>
</tr>
</table>

<!-- Certificate Card -->
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
  Internship Completion Details
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

<strong>Domain:</strong> ${domain}<br/>
<strong>Status:</strong> Successfully Completed<br/>
<strong>Certificate:</strong> Available for Download

</td>
</tr>
</table>

</td>
</tr>
</table>

<!-- Canva Premium -->
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
  Exclusive Reward
</p>

<p
  class="normal-text"
  style="
    margin:14px 0 0;
    font-size:13px;
    line-height:1.9;
    color:#555;
  "
>
  As a token of appreciation, you now have access to
  <strong>Canva Premium for 1 Year</strong>.
  Simply log in to Canva using your Rixi Lab Technologies registered email ID
  and start exploring premium features.
</p>

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
  Download Certificate
</a>

</td>
</tr>
</table>

<!-- LinkedIn -->
<table width="100%" style="margin-top:34px;">
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
  We encourage you to share your internship certificate on LinkedIn
  and tag <strong>Rixi Lab Technologies</strong> in your post.
  Celebrate your achievement and inspire others through your journey.
</p>

</td>
</tr>
</table>

<!-- Appreciation -->
<table width="100%" style="margin-top:28px;">
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
  Thank you for being part of the Rixi Lab Technologies community.
  We are confident you will continue achieving greater milestones ahead.
</p>

<p
  style="
    margin:18px 0 0;
    font-size:14px;
    font-weight:bold;
    color:#222;
  "
>
  Best wishes for your future journey 🌟
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
  style="
    margin:0;
    color:#888;
    font-size:12px;
    line-height:1.8;
  "
>
  Rixi Lab Technologies • Rethink Innovate eXecute Inspire
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
  style="
    margin:18px 0 0;
    color:#999;
    font-size:11px;
  "
>
  © ${new Date().getFullYear()} Rixi Lab Technologies • ${BASE_URL}
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

      const encodedMail = makeBody(email, `"Rixi Lab Technologies" <${process.env.EMAIL}>`, subject, body);
      await gmail.users.messages.send({
        userId: 'me',
        resource: {
          raw: encodedMail
        }
      });

      await User.findOneAndUpdate({ intern_id }, { completionSent: true });

      // console.log(`✅ Completion mail sent to ${email}`);
      return { status: "fulfilled", email, intern_id };
    } catch (err) {
      // console.error(`❌ Completion mail failed for ${intern.email}:`, err.message);
      return { status: "rejected", email: intern.email, intern_id: intern.intern_id, reason: err.message };
    }
  });

  return Promise.all(sendPromises);
}

// ==============================
// ROUTE: Send Completion Mail
// ==============================
router.post("/send-completion-mail", async (req, res) => {
  try {
    // console.log("🔍 [DEBUG] Completion mail route called");
    // console.log("🔍 [DEBUG] Request body:", req.body);
    
    const { interns } = req.body; // array of intern_id
    // console.log("🔍 [DEBUG] Interns to send completion mail:", interns);

    // Normalize interns to array
    const internIds = interns
      ? Array.isArray(interns)
        ? interns
        : [interns]
      : [];

    // Validation: interns must be selected
    if (!internIds.length) {
      return res.status(400).json({ success: false, message: "No interns selected for completion mail." });
    }

    // Fetch selected interns from DB
    const matchedInterns = await User.find({ intern_id: { $in: internIds } });

    if (!matchedInterns.length) {
      return res.status(404).json({ success: false, message: "No matching interns found in the database." });
    }

    // Send emails
    const results = await sendBulkCompletionMails(matchedInterns);

    // Update DB for all successful sends
    const successfulInternIds = results
      .filter(r => r.status === "fulfilled")
      .map(r => r.intern_id);

    if (successfulInternIds.length > 0) {
      const updateResult = await User.updateMany(
        { intern_id: { $in: successfulInternIds } },
        { $set: { completionSent: true } }
      );
      // console.log("🔍 [DEBUG] DB update result:", updateResult);
    }

    // Flash messages
    const successCount = results.filter(r => r.status === "fulfilled").length;
    const failedCount = results.filter(r => r.status === "rejected").length;
    // console.log("🔍 [DEBUG] Email send results:", { successCount, failedCount, results });
    
    res.json({ success: true, sent: successCount, failed: failedCount });
  } catch (err) {
    // console.error("🔍 [DEBUG] Error in completion route:", err);
    res.status(500).json({ success: false, message: "Server error while sending completion mails." });
  }
});

module.exports = router;
