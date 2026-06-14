const { google } = require("googleapis");
const rawUrl = process.env.BASE_URL || 'https://rixilab.in';
const BASE_URL = rawUrl.replace('https://', 'www.');

const oAuth2Client = new google.auth.OAuth2(
  process.env.OTP_CLIENT_ID,
  process.env.OTP_CLIENT_SECRET
);

oAuth2Client.setCredentials({
  refresh_token: process.env.OTP_REFRESH_TOKEN
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
// 2️⃣ Send confirmation mail for ONE intern
async function sendResetPasswordMail(user, otp) {
  var subject = "Reset Password - Rixi Lab Technologies";

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

  .otp-wrapper{
    width:100% !important;
  }

  .otp-box{
    padding:18px 16px !important;
  }

  .otp{
    font-size:28px !important;
    letter-spacing:4px !important;
  }

  .button{
    display:block !important;
    width:100% !important;
    box-sizing:border-box !important;
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
  src="https://rixilab.in/img/Rixi%20Lab%20New%20Logo%20PNG.png"
  width="52"
  alt="Rixi Lab Technologies"
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
  Reset Your Password
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
  Secure OTP verification for password reset
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
    font-size:15px;
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
    font-size:13px;
    line-height:1.9;
    color:#555;
  "
>
  We received a request to reset your password for your
  <strong>Rixi Lab Technologies</strong> account.
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
  Please use the OTP below to securely continue the password reset process.
</p>

</td>
</tr>
</table>

<!-- OTP Box -->
<table width="100%" style="margin-top:34px;">
<tr>
<td align="center">

<table
  class="otp-wrapper"
  cellpadding="0"
  cellspacing="0"
  align="center"
  style="
    background:#fffaf7;
    border:2px solid #ffd8c2;
    border-radius:18px;
    margin:0 auto;
  "
>
<tr>
<td
  class="otp-box"
  align="center"
  style="
    padding:24px 38px;
    text-align:center;
  "
>

<div
  class="otp"
  style="
    font-size:42px;
    font-weight:bold;
    letter-spacing:10px;
    color:#ff6600;
    line-height:1;
    text-align:center;
    display:block;
    width:100%;
  "
>
  ${otp}
</div>

</td>
</tr>
</table>

</td>
</tr>
</table>

<!-- Security Info -->
<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  style="
    margin-top:28px;
    background:#fff7f0;
    border-radius:18px;
    border:1px solid #ffe0c7;
  "
>
<tr>
<td style="padding:22px;">

<p
  style="
    margin:0;
    font-size:13px;
    font-weight:bold;
    color:#ff6600;
  "
>
  Security Notice
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
  This OTP is valid for <strong>10 minutes</strong>.
  Never share this OTP with anyone for security reasons.
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
  If you did not request a password reset,
  you can safely ignore this email.
</p>

</td>
</tr>
</table>

<!-- Button -->
<table width="100%" style="margin-top:32px;">
<tr>
<td align="center">

<a
  href="https://rixilab.tech"
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
  "
>
  Go to Portal
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
  class="footer-text"
  style="
    margin:18px 0 0;
    color:#999;
    font-size:11px;
    line-height:1.8;
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

  const encodedMail = makeBody(user.email, `"Rixi Lab Technologies" <${process.env.OTP_EMAIL}>`, subject, htmlBody);
  return gmail.users.messages.send({
    userId: 'me',
    resource: {
      raw: encodedMail
    }
  });
}

module.exports = { sendResetPasswordMail };