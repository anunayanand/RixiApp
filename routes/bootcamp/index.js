const express = require('express');
const router = express.Router();

const bootcampManagerRoute = require('./bootcampManagerRoute');
const bootcampPortalRoute = require('./bootcampPortalRoute');

// Mount routes mirroring app.js structure
router.use('/bootcampManager', bootcampManagerRoute);
router.use('/bootcamp-portal', bootcampPortalRoute);

module.exports = router;
