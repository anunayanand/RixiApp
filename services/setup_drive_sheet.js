/**
 * Google Drive + Sheets Auto-Setup Script
 * ----------------------------------------
 * Run AFTER you have added SUBMISSIONS_REFRESH_TOKEN to your .env
 * Run: node services/setup_drive_sheet.js
 *
 * This script will:
 * 1. Create a "RixiLab Project Submissions" folder in Google Drive
 * 2. Create a Google Sheet "RixiLab Project Submissions" with the correct headers
 * 3. Print both IDs → add them to your .env
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { google } = require('googleapis');

const CLIENT_ID      = process.env.CLIENT_ID;
const CLIENT_SECRET  = process.env.CLIENT_SECRET;
const REFRESH_TOKEN  = process.env.SUBMISSIONS_REFRESH_TOKEN;

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.error('\n❌  Missing env vars. Make sure CLIENT_ID, CLIENT_SECRET, and SUBMISSIONS_REFRESH_TOKEN are in your .env\n');
  process.exit(1);
}

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const drive  = google.drive({ version: 'v3', auth: oAuth2Client });
const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });

async function setup() {
  console.log('\n🚀  RixiLab Drive + Sheets Auto-Setup');
  console.log('═══════════════════════════════════════\n');

  // ── 1. Create Google Drive Folder ─────────────────────────────
  console.log('📁  Creating Google Drive folder...');
  const folderRes = await drive.files.create({
    requestBody: {
      name: 'RixiLab Project Submissions',
      mimeType: 'application/vnd.google-apps.folder',
    },
    fields: 'id, name, webViewLink',
  });

  const folderId   = folderRes.data.id;
  const folderLink = folderRes.data.webViewLink;

  // Make folder publicly accessible so anyone with link can view files inside
  await drive.permissions.create({
    fileId: folderId,
    requestBody: { role: 'reader', type: 'anyone' },
  });

  console.log(`✅  Drive folder created: ${folderRes.data.name}`);
  console.log(`    Folder ID : ${folderId}`);
  console.log(`    Folder URL: ${folderLink}\n`);

  // ── 2. Create Google Sheet ─────────────────────────────────────
  console.log('📊  Creating Google Sheet...');
  const sheetRes = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: 'RixiLab Project Submissions' },
      sheets: [{ properties: { title: 'Submissions', index: 0 } }],
    },
  });

  const sheetId  = sheetRes.data.spreadsheetId;
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;

  // Add header row separately
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: 'Submissions!A1:I1',
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        'Timestamp', 'Intern Name', 'Intern ID', 'Project Title',
        'Week', 'Batch', 'Domain', 'Drive File Link', 'Notes'
      ]],
    },
  });

  // Make sheet publicly viewable
  await drive.permissions.create({
    fileId: sheetId,
    requestBody: { role: 'reader', type: 'anyone' },
  });

  console.log(`✅  Google Sheet created: RixiLab Project Submissions`);
  console.log(`    Sheet ID : ${sheetId}`);
  console.log(`    Sheet URL: ${sheetUrl}\n`);

  // ── 3. Print final instructions ────────────────────────────────
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Add these two lines to your .env file:\n');
  console.log(`SUBMISSIONS_DRIVE_FOLDER_ID=${folderId}`);
  console.log(`SUBMISSIONS_SHEET_ID=${sheetId}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('✅  Setup complete! You can now run npm start and test the submission flow.\n');
}

setup().catch(err => {
  console.error('\n❌  Setup failed:', err.message);
  if (err.message.includes('invalid_grant')) {
    console.error('   → The SUBMISSIONS_REFRESH_TOKEN may be invalid or expired. Re-run get_drive_sheets_token.js\n');
  }
  if (err.message.includes('insufficientPermissions') || err.message.includes('ACCESS_TOKEN_SCOPE_INSUFFICIENT')) {
    console.error('   → The token does not have Drive or Sheets scope. Re-run get_drive_sheets_token.js\n');
  }
  process.exit(1);
});
