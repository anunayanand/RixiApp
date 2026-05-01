const express = require("express");
const router = express.Router();
const { google } = require("googleapis");
const User = require("../models/User");

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

  return Buffer.from(str).toString("base64").replace(/\+/g, '-').replace(/\//g, '_');
}

// ==============================
// HELPER: Send Bulk Confirmation Emails
// ==============================
async function sendBulkConfirmationMails(interns, whatsappLink) {
  const sendPromises = interns.map(async (intern) => {
    try {
      const { intern_id, name, email, domain, duration } = intern;

      const subject = `Internship Confirmation - Welcome to Rixi Lab!`;
      const body = `
      <html>
   <body style="margin:0; padding:0; background-color:#f4f4f4; font-family: Arial, sans-serif;">

  <!-- Wrapper -->
  <table border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" style="padding: 20px 10px;">

        <!-- Main Container -->
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td align="center" bgcolor="#ff6600" style="padding: 20px;">
              <h1 style="margin:0; font-size:20px; color:#000;">Internship Confirmation - Welcome to Rixi Lab!</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 30px; color:#111827; font-size:15px; line-height:1.6;">
              <p>Dear <strong>${name}</strong>,</p>

              <p><strong>Congratulations!</strong> We are excited to inform you that your application for the internship at <strong>Rixi Lab</strong> has been successfully accepted. We welcome you aboard and look forward to working with you on this exciting journey of learning and innovation!</p>

              <h3 style="color:#111827; margin-top:20px; font-size:16px;">Internship Details:</h3>
              <ul style="padding-left:20px; margin:10px 0;">
                <li><strong>Start Date:</strong> 1st October 2025</li>
                <li><strong>Domain:</strong> ${domain}</li>
                <li><strong>Duration:</strong> ${duration} Weeks</li>
              </ul>

              <h3 style="color:#111827; margin-top:20px; font-size:16px;">Next Steps:</h3>
              <p>To complete your onboarding and receive important updates, please join our official internship WhatsApp group:</p>

              <!-- Button -->
              <p style="text-align:center; margin:20px 0;">
                <a href="${whatsappLink}" target="_blank" 
                   style="background-color:#22c55e; color:#ffffff; text-decoration:none; padding:12px 24px; border-radius:6px; font-weight:bold; display:inline-block;">
                  Join WhatsApp Group
                </a>
              </p>

              <p style="font-size:14px; color:#555555; line-height:1.5;">
                <strong>Important:</strong> Please join the group using your registered mobile number (the same number you provided during registration). This will help us verify your identity and provide timely updates and resources during the internship.
              </p>

              <p>If you have any questions, feel free to contact us on WhatsApp.</p>

              <!-- ✅ Signature -->
              <p style="font-size: 14px; color: #333; margin-top: 30px; margin-bottom: 5px;">
                Thanks & Regards,<br>
                <b style="font-size:16px; font-weight:700; color:#2c3e50;">Rixi Lab</b><br>
                <i>"Rethink Innovate eXecute Inspire"</i>
              </p>

              <!-- ✅ Social Media -->
              <p style="text-align: center; margin-top: 15px;">
                <a href="https://www.instagram.com/rixilab.in" target="_blank" style="margin: 0 10px;">
                  <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" 
                       alt="Instagram" width="26" style="vertical-align: middle;">
                </a>
                <a href="https://www.linkedin.com/company/rixilab" target="_blank" style="margin: 0 10px;">
                  <img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" 
                       alt="LinkedIn" width="26" style="vertical-align: middle;">
                </a>
                <a href="https://www.facebook.com/rixilab" target="_blank" style="margin: 0 10px;">
                  <img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" 
                       alt="Facebook" width="26" style="vertical-align: middle;">
                </a>
              </p>

              <p style="font-size: 12px; color: #888; text-align: center; margin-top: 20px;">
                © 2025 Rixi Lab | <a href="https://rixilab.tech" style="color:#3498db; text-decoration:none;">www.rixilab.tech</a>
              </p>

            </td>
          </tr>

        </table>
        <!-- End Main Container --> 

      </td>
    </tr>
  </table>
  <!-- End Wrapper -->

</body>
</html>
      `;

      const encodedMail = makeBody(email, process.env.EMAIL, subject, body);
      await gmail.users.messages.send({
        userId: 'me',
        resource: {
          raw: encodedMail
        }
      });

      await User.findOneAndUpdate({ intern_id }, { confirmationSent: true });

      // console.log(`✅ Confirmation mail sent to ${email}`);
      return { status: "fulfilled", email };
    } catch (err) {
      // console.error(`❌ Confirmation mail failed for ${intern.email}:`, err.message);
      return { status: "rejected", email: intern.email, reason: err.message };
    }
  });

  return Promise.all(sendPromises);
}

// ==============================
// ROUTE: Send Confirmation Mail
// ==============================
// ==============================
router.post("/send-confirmation-mail", async (req, res) => {
  try {
    const { interns, whatsappLink, batchConfirm } = req.body;

    // Normalize internIds
    const internIds = interns ? (Array.isArray(interns) ? interns : [interns]) : [];

    if (!internIds.length) {
      return res.json({ success: false, message: "No interns selected." });
    }

    if (!whatsappLink || whatsappLink.trim() === "") {
      return res.json({ success: false, message: "WhatsApp link is required." });
    }

    if (!batchConfirm || batchConfirm === "all") {
      return res.json({ success: false, message: "Please select a batch before sending mails." });
    }

    // Update WhatsApp link for selected batch
    const result = await User.updateMany(
      { batch_no: batchConfirm },
      { $set: { whatsappLink } }
    );
    // console.log("WhatsApp link update result:", result);

    // Fetch selected interns
    const internDocs = await User.find({ intern_id: { $in: internIds } });

    // Send mails (using your existing sendBulkConfirmationMails)
    const results = await sendBulkConfirmationMails(internDocs, whatsappLink);

    const success = results.filter(r => r.status === "fulfilled").length;
    const failed = results.filter(r => r.status === "rejected").length;

    if (failed === 0) {
      return res.json({ success: true, message: `✅ ${success} confirmation mails sent successfully.` });
    } else {
      return res.json({ success: false, message: `⚠️ ${success} sent, ${failed} failed.` });
    }
  } catch (err) {
    // console.error("Error in confirmation route:", err);
    res.json({ success: false, message: "Server error while sending confirmation mails." });
  }
});


module.exports = router;
