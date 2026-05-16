const cron = require("node-cron");
const Bootcamp = require("../models/Bootcamp");
const BootcampUser = require("../models/BootcampUser");
const { google } = require("googleapis");

// ==============================
// GMAIL CONFIGURATION
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
// CRON JOB: 30-Min Session Reminders
// ==============================
// Runs every minute to check if any session starts in exactly 30 minutes.
cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();

    // Find bootcamps that are live
    const bootcamps = await Bootcamp.find({ status: "live" });

    for (const bootcamp of bootcamps) {
      for (const session of bootcamp.sessions) {
        const sessionTime = new Date(session.time);

        // Check if session starts exactly within the next 30 minutes
        const timeDiffMinutes = (sessionTime.getTime() - now.getTime()) / 60000;
        
        if (timeDiffMinutes > 29 && timeDiffMinutes <= 30) {
          const loginLink = `${process.env.BASE_URL || "https://www.rixilab.tech"}/bootcamp-portal/login`;

          // Send email to all enrolled users
          for (const userId of bootcamp.usersEnrolled) {
            const user = await BootcampUser.findById(userId);
            if (user) {
              const subject = `Reminder: Bootcamp Session starting in 30 minutes!`;
              const body = `<!DOCTYPE html>
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

      .card-title{
        font-size:15px !important;
      }

      .list-text{
        font-size:13px !important;
      }

      .button{
        width:100% !important;
        display:block !important;
        text-align:center !important;
        box-sizing:border-box !important;
        padding:14px 18px !important;
        font-size:14px !important;
      }

      .session-card{
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
          Session Reminder
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
          Your upcoming session starts in 30 minutes.
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
            font-size:16px;
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
            font-size:14px;
            line-height:1.9;
            color:#555;
          "
        >
          Get ready for your upcoming session
          <strong>${session.session_id}</strong>
          from <strong>${bootcamp.name}</strong>.
        </p>

      </td>
    </tr>
  </table>

  <!-- Session Card -->
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
      <td class="session-card" style="padding:24px;">

        <p 
          class="card-title"
          style="
            margin:0 0 16px;
            font-size:16px;
            font-weight:bold;
            color:#222;
          "
        >
          Session Details
        </p>

        <ul style="padding-left:18px;margin:0;color:#555;">

          <li 
            class="list-text"
            style="
              margin-bottom:10px;
              line-height:1.8;
              font-size:14px;
            "
          >
            <strong>Session ID:</strong>
            ${session.session_id}
          </li>

          <li 
            class="list-text"
            style="
              margin-bottom:10px;
              line-height:1.8;
              font-size:14px;
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
              font-size:14px;
            "
          >
            <strong>Time:</strong>
            ${sessionTime.toLocaleString('en-IN')}
          </li>

          <li 
            class="list-text"
            style="
              margin-bottom:10px;
              line-height:1.8;
              font-size:14px;
            "
          >
            <strong>Instructor:</strong>
            ${session.instructor || 'TBA'}
          </li>

          <li 
            class="list-text"
            style="
              line-height:1.8;
              font-size:14px;
            "
          >
            <strong>Details:</strong>

            <ul style="padding-left:18px;margin-top:10px;">

              ${(session.details || '')
                .split('\\n')
                .filter(d => d.trim().length > 0)
                .map(point => `
                  <li style="margin-bottom:8px;line-height:1.7;">
                    ${point.replace(/^-/, '').trim()}
                  </li>
                `).join('')}

            </ul>

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
          href="${loginLink}"
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
          Go to Dashboard
        </a>

      </td>
    </tr>
  </table>

  <!-- Footer -->
  <table 
    width="100%" 
    style="
      margin-top:38px;
      border-top:1px solid #ececec;
    "
  >
    <tr>
      <td align="center" style="padding-top:20px;">

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

        <a 
          href="https://rixilab.tech"
          class="footer-text"
          style="
            color:#ff6600;
            text-decoration:none;
            font-size:12px;
            font-weight:bold;
          "
        >
          www.rixilab.tech
        </a>

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
                user.email,
                process.env.EMAIL,
                subject,
                body,
              );

              // Send mail asynchronously
              gmail.users.messages
                .send({ userId: "me", resource: { raw: encodedMail } })
                .catch((err) =>
                  console.error(
                    `Failed sending reminder to ${user.email}`,
                    err.message,
                  ),
                );
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("Bootcamp Reminder Cron Error:", err);
  }
});
