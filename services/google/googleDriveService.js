/**
 * Google Drive Service — Project File Upload
 * Uploads intern project files to the RixiLab Project Submissions Drive folder
 */
const { google } = require('googleapis');
const { Readable } = require('stream');

const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET
);
oAuth2Client.setCredentials({ refresh_token: process.env.SUBMISSIONS_REFRESH_TOKEN });

const drive = google.drive({ version: 'v3', auth: oAuth2Client });

/**
 * Helper to get an existing folder by name within a parent, or create it if not exists.
 */
async function getOrCreateFolder(folderName, parentFolderId) {
  const query = `name='${folderName.replace(/'/g, "\\'")}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  
  const res = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
    spaces: 'drive',
  });
  
  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id; // Return existing folder ID
  }
  
  // Create folder if it doesn't exist
  const folderRes = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId]
    },
    fields: 'id'
  });
  
  return folderRes.data.id;
}

/**
 * Upload a file buffer to Google Drive
 * @param {Object} options
 * @param {Buffer}  options.buffer        - File buffer from multer memoryStorage
 * @param {string}  options.originalname  - Original filename from intern's device
 * @param {string}  options.mimetype      - MIME type of the file
 * @param {string}  options.internName    - Intern's display name
 * @param {string}  options.internId      - Intern's ID (e.g. RX-2026-001)
 * @param {string}  options.projectTitle  - Project title
 * @param {string}  options.batch         - Intern's batch number
 * @returns {{ fileId: string, driveLink: string }}
 */
async function uploadFileToDrive({ buffer, originalname, mimetype, internName, internId, projectTitle, batch }) {
  const globalFolderId = process.env.SUBMISSIONS_DRIVE_FOLDER_ID;

  // 1. Get or create "Batch X" folder
  const batchFolderName = `Batch ${batch || 'Unknown'}`;
  const batchFolderId = await getOrCreateFolder(batchFolderName, globalFolderId);

  // 2. Get or create "Project Title" folder inside "Batch X"
  const projectFolderId = await getOrCreateFolder(projectTitle, batchFolderId);

  // Build a descriptive filename: Name (InternID).ext
  const fileExt = originalname.split('.').pop();
  const fileName = `${projectTitle} (${internName}).${fileExt}`;

  // Upload file as a stream from the buffer
  const fileStream = Readable.from(buffer);

  const uploadRes = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [projectFolderId],
    },
    media: {
      mimeType: mimetype,
      body: fileStream,
    },
    fields: 'id, name',
  });

  const fileId = uploadRes.data.id;

  // Make the file publicly readable (view-only, no download restriction)
  await drive.permissions.create({
    fileId,
    requestBody: { role: 'reader', type: 'anyone' },
  });

  // Construct shareable view link
  const driveLink = `https://drive.google.com/file/d/${fileId}/view`;

  return { fileId, driveLink };
}

module.exports = { uploadFileToDrive };
