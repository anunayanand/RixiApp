/**
 * Gmail OAuth2 Refresh Token Generator
 * ------------------------------------
 * Run: node get_refresh_token.js
 *
 * Steps:
 * 1. A browser window opens with Google's consent page
 * 2. Sign in with rixilab7@gmail.com and approve
 * 3. This script captures the auth code, exchanges it for tokens,
 *    and prints the new REFRESH_TOKEN to the console.
 *
 * IMPORTANT (one-time setup):
 * Add  http://localhost:3001/callback  as an Authorized Redirect URI
 * in your Google Cloud Console → APIs & Services → Credentials → your OAuth client.
 */

require('dotenv').config();
const { google } = require('googleapis');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const CLIENT_ID     = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI  = 'http://localhost:3000/callback';

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://mail.google.com/'],
});

console.log('\n🔑  Gmail OAuth2 Refresh Token Generator (Manual Mode)');
console.log('──────────────────────────────────────────────────────');
console.log('Since you are logged in on another device, follow these steps:\n');
console.log('1. Copy the URL below and open it on the device where you are logged in:');
console.log('\n' + authUrl + '\n');
console.log('2. Authorize the application.');
console.log('3. The browser will redirect you to a page that says "Site cannot be reached" (localhost:3000).');
console.log('4. Look at the URL in the address bar. It will look like:');
console.log('   http://localhost:3000/callback?code=4/0AeaY...&scope=...\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('5. Copy the ENTIRE URL from the address bar and paste it here:\n> ', async (inputUrl) => {
  try {
    let code = inputUrl;
    
    // If they pasted the full URL, extract just the code
    if (inputUrl.includes('code=')) {
      const urlObj = new URL(inputUrl);
      code = urlObj.searchParams.get('code');
    }

    if (!code) {
      console.log('❌ Could not find a code in your input.');
      process.exit(1);
    }

    console.log('\n⏳ Exchanging code for tokens...');
    const { tokens } = await oauth2Client.getToken(code);
    const refreshToken = tokens.refresh_token;

    console.log('\n✅  Tokens received!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`REFRESH_TOKEN=${refreshToken}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Auto-update .env
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf-8');
      if (envContent.includes('REFRESH_TOKEN=')) {
        envContent = envContent.replace(/REFRESH_TOKEN=.*/g, `REFRESH_TOKEN=${refreshToken}`);
        fs.writeFileSync(envPath, envContent, 'utf-8');
        console.log('✅  .env file updated automatically with the new REFRESH_TOKEN!');
      } else {
        console.log('⚠️   REFRESH_TOKEN key not found in .env — please add it manually.');
      }
    }

  } catch (err) {
    console.error('\n❌  Error exchanging code for tokens:', err.message);
  } finally {
    rl.close();
  }
});
