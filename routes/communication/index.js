const express = require('express');
const router = express.Router();

const chatRoute = require('./chatRoute');
const notificationRoute = require('./notificationRoute');
const completionMailRoute = require('./completionMailRoute');
const confirmationMailRoute = require('./confirmationMailRoute');
const offerLetterMailRoute = require('./offerLetterMailRoute');

router.use("/chat", chatRoute);
router.use("/", notificationRoute);
router.use("/", completionMailRoute);
router.use("/", confirmationMailRoute);
router.use("/", offerLetterMailRoute);

module.exports = router;
