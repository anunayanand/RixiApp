const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const publicRoutes = require('./public');
const adminRoutes = require('./admin');
const superAdminRoutes = require('./superAdmin');
const internRoutes = require('./intern');
const bootcampRoutes = require('./bootcamp');
const ambassadorRoutes = require('./ambassador');
const communicationRoutes = require('./communication');
const meetingsRoutes = require('./meetings');
const commonRoutes = require('./common');

router.use('/', authRoutes);
router.use('/', publicRoutes);
router.use('/', adminRoutes);
router.use('/', superAdminRoutes);
router.use('/', internRoutes);
router.use('/', bootcampRoutes);
router.use('/', ambassadorRoutes);
router.use('/', communicationRoutes);
router.use('/', meetingsRoutes);
router.use('/', commonRoutes);

module.exports = router;
