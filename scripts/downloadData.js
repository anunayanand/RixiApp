const { MongoClient, BSON } = require("mongodb");
const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");
const rawUrl = process.env.BASE_URL || 'https://rixilab.in';
const BASE_URL = rawUrl.replace('https://', 'www.');
// dotenv is loaded by app.js when run via cron; keep this only for standalone runs
if (require.main === module) {
    require("dotenv").config({ path: path.join(__dirname, "../.env") });
}

// ==============================
// CONFIGURATION: Gmail API
// ==============================
const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI || "https://developers.google.com/oauthplayground"
);

oAuth2Client.setCredentials({
  refresh_token: process.env.REFRESH_TOKEN
});

const gmail = google.gmail({
  version: "v1",
  auth: oAuth2Client
});

// ==============================
// HELPER: Encode Multipart Email
// ==============================
function makeMultipartBody(to, from, subject, message, attachments) {
    const boundary = "rixi-backup-boundary-" + Date.now().toString(16);
    let chunks = [
        `To: ${to}`,
        `From: ${from}`,
        `Subject: ${subject}`,
        `MIME-Version: 1.0`,
        `Content-Type: multipart/mixed; boundary="${boundary}"`,
        ``,
        `--${boundary}`,
        `Content-Type: text/html; charset="UTF-8"`,
        `MIME-Version: 1.0`,
        ``,
        message,
        ``
    ];

    for (const file of attachments) {
        const fileContent = fs.readFileSync(file.path, { encoding: "base64" });
        chunks.push(
            `--${boundary}`,
            `Content-Type: ${file.mimeType || "application/octet-stream"}; name="${file.name}"`,
            `Content-Disposition: attachment; filename="${file.name}"`,
            `Content-Transfer-Encoding: base64`,
            ``,
            fileContent,
            ``
        );
    }

    chunks.push(`--${boundary}--`);
    const str = chunks.join("\r\n");
    return Buffer.from(str).toString("base64").replace(/\+/g, "-").replace(/\//g, "_");
}

async function exportData() {
    let client;
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) {
            throw new Error("MONGO_URI is not defined. Please verify the .env file.");
        }

        // console.log("Connecting to MongoDB...");
        client = new MongoClient(uri);
        await client.connect();
        // console.log("Connected successfully!");

        const dbName = "test"; 
        const db = client.db(dbName);

        // Generate dynamic folder name based on current date
        const date = new Date();
        const dd = String(date.getDate()).padStart(2, "0");
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const yy = String(date.getFullYear()).slice(-2);
        const folderName = `Backup [${dd}-${mm}-${yy}]`;
        
        // Folder path in the same 'utilities' folder
        const folderPath = path.join(__dirname, folderName);

        // Create the backup folder if it does not exist
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
            // console.log(`Created backup folder: ${folderName}`);
        }

        // Get all collections in the database
        const collections = await db.listCollections().toArray();
        if (collections.length === 0) {
            // console.log(`No collections found in the '${dbName}' database.`);
            return;
        }

        // console.log(`Found ${collections.length} collections. Starting download...`);

        const attachments = [];

        // Fetch data and save as JSON file for each collection
        for (const col of collections) {
            const collectionName = col.name;
            const data = await db.collection(collectionName).find({}).toArray();

            const filePath = path.join(folderPath, `${collectionName}.json`);
            fs.writeFileSync(filePath, BSON.EJSON.stringify(data, null, 2));

            attachments.push({
                name: `${collectionName}.json`,
                path: filePath,
                mimeType: "application/json"
            });

            // console.log(`Saved ${data.length} documents from '${collectionName}'`);
        }

        // console.log(`\n✅ All Data Exported Successfully into '${folderName}'`);
        
        // console.log(`\n📧 Preparing email with attachments...`);

        // Use the configured email address to send the backup to
        const recipientEmail = process.env.BACKUP_EMAIL;
        if (!recipientEmail) {
            throw new Error("BACKUP_EMAIL is not defined. Please add it to your .env file.");
        }
        const subject = `Database Backup Report ${folderName}`;

        // Build table rows for collections
        const tableRows = attachments.map(a => {
            const stats = fs.statSync(a.path);
            const sizeKB = (stats.size / 1024).toFixed(1);
            return `<tr>
                <td style="padding:10px 14px; border-bottom:1px solid #f0ece8; font-size:14px; color:#333;">
                    <span style="display:inline-block; background:#fff3ec; border:1px solid #ff6600; border-radius:4px; padding:2px 8px; font-weight:600; color:#ff6600;">${a.name}</span>
                </td>
                <td style="padding:10px 14px; border-bottom:1px solid #f0ece8; font-size:13px; color:#666; text-align:right;">${sizeKB} KB</td>
            </tr>`;
        }).join("");

        const body = `<!DOCTYPE html>

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

  .mobile-stack{
    display:block !important;
    width:100% !important;
  }

  .card-padding{
    padding:18px !important;
  }

  .footer-text{
    font-size:11px !important;
  }

  .badge{
    font-size:12px !important;
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

<!-- TOP ACCENT -->
<tr>
  <td height="6" bgcolor="#ff6600"></td>
</tr>

<tr>
<td class="content" style="padding:42px 34px;">

<!-- LOGO -->
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
    font-size:32px;
    line-height:1.25;
    color:#ff6600;
    font-weight:bold;
  "
>
  Database Backup Report
</h1>

<p
  style="
    margin:12px 0 0;
    color:#777;
    font-size:14px;
    line-height:1.7;
  "
>
  ${dd} ${
    ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(mm)-1]
  } 20${yy} • Automated Backup
</p>

</td>
</tr>
</table>

<!-- SUMMARY -->
<table width="100%" style="margin-top:24px;">
<tr>

<td
  class="mobile-stack"
  width="50%"
  style="padding-right:8px;"
>

<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  style="
    background:#fffaf7;
    border:1px solid #ffd8c2;
    border-radius:18px;
  "
>
<tr>
<td align="center" style="padding:24px;">

<div
  style="
    font-size:32px;
    font-weight:bold;
    color:#ff6600;
  "
>
  ${collections.length}
</div>

<div
  style="
    margin-top:8px;
    color:#777;
    font-size:12px;
    text-transform:uppercase;
    letter-spacing:1px;
  "
>
  Collections
</div>

</td>
</tr>
</table>

</td>

<td
  class="mobile-stack"
  width="50%"
  style="padding-left:8px;"
>

<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  style="
    background:#f5f7ff;
    border:1px solid #d8deff;
    border-radius:18px;
  "
>
<tr>
<td align="center" style="padding:24px;">

<div
  style="
    font-size:18px;
    font-weight:bold;
    color:#3f51b5;
  "
>
  ${folderName}
</div>

<div
  style="
    margin-top:8px;
    color:#777;
    font-size:12px;
    text-transform:uppercase;
    letter-spacing:1px;
  "
>
  Backup Reference
</div>

</td>
</tr>
</table>

</td>

</tr>
</table>

<!-- ATTACHMENTS -->
<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  style="
    margin-top:30px;
    background:#fafafa;
    border:1px solid #ececec;
    border-radius:18px;
  "
>
<tr>
<td class="card-padding" style="padding:24px;">

<p
  style="
    margin:0 0 18px;
    font-size:14px;
    font-weight:bold;
    color:#222;
  "
>
  📎 Attached Backup Files
</p>

<table width="100%" cellpadding="0" cellspacing="0">
${attachments.map(file => {
  const stats = fs.statSync(file.path);
  const sizeKB = (stats.size / 1024).toFixed(1);

  return `
  <tr>
    <td style="
      padding:12px 0;
      border-bottom:1px solid #ececec;
    ">

      <table width="100%">
      <tr>

      <td>
        <span style="
          background:#fff3eb;
          color:#ff6600;
          border:1px solid #ffd3bc;
          padding:6px 10px;
          border-radius:8px;
          font-size:12px;
          font-weight:bold;
          display:inline-block;
        ">
          ${file.name}
        </span>
      </td>

      <td
        align="right"
        style="
          color:#777;
          font-size:12px;
        "
      >
        ${sizeKB} KB
      </td>

      </tr>
      </table>

    </td>
  </tr>
  `;
}).join("")}
</table>

</td>
</tr>
</table>

<!-- SECURITY NOTICE -->
<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  style="
    margin-top:24px;
    background:#fffaf7;
    border-radius:18px;
    border:1px solid #ffd8c2;
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
  🔒 Security Notice
</p>

<p
  style="
    margin:12px 0 0;
    font-size:13px;
    color:#555;
    line-height:1.8;
  "
>
  This email contains database exports and potentially sensitive
  information. Store all attachments securely and avoid sharing
  them outside authorized environments.
</p>

</td>
</tr>
</table>

<!-- FOOTER -->
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
    font-size:14px;
    font-weight:bold;
    color:#222;
  "
>
  Rixi Lab Technologies
</p>

<p
  class="footer-text"
  style="
    margin:10px 0 0;
    color:#888;
    font-size:12px;
    line-height:1.8;
  "
>
  Rethink Innovate eXecute Inspire
</p>

<p style="margin:20px 0 0;">

<a href="https://www.instagram.com/rixilab.in" style="display:inline-block;margin:0 6px;">
<img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" width="24"/>
</a>

<a href="https://www.linkedin.com/company/rixilab" style="display:inline-block;margin:0 6px;">
<img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" width="24"/>
</a>

<a href="https://www.facebook.com/rixilab" style="display:inline-block;margin:0 6px;">
<img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" width="24"/>
</a>

</p>

<p
  class="footer-text"
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

        const encodedMail = makeMultipartBody(recipientEmail, `"Rixi Lab Technologies" <${process.env.EMAIL}>`, subject, body, attachments);
        
        // console.log(`Sending email to ${recipientEmail}...`);
        await gmail.users.messages.send({
            userId: "me",
            resource: {
                raw: encodedMail
            }
        });

        // console.log(`✅ Backup email successfully sent to ${recipientEmail}`);

        // Cleanup: delete all exported files and the backup folder
        // console.log(`\n🧹 Cleaning up local backup files...`);
        for (const file of attachments) {
            fs.unlinkSync(file.path);
        }
        fs.rmdirSync(folderPath);
        // console.log(`✅ Local backup folder '${folderName}' deleted.`);

    } catch (error) {
        console.error("[Monthly Backup] ❌ Error:", error.message || error);
    } finally {
        if (client) {
            await client.close();
            // console.log("MongoDB connection closed.");
        }
    }
}

// Run directly via: node utilities/downloadData.js
if (require.main === module) {
    exportData();
}

module.exports = { exportData };
