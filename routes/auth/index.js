const express = require("express");
const router = express.Router();

const authViewsRoute = require("./authViewsRoute");
const authActionRoute = require("./authActionRoute");
const changePasswordRoute = require('./changePasswordRoute');
const forgotPassword = require('./forgotPassword');
const sendotpRoute = require('./send-otpRoute');
const verifyResetRoute = require('./verifyResetRoute');
const qrLoginRoute = require('./qrLoginRoute');
const registerSuperAdminRoute = require('./registerSuperAdminRoute');
const registerAdminRoute = require('./registerAdminRoute');

router.use("/", authViewsRoute);
router.use("/", authActionRoute);

router.use('/', changePasswordRoute);
router.use('/', forgotPassword);
router.use('/', sendotpRoute);
router.use('/', verifyResetRoute);
router.use('/', qrLoginRoute);
router.use('/', registerSuperAdminRoute);
router.use('/', registerAdminRoute);

module.exports = router;
