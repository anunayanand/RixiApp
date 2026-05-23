/**
 * Google Drive + Sheets OAuth2 Refresh Token Generator
 * -----------------------------------------------------
 * Run: node services/get_drive_sheets_token.js
 *
 * Steps:
 * 1. Copy the URL printed below and open it in a browser
 * 2. Sign in with rixilab7@gmail.com and approve Drive + Sheets access
 * 3. Browser will redirect to localhost:3000 (site can't be reached — that's fine)
 * 4. Copy the full redirect URL and paste it here
 * 5. The script will print SUBMISSIONS_REFRESH_TOKEN → add it to your .env
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { google } = require('googleapis');
const readline  = require('readline');

const CLIENT_ID     = process.env.CLIENT_ID;       // rixilab7@gmail.com credentials
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI  = 'http://localhost:3000/callback';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('\n❌  CLIENT_ID or CLIENT_SECRET not found in .env');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',   // force to always return a refresh_token
  scope: [
    'https://www.googleapis.com/auth/drive.file',         // upload/manage files
    'https://www.googleapis.com/auth/spreadsheets',       // read/write sheets
  ],
});

console.log('\n🔑  Google Drive + Sheets OAuth2 Refresh Token Generator');
console.log('──────────────────────────────────────────────────────────');
console.log('\n1. Open this URL in a browser (signed in as rixilab7@gmail.com):\n');
console.log(authUrl);
console.log('\n2. Approve both "Google Drive" and "Google Sheets" permissions.');
console.log('3. Browser redirects to localhost:3000 — site will say "can\'t be reached". That is expected.');
console.log('4. Copy the ENTIRE URL from the address bar and paste it below.\n');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('Paste the full redirect URL here:\n> ', async (inputUrl) => {
  try {
    let code = inputUrl.trim();

    // Extract code from full URL if pasted
    if (code.includes('code=')) {
      const urlObj = new URL(code);
      code = urlObj.searchParams.get('code');
    }

    if (!code) {
      console.error('\n❌  Could not find an auth code in the URL. Please try again.');
      process.exit(1);
    }

    console.log('\n⏳  Exchanging code for tokens...');
    const { tokens } = await oauth2Client.getToken(code);
    const refreshToken = tokens.refresh_token;

    if (!refreshToken) {
      console.error('\n❌  No refresh_token returned. Make sure you used prompt: consent.');
      process.exit(1);
    }

    console.log('\n✅  Success! Add this to your .env file:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`SUBMISSIONS_REFRESH_TOKEN=${refreshToken}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('Next steps:');
    console.log('  1. Copy the token above into your .env as SUBMISSIONS_REFRESH_TOKEN');
    console.log('  2. Run: node services/setup_drive_sheet.js');
    console.log('     (creates your Drive folder + Sheet automatically)\n');

  } catch (err) {
    console.error('\n❌  Error exchanging code:', err.message);
  } finally {
    rl.close();
  }
});
