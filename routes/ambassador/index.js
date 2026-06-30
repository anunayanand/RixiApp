const express = require('express');
const router = express.Router();

const ambassadorRoute = require('./ambassadorRoute');

// Mount routes mirroring app.js structure
router.use('/', ambassadorRoute);

module.exports = router;
