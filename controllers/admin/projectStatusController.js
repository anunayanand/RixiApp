const User = require('../../models/User');
const Project = require('../../models/Project');
const { sendRejectionMail } = require('../../services/emails/rejectionMailService');
const asyncHandler = require('../../utils/asyncHandler');

exports.updateProjectStatus = asyncHandler(async (req, res) => {
  const { userId, projectId, status, reason } = req.body;
  const isAjax = req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1) || req.headers['content-type'] === 'application/json';

  // 🔹 Validation
  if (!userId || !projectId || !status) {
    req.flash('error', 'Missing required fields');
    const flashMessages = req.flash();

    if (isAjax) {
      return res.status(400).json({
        success: false,
        type: 'error',
        message: flashMessages.error?.[0] || 'Missing required fields'
      });
    }

    return res.redirect('/admin');
  }

  // 🔹 Update project status
  const updatedUser = await User.findOneAndUpdate(
    { _id: userId, 'projectAssigned.projectId': projectId },
    { $set: { 'projectAssigned.$.status': status } },
    { new: true }
  );

  if (updatedUser) {
    const assignedProjects = updatedUser.projectAssigned || [];
    const acceptedCount = assignedProjects.filter(p => p.status === 'accepted').length;
    
    let expectedTotalProjects = assignedProjects.length;
    if (updatedUser.duration === 4) {
      expectedTotalProjects = 4;
    } else if (updatedUser.duration === 6) {
      expectedTotalProjects = 5;
    } else if (updatedUser.duration === 8) {
      expectedTotalProjects = 6;
    }

    updatedUser.progress = expectedTotalProjects > 0 ? Math.min(100, Math.round((acceptedCount / expectedTotalProjects) * 100)) : 0;
    await updatedUser.save();

    if (status === 'rejected') {
      const project = await Project.findById(projectId);
      const projectTitle = project ? project.title : 'Project';
      // Send email in background
      sendRejectionMail(updatedUser.email, updatedUser.name, projectTitle, reason);
    }
  }

  if (!updatedUser) {
    req.flash('error', 'User or project not found');
    const flashMessages = req.flash();

    if (isAjax) {
      return res.status(404).json({
        success: false,
        type: 'error',
        message: flashMessages.error?.[0] || 'User or project not found'
      });
    }

    return res.redirect('/admin');
  }

  // 🔹 Success or failure message
  if (status === 'accepted') {
    req.flash('success', `${updatedUser.name} project accepted successfully!`);
  } else {
    req.flash('error', `${updatedUser.name} project ${status}`);
  }

  const flashMessages = req.flash();

  if (isAjax) {
    return res.json({
      success: true,
      type: status === 'accepted' ? 'success' : 'error',
      message:
        flashMessages.success?.[0] ||
        flashMessages.error?.[0] ||
        `${updatedUser.name} project ${status}`
    });
  }

  return res.redirect('/admin');
});
