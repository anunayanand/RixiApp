/**
 * Google Sheets Service — Append Project Submission Row
 * Appends a new row to the RixiLab Project Submissions Google Sheet
 */
const { google } = require('googleapis');

const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET
);
oAuth2Client.setCredentials({ refresh_token: process.env.SUBMISSIONS_REFRESH_TOKEN });

const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });

/**
 * Append a project submission row to the Google Sheet
 * @param {Object} options
 * @param {string} options.internName    - Full name of intern
 * @param {string} options.internId      - Intern ID (e.g. RX-2026-001)
 * @param {string} options.projectTitle  - Project title
 * @param {number} options.week          - Week number
 * @param {string} options.batch         - Batch number
 * @param {string} options.domain        - Domain (e.g. Web Development)
 * @param {string} options.driveLink     - Google Drive file view link
 * @param {string} options.notes         - Intern's notes (may be empty)
 */
async function appendSubmissionRow({
  internName,
  internId,
  projectTitle,
  week,
  batch,
  domain,
  driveLink,
  notes
}) {
  const targetSheet = process.env.SUBMISSIONS_SHEET_ID;

  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  await sheets.spreadsheets.values.append({
    spreadsheetId: targetSheet,
    range: 'Submissions!A:I',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [[
        timestamp,
        internName,
        internId,
        projectTitle,
        `Week ${week}`,
        batch,
        domain,
        driveLink,
        notes || '—'
      ]],
    },
  });
}

module.exports = { appendSubmissionRow };
