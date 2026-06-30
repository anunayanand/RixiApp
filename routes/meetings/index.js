const express = require('express');
const router = express.Router();

const allotMeetingsRoute = require('./allotMeetingsRoute');
const updateAttendanceRoute = require('./updateAttendanceRoute');

// Mount as use so internal router logic handles method/path
router.use('/', allotMeetingsRoute);
router.use('/', updateAttendanceRoute);

module.exports = router;
