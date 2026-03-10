const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");
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
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

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
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background-color:#f4f0ed; font-family:'Segoe UI', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f0ed; padding: 30px 0;">
    <tr><td align="center">
      <table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.10);">
        
        <!-- HEADER -->
        <tr>
          <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #ff6600 200%); padding: 36px 40px; text-align:center;">
            <img src="https://rixilab.tech/img/Rixi%20Lab%20New%20Logo%20PNG.png" alt="Rixi Lab" width="130" style="display:block; margin: 0 auto 16px auto; filter: brightness(10);">
            <h1 style="margin:0; font-size:22px; color:#ffffff; font-weight:700; letter-spacing:0.5px;">Database Backup Report</h1>
            <p style="margin:6px 0 0; font-size:13px; color:rgba(255,255,255,0.70); letter-spacing:0.3px;">${dd} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(mm)-1]} 20${yy} &nbsp;|&nbsp; Auto-Generated</p>
          </td>
        </tr>

        <!-- STATUS BADGE -->
        <tr>
          <td style="padding:24px 40px 0; text-align:center;">
            <span style="display:inline-block; background:#e8f5e9; color:#2e7d32; border:1px solid #a5d6a7; border-radius:20px; padding:6px 20px; font-size:13px; font-weight:600;">✅ &nbsp;Backup Completed Successfully</span>
          </td>
        </tr>

        <!-- SUMMARY CARDS -->
        <tr>
          <td style="padding: 20px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="50%" style="padding-right:8px;">
                  <div style="background:#fff8f4; border:1px solid #ffe0cc; border-radius:8px; padding:16px 18px; text-align:center;">
                    <p style="margin:0 0 4px; font-size:26px; font-weight:700; color:#ff6600;">${collections.length}</p>
                    <p style="margin:0; font-size:12px; color:#888; text-transform:uppercase; letter-spacing:0.5px;">Collections Backed Up</p>
                  </div>
                </td>
                <td width="50%" style="padding-left:8px;">
                  <div style="background:#f3f4ff; border:1px solid #d0d3ff; border-radius:8px; padding:16px 18px; text-align:center;">
                    <p style="margin:0 0 4px; font-size:26px; font-weight:700; color:#3f51b5;">${folderName}</p>
                    <p style="margin:0; font-size:12px; color:#888; text-transform:uppercase; letter-spacing:0.5px;">Backup Reference</p>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- FILES TABLE -->
        <tr>
          <td style="padding: 0 40px 24px;">
            <p style="font-size:14px; font-weight:600; color:#444; margin:0 0 10px;">📎 Attached Files</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0ece8; border-radius:8px; overflow:hidden;">
              <thead>
                <tr style="background:#faf5f2;">
                  <th style="padding:10px 14px; text-align:left; font-size:12px; color:#888; text-transform:uppercase; letter-spacing:0.5px; font-weight:600; border-bottom:1px solid #f0ece8;">Collection</th>
                  <th style="padding:10px 14px; text-align:right; font-size:12px; color:#888; text-transform:uppercase; letter-spacing:0.5px; font-weight:600; border-bottom:1px solid #f0ece8;">Size</th>
                </tr>
              </thead>
              <tbody>${tableRows}</tbody>
            </table>
          </td>
        </tr>

        <!-- NOTE -->
        <tr>
          <td style="padding: 0 40px 28px;">
            <div style="background:#fffbf0; border-left:4px solid #ffca28; border-radius:6px; padding:12px 16px;">
              <p style="margin:0; font-size:13px; color:#7a6000;">⚠️ This email contains sensitive data. Please store the attached files securely and do not share them externally.</p>
            </div>
          </td>
        </tr>

        <!-- DIVIDER -->
        <tr><td style="padding: 0 40px;"><hr style="border:none; border-top:1px solid #f0ece8; margin:0;"></td></tr>

        <!-- FOOTER -->
        <tr>
          <td style="padding:22px 40px; text-align:center;">
            <p style="margin:0 0 10px; font-size:15px; font-weight:700; color:#1a1a2e;">Rixi Lab</p>
            <p style="margin:0 0 12px; font-size:12px; color:#aaa; font-style:italic;">"Rethink Innovate eXecute Inspire"</p>
            <a href="https://www.instagram.com/rixilab.in" target="_blank" style="margin:0 6px;">
              <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="Instagram" width="22" style="vertical-align:middle;">
            </a>
            <a href="https://www.linkedin.com/company/rixilab" target="_blank" style="margin:0 6px;">
              <img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" alt="LinkedIn" width="22" style="vertical-align:middle;">
            </a>
            <a href="https://www.facebook.com/rixilab" target="_blank" style="margin:0 6px;">
              <img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Facebook" width="22" style="vertical-align:middle;">
            </a>
            <p style="margin:14px 0 0; font-size:11px; color:#ccc;">© 2026 Rixi Lab &nbsp;|&nbsp; <a href="https://rixilab.tech" style="color:#ff6600; text-decoration:none;">www.rixilab.tech</a></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

        const encodedMail = makeMultipartBody(recipientEmail, process.env.EMAIL, subject, body, attachments);
        
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
