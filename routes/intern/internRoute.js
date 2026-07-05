const express = require('express');
const router = express.Router();
const authRole = require('../../middleware/authRole');
const internController = require('../../controllers/intern/internController');

router.get("/intern", authRole("intern"), internController.getInternDashboard);

router.post('/intern/lecture/:id/progress', authRole('intern'), internController.syncLectureProgress);

router.post('/intern/redeem', authRole('intern'), internController.redeemReward);

module.exports = router;
