const { google } = require("googleapis");
require("dotenv").config();

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

  return Buffer.from(str).toString("base64").replace(/\+/g, '-').replace(/\//g, '_');
}

// ==============================
// EXPORTED FUNCTION
// ==============================
async function sendRejectionMail(email, name, projectTitle, reason) {
  try {
    const subject = `Rixi Lab ${projectTitle} - Rejected`;
    const BASE_URL = process.env.BASE_URL;

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
<td class="content" style="padding:40px 32px;">

<!-- Header -->
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
  src="https://www.rixilab.tech/img/Rixi%20Lab%20New%20Logo%20PNG.png"
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
    font-size:30px;
    color:#ff6600;
    font-weight:bold;
  "
>
  ${projectTitle.split(' ').slice(0, 2).join(' ')} Rejected
</h1>

<p
  style="
    margin:10px 0 0;
    color:#777;
    font-size:14px;
    line-height:1.7;
  "
>
  Please review the feedback and upload the updated project
</p>

</td>
</tr>
</table>

<!-- Body -->
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
  Dear <strong>${name}</strong>,
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
  Your submission for <strong>${projectTitle}</strong>
  has been reviewed and unfortunately it has been rejected.
</p>

</td>
</tr>
</table>

<!-- Feedback -->
<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  style="
    margin-top:24px;
    background:#fffaf7;
    border:1px solid #ffd8c2;
    border-radius:16px;
  "
>
<tr>
<td style="padding:20px;">

<p
  style="
    margin:0;
    font-size:13px;
    font-weight:bold;
    color:#ff6600;
  "
>
  Reason : 
</p>

<p
  class="normal-text"
  style="
    margin:12px 0 0;
    font-size:13px;
    line-height:1.8;
    color:#555;
  "
>
  ${reason || 'Please review the project guidelines carefully and submit again.'}
</p>

</td>
</tr>
</table>

<!-- Reminder -->
<table width="100%" style="margin-top:24px;">
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
  Please make the required corrections and upload the updated
  project before the submission deadline.
</p>

</td>
</tr>
</table>

<!-- Button -->
<table width="100%" style="margin-top:30px;">
<tr>
<td align="center">

<a
  href="${BASE_URL}/login"
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
  Go to Dashboard
</a>

</td>
</tr>
</table>

<!-- Footer -->
<table
  width="100%"
  style="
    margin-top:36px;
    border-top:1px solid #ececec;
  "
>
<tr>
<td align="center" style="padding-top:20px;">

<p
  style="
    margin:0;
    color:#888;
    font-size:12px;
    line-height:1.8;
  "
>
  © ${new Date().getFullYear()} Rixi Lab • www.rixilab.tech
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

    const encodedMail = makeBody(
      email,
      `"Rixi Lab" <${process.env.PROJECT_INFO_EMAIL}>`,
      subject,
      body
    );
    
    await gmail.users.messages.send({
      userId: 'me',
      resource: {
        raw: encodedMail
      }
    });

    // console.log(`✅ Rejection email sent to ${email} for project: ${projectTitle}`);
    return { success: true };
  } catch (err) {
    // console.error(`❌ Failed to send rejection email to ${email}:`, err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { sendRejectionMail };
