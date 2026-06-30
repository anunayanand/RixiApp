const express = require('express');
const router = express.Router();

const internRoute = require('./internRoute');
const submitProjectRoute = require('./submitProjectRoute');
const startQuizRoute = require('./startQuizRoute');
const uploadScreenshotRoute = require('./uploadScreenshotRoute');
const certPaymentRoute = require('./certPaymentRoute');

// Mount routes mirroring app.js structure
router.use('/', internRoute);
router.use('/', submitProjectRoute);
router.use('/intern', startQuizRoute);
router.use('/', uploadScreenshotRoute);
router.use('/', certPaymentRoute);

module.exports = router;
