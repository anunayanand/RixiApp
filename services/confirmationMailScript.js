const { google } = require("googleapis");
const rawUrl = process.env.BASE_URL || 'https://rixilab.tech';
const BASE_URL = rawUrl.replace('https://', 'www.');

const oAuth2Client = new google.auth.OAuth2(
  process.env.PROJECT_INFO_CLIENT_ID,
  process.env.PROJECT_INFO_CLIENT_SECRET
);

oAuth2Client.setCredentials({
  refresh_token: process.env.PROJECT_INFO_REFRESH_TOKEN
});

const gmail = google.gmail({
  version: "v1",
  auth: oAuth2Client
});

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

// 1️⃣ Decide WhatsApp group per batch
function getWhatsappLinkByBatch(batch_no) {
  var links = {
    "2601": "https://chat.whatsapp.com/JFZiP7etplO3rC1w8GzdPM",
    "2602": "https://chat.whatsapp.com/DaIgkARMuz3BDGRH363QyL",
    "2603": "https://chat.whatsapp.com/CCUn8H4HvgD7Jqwuy6I3NS?mode=gi_t",
    "2604": "https://chat.whatsapp.com/ICEsV5PcfirBK7DcJ22ahY?mode=gi_t",
    "2605": "https://chat.whatsapp.com/KYesxuI7eIT8zzGjyEEYKU?mode=gi_t",
    "2606": "https://chat.whatsapp.com/FgUkJka0h5lGZ0Y4kjUqay?mode=hqctcla",
    "2607": "https://chat.whatsapp.com/KJYOikJIlsCCeEwWK9MRqy?mode=gi_t"
  };

  return links[String(batch_no)] || "";
}

// 2️⃣ Send confirmation mail for ONE intern
async function sendConfirmationMail(intern) {
  var whatsappLink = getWhatsappLinkByBatch(intern.batch_no);

  var subject = "Internship Confirmation - Welcome to Rixi Lab!";

  var htmlBody = `
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
    font-size:25px !important;
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
  Internship Accepted 
</h1>

<p
  style="
    margin:12px 0 0;
    color:#777;
    font-size:14px;
    line-height:1.7;
  "
>
  Welcome to the Rixi Lab Internship Program
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
  Dear <strong>${intern.name}</strong>,
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
  Congratulations! We are excited to inform you that your
  application for the internship at
  <strong>Rixi Lab</strong> has been successfully accepted.
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
  We are thrilled to welcome you aboard and look forward to
  supporting you through this exciting journey of learning,
  innovation, and growth.
</p>

</td>
</tr>
</table>

<!-- Internship Details -->
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
  Internship Details
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

<strong>Start Date:</strong> ${intern.starting_date}<br/>
<strong>Domain:</strong> ${intern.domain}<br/>
<strong>Duration:</strong> ${intern.duration} Weeks

</td>
</tr>
</table>

</td>
</tr>
</table>

<!-- WhatsApp Section -->
<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  style="
    margin-top:24px;
    background:#f7fff8;
    border-radius:18px;
    border:1px solid #cdeed4;
  "
>
<tr>
<td class="card-padding" style="padding:24px;">

<p
  style="
    margin:0;
    font-size:13px;
    font-weight:bold;
    color:#16a34a;
  "
>
 Next Step
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
  To receive important announcements, internship updates,
  resources, and communication, please join our official
  internship WhatsApp group.
</p>

<table width="100%" style="margin-top:22px;">
<tr>
<td align="center">

<a
  href="${whatsappLink}"
  class="button"
  style="
    background:#22c55e;
    color:#ffffff;
    text-decoration:none;
    padding:14px 28px;
    border-radius:12px;
    font-weight:bold;
    display:inline-block;
    font-size:14px;
  "
>
  Join WhatsApp Group
</a>

</td>
</tr>
</table>

<p
  class="normal-text"
  style="
    margin:20px 0 0;
    font-size:12px;
    line-height:1.8;
    color:#666;
  "
>
  <strong>Important:</strong>
  Please join the group using your registered mobile number
  to help us verify your identity and provide smooth communication.
</p>

</td>
</tr>
</table>

<!-- Appreciation -->
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
  We are excited to have you as part of the Rixi Lab community.
  Get ready to collaborate, learn new skills, and work on impactful projects.
</p>

<p
  style="
    margin:18px 0 0;
    font-size:14px;
    font-weight:bold;
    color:#222;
  "
>
  Best wishes for your internship journey 
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

  const encodedMail = makeBody(intern.email, process.env.PROJECT_INFO_EMAIL, subject, htmlBody);
  return gmail.users.messages.send({
    userId: 'me',
    resource: {
      raw: encodedMail
    }
  });
}

module.exports = { sendConfirmationMail };