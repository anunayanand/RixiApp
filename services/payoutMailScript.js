const { google } = require("googleapis");
const rawUrl = process.env.BASE_URL || 'https://rixilab.in';
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

async function sendPayoutSuccessMail({ name, email, amount, transactionId, title }) {
  let date = new Date();
  const formattedDate = date.toLocaleDateString('en-GB');
  const subject = "Payment Processed - Rixi Lab Technologies";

  const htmlBody = `

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

  .card-padding{
    padding:18px !important;
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
  src="https://www.rixilab.in/img/Rixi%20Lab%20New%20Logo%20PNG.png"
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
  Payment Successful
</h1>

<p
  style="
    margin:12px 0 0;
    color:#777;
    font-size:14px;
    line-height:1.7;
  "
>
  Your payment has been processed successfully
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
  We are pleased to inform you that your payment request for
  <strong>${title}</strong> has been successfully processed.
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
  Thank you for being part of Rixi Lab Technologies.
</p>

</td>
</tr>
</table>

<!-- Payment Details -->
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
  Payment Details
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

<strong>Amount:</strong> ₹${amount}<br/>
<strong>Transaction ID:</strong> ${transactionId}<br/>
<strong>Date Processed:</strong> ${formattedDate}<br/>
<strong>Status:</strong> Successfully Processed

</td>
</tr>
</table>

</td>
</tr>
</table>

<!-- Message -->
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
  If you have any questions or face any issues regarding this transaction,
  please feel free to contact the administration or support team.
</p>

</td>
</tr>
</table>

<!-- Button -->
<table width="100%" style="margin-top:34px;">
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
  Visit Dashboard
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

  const encodedMail = makeBody(email, `"Rixi Lab Technologies" <${process.env.PROJECT_INFO_EMAIL}>`, subject, htmlBody);
  return gmail.users.messages.send({
    userId: 'me',
    resource: {
      raw: encodedMail
    }
  });
}

async function sendVoucherEmail({ name, email, rewardType, voucherCode, pointsUsed, date }) {
  const formattedDate = date.toLocaleDateString('en-GB');
  const subject = "Reward Redeemed Successfully - Rixi Lab Technologies";
  
  const htmlBody = `
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

  .card-padding{
    padding:18px !important;
  }

  .button{
    display:block !important;
    width:100% !important;
    box-sizing:border-box !important;
  }

  .voucher-code{
    font-size:20px !important;
    letter-spacing:1px !important;
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
  src="https://www.rixilab.in/img/Rixi%20Lab%20New%20Logo%20PNG.png"
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
  Reward Redeemed
</h1>

<p
  style="
    margin:12px 0 0;
    color:#777;
    font-size:14px;
    line-height:1.7;
  "
>
  Your reward redemption has been processed successfully
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
  Congratulations! Your redemption request for
  <strong>${rewardType}</strong> has been approved successfully.
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
  Your voucher / gift code is provided below. Please keep it secure and use it before expiry if applicable.
</p>

</td>
</tr>
</table>

<!-- Voucher Card -->
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
<td class="card-padding" style="padding:24px; text-align:center;">

<p
  style="
    margin:0;
    font-size:13px;
    font-weight:bold;
    color:#222;
  "
>
  Voucher Details
</p>

<div
  class="voucher-code"
  style="
    margin-top:18px;
    padding:18px;
    background:#ffece0;
    border:2px dashed #ff9955;
    border-radius:14px;
    font-size:28px;
    font-weight:bold;
    letter-spacing:2px;
    color:#ff6600;
  "
>
  ${voucherCode}
</div>

<table width="100%" style="margin-top:18px;">
<tr>
<td
  style="
    font-size:13px;
    color:#555;
    line-height:2;
    text-align:left;
  "
>

<strong>Reward:</strong> ${rewardType}<br/>
<strong>Credits Used:</strong> ${pointsUsed}<br/>
<strong>Date Processed:</strong> ${formattedDate}<br/>
<strong>Status:</strong> Successfully Redeemed

</td>
</tr>
</table>

</td>
</tr>
</table>

<!-- Message -->
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
  Thank you for being part of the Rixi Lab Technologies community and actively participating in our referral program.
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
  If you face any issues while redeeming your voucher or have any questions,
  please contact the support team.
</p>

</td>
</tr>
</table>

<!-- Button -->
<table width="100%" style="margin-top:34px;">
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
  Visit Dashboard
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

  const encodedMail = makeBody(email, `"Rixi Lab Technologies" <${process.env.PROJECT_INFO_EMAIL}>`, subject, htmlBody);
  return gmail.users.messages.send({
    userId: 'me',
    resource: { raw: encodedMail }
  });
}

module.exports = { sendPayoutSuccessMail, sendVoucherEmail };
