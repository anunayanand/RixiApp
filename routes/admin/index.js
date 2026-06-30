const express = require('express');
const router = express.Router();

const adminRoute = require('./adminRoute');
const updateUserRoute = require('./updateUserRoute');
const quizRoute = require('./quizRoute');
const lectureRoute = require('./lectureRoute');
const toggleUpdateButton = require('./toggleUpdateButton');
const createInternRoute = require('./createInternRoute');
const uploadProjectRoute = require('./uploadProjectRoute');
const updateProjectRoute = require('./updateProjectRoute');
const deleteProjectRouter = require('./deleteProjectRouter');
const viewInternRoute = require('./viewInternRoute');
const projectStatusRoute = require('./projectStatusRoute');

// Match the mount points from app.js
router.use('/admin', adminRoute);
router.use('/', createInternRoute);
router.use('/', uploadProjectRoute);
router.use('/', updateProjectRoute);
router.use('/', deleteProjectRouter);
router.use('/', viewInternRoute);
router.use('/admin', projectStatusRoute);

router.use('/', updateUserRoute);

router.use('/quiz', quizRoute);
router.use('/', lectureRoute);

router.use('/', toggleUpdateButton);

module.exports = router;
