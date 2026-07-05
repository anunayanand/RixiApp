const multer = require('multer');
const User = require('../../models/User');
const Project = require('../../models/Project');
const Admin = require('../../models/Admin');
const { notify } = require('../../services/notifications/notificationService');
const { uploadFileToDrive } = require('../../services/google/googleDriveService');
const { appendSubmissionRow } = require('../../services/google/googleSheetsService');
const asyncHandler = require('../../utils/asyncHandler');

// Use memory storage for multer (max 10MB, only zip and pdf)
exports.upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['application/zip', 'application/x-zip-compressed', 'application/pdf'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only .zip and .pdf files are allowed!'), false);
    }
  }
});

exports.submitProject = asyncHandler(async (req, res) => {
  const internId = req.session.user;
  const { projectId, notes } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ success: false, message: 'No file uploaded. Make sure it is a .zip or .pdf file.' });
  }

  // 1. Fetch Intern & Project details
  const intern = await User.findById(internId);
  if (!intern) return res.status(404).json({ success: false, message: 'Intern not found' });

  const project = await Project.findById(projectId);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

  // 2. Upload file to Google Drive (with nested folders)
  const { driveLink } = await uploadFileToDrive({
    buffer: file.buffer,
    originalname: file.originalname,
    mimetype: file.mimetype,
    internName: intern.name,
    internId: intern.intern_id,
    projectTitle: project.title,
    batch: intern.batch_no
  });

  // 3. Append to Google Sheet
  await appendSubmissionRow({
    internName: intern.name,
    internId: intern.intern_id,
    projectTitle: project.title,
    week: project.week,
    batch: intern.batch_no,
    domain: intern.domain,
    driveLink,
    notes
  });

  // 4. Update intern's project status to 'submitted'
  const projectIndex = intern.projectAssigned.findIndex(
    p => p.projectId.toString() === projectId
  );
  if (projectIndex !== -1) {
    intern.projectAssigned[projectIndex].status = 'submitted';
    intern.projectAssigned[projectIndex].driveLink = driveLink;
    await intern.save();
  }

  // 5. Notify admin
  const admin = await Admin.findOne({ domain: intern.domain });
  if (admin) {
    await notify({
      recipientId: admin._id,
      recipientModel: "Admin",
      title: "New Project Submission",
      message: `${intern.name} (${intern.intern_id}) has submitted project: ${project.title}.`,
      type: "project"
    });
  }

  res.json({ success: true, message: 'Project submitted successfully', driveLink });
});
