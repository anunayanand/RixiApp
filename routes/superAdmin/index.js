const express = require('express');
const router = express.Router();

const superAdminRoute = require('./superAdminRoute');
const deleteUserRoute = require('./deleteUser');
const updateInternQuizRoute = require('./updateInternQuizRoute');
const payoutRoute = require('./payoutRoute');
const noticeRoute = require('./noticeRoute');
const deleteNoticeRoute = require('./deleteNoticeRoute');
const viewAdminRoute = require('./viewAdminRoute');
const migrateSuperAdminRoute = require('./migrateSuperAdminRoute');
const viewAmbassadorRoute = require('./viewAmbassadorRoute');
const createAdminRoute = require('./createAdminRoute');
const deleteAdminRoute = require('./deleteAdminRoute');
const createBootcampManagerRoute = require('./createBootcampManagerRoute');
const createAmbassedorRoute = require('./createAmbassedorRoute');
const deleteAmbassadorRoute = require('./deleteAmbassadorRoute');
const updateAmbassadorRoute = require('./updateAmbassadorRoute');

// Mount routes mirroring app.js structure
router.use('/superAdmin', superAdminRoute);
router.use('/superAdmin', payoutRoute);
router.use('/superAdmin', noticeRoute);
router.use('/superAdmin', deleteNoticeRoute);
router.use('/', viewAdminRoute); 
router.use('/', migrateSuperAdminRoute);
router.use('/', viewAmbassadorRoute); 
router.use('/', createAdminRoute);
router.use('/', deleteAdminRoute);
router.use('/', createBootcampManagerRoute);
router.use('/', createAmbassedorRoute);
router.use('/', deleteAmbassadorRoute);
router.use('/', updateAmbassadorRoute);

router.use('/', deleteUserRoute);
router.use('/', updateInternQuizRoute);

module.exports = router;
