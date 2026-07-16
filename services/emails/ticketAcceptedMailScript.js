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

async function sendTicketAcceptedMail(intern, ticketSubject) {
  var subject = `Support Ticket Accepted`;

  var htmlBody = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<style>
body{ margin:0; padding:0; background:#f5f5f5; font-family:Arial,sans-serif; }
table{ border-spacing:0; }
img{ border:0; display:block; }
@media screen and (max-width:600px){
  .container{ width:100% !important; }
  .content{ padding:24px 18px !important; }
  .heading{ font-size:25px !important; line-height:1.3 !important; }
  .normal-text{ font-size:13px !important; line-height:1.8 !important; }
  .button{ display:block !important; width:100% !important; box-sizing:border-box !important; }
  .card-padding{ padding:18px !important; }
  .footer-text{ font-size:11px !important; }
}
</style>
</head>
<body>
<table width="100%" bgcolor="#f5f5f5" cellpadding="0" cellspacing="0">
<tr>
<td align="center" style="padding:24px 12px;">
<table width="620" class="container" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="max-width:620px; border-radius:24px; overflow:hidden; border:1px solid #ececec;">
<tr><td height="6" bgcolor="#ff6600"></td></tr>
<tr>
<td class="content" style="padding:42px 34px;">
<table width="100%">
<tr>
<td align="center">
<table width="90" height="90" cellpadding="0" cellspacing="0" style="background:#fff3eb; border-radius:50%;">
<tr><td align="center" valign="middle">
<img src="https://rixilab.in/img/Rixi%20Lab%20New%20Logo%20PNG.png" width="54" alt="Rixi Lab"/>
</td></tr>
</table>
<h1 class="heading" style="margin:24px 0 0; font-size:32px; line-height:1.25; color:#ff6600; font-weight:bold;">
Ticket Accepted
</h1>
<p style="margin:12px 0 0; color:#777; font-size:14px; line-height:1.7;">
A support representative has accepted your ticket.
</p>
</td>
</tr>
</table>
<table width="100%" style="margin-top:40px;">
<tr>
<td>
<p style="margin:0; font-size:15px; color:#222; font-weight:500;">
Dear <strong>${intern.name}</strong>,
</p>
<p class="normal-text" style="margin:18px 0 0; font-size:13px; line-height:1.9; color:#555;">
This is to notify you that your support ticket regarding "<strong>${ticketSubject}</strong>" has been accepted and a support agent is ready to assist you.
</p>
</td>
</tr>
</table>
<table width="100%" style="margin-top:30px;">
<tr>  
<td align="center">
<a href="${rawUrl}/login" class="button" style="background:#ff6600; color:#ffffff; text-decoration:none; padding:14px 28px; border-radius:12px; font-weight:bold; display:inline-block; font-size:14px;">
Go to Support Chat
</a>
</td>
</tr>
</table>
<table width="100%" style="margin-top:40px; border-top:1px solid #ececec;">
<tr>
<td align="center" style="padding-top:24px;">
<p class="footer-text" style="margin:0; color:#888; font-size:12px; line-height:1.8;">
Rixi Lab Technologies • Rethink Innovate eXecute Inspire
</p>
<p class="footer-text" style="margin:18px 0 0; color:#999; font-size:11px; line-height:1.8;">
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

  const encodedMail = makeBody(intern.email, `"Rixi Lab Support" <${process.env.OTP_EMAIL}>`, subject, htmlBody);
  return gmail.users.messages.send({
    userId: 'me',
    resource: {
      raw: encodedMail
    }
  });
}

module.exports = { sendTicketAcceptedMail };
