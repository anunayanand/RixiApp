const express = require("express");
const axios = require('axios');
const url = "https://rixilab.tech";

const interval = 60000;

function reloadWebsite() {
  axios
    .get(url)
    .then((response) => {
      // console.log("website reloded");
    })
    .catch((error) => {
      console.error(`Error : ${error.message}`);
    });
}

setInterval(reloadWebsite,interval);


const session = require("express-session");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
require('dotenv').config();
const flash = require('connect-flash');
require("./db"); // Mongoose connection
const User = require("./models/User");

const cloudinary = require("cloudinary").v2;


const app = express();
app.use(express.json());
app.use(express.static("public"));
app.use(express.json({ limit: '15mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/bootstrap", express.static(path.join(__dirname, "node_modules/bootstrap/dist")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(session({
  secret: process.env.SESSION_SECRET || "xjdshjsgbhbusguhiusgughiuhaiuhahah",
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 80 * 60 * 1000 // 80 minutes in milliseconds
  }
}));
app.use(flash());
// Make flash messages available in all templates
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.info = req.flash("info");
  next();
});

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// Role-based middleware
const authRole = require('./middleware/authRole');

// --- Routes ---

const homeRoute = require('./routes/homeRoute');

// Register first superAdmin
app.get("/register-superAdmin", (req, res) => res.render("register"));

const registerSuperAdminRouter = require('./routes/registerSuperAdminRoute');
app.use('/', registerSuperAdminRouter); // now POST /register-superAdmin works




// Register first admin
app.get("/register-admin", (req, res) => res.render("register"));
app.post("/register-admin", async (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const admin = new User({ name, email, password: hashedPassword, role: "admin" });
  await admin.save();
  req.session.user = admin._id;
  req.session.role = "admin";
  res.redirect("/admin");
});

// Login page
app.get("/login", (req, res) => {
  // Generate a random 5-letter code
  const randomText = Math.random().toString(36).substring(2, 7).toUpperCase();
  req.session.captcha = randomText; // store in session

  res.render("login", { captchaText: randomText });
});

app.get("/reset-password", (req, res) => {
  res.render("resetPassword");
});

app.get("/generate-captcha", (req, res) => {
  const newCaptcha = Math.random().toString(36).substring(2, 7).toUpperCase();
  req.session.captcha = newCaptcha; // update session
  res.json({ captcha: newCaptcha });
});

app.get("/admin-login", (req, res) => { 
  res.render("orgLogin");
});
app.get('/terms-and-conditions', (req, res) => {
  res.render('termsAndConditions');
});

const orgLoginRouter = require('./routes/orgLoginRoute');
app.post('/org/login', orgLoginRouter);

const loginRouter = require('./routes/loginRoute');
app.post('/login', loginRouter);

// Logout
const logoutRouter = require('./routes/logoutRoute');

// serve index
app.get("/", homeRoute);

// mount logout router
app.use("/", logoutRouter);   // ✅ attaches /logout route

const verifyCertificateRouter = require('./routes/verifyCertificateRouter');
app.get("/certificate", (req, res) => res.render("certificate"));
app.post('/verify-certificate', verifyCertificateRouter);

const downloadCertificateRoute = require('./routes/downloadCertificateRoute');
app.use('/', downloadCertificateRoute);

const downloadOfferLetterRoute = require('./routes/downloadOfferLetterRoute');
app.use('/', downloadOfferLetterRoute);

app.get("/internship", (req, res) => {
  res.render("internship");
});

const internshipRouter = require('./routes/internshipRoute');
app.use('/internship', internshipRouter);

app.get('/cap',(req,res) => res.render('cap'));
// --- Admin Routes ---

const adminRoute = require('./routes/adminRoute');
app.use('/admin', adminRoute);

// Superadmin dashboard

const superAdminRoute = require('./routes/superAdminRoute');
app.use('/superAdmin', superAdminRoute);

// Create Interns
const createInternRouter = require('./routes/createInternRoute');
app.post('/create-user', createInternRouter);

// Create Admin
const createAdminRouter = require('./routes/createAdminRoute');
app.post('/create-admin', createAdminRouter);

// Upload Project
const uploadProjectRouter = require('./routes/uploadProjectRoute');
app.post('/admin/projects', uploadProjectRouter); 

// Update Project
const updateProjectRouter = require('./routes/updateProjectRoute');
app.post('/admin/project/update/:id', updateProjectRouter);

// Delete Project
const deleteProjectRouter = require('./routes/deleteProjectRouter');
app.post('/delete-project/:id', deleteProjectRouter);

// View specific intern (admin only)
const viewInternRouter = require('./routes/viewInternRoute');
app.get('/admin/intern/:internId', viewInternRouter);

// Approve/Reject Submission
const projectStatusRouter = require('./routes/projectStatusRoute');
app.use('/admin', projectStatusRouter);
  
app.use("/", require("./routes/notificationRoute"));

// Email placeholders
const confirmationMailRouter = require('./routes/confirmationMailRoute');
const completionMailRouter = require('./routes/completionMailRoute');
const offerLetterMailRouter = require('./routes/offerLetterMailRoute');

app.use('/', confirmationMailRouter);
app.use('/', completionMailRouter);
app.use('/', offerLetterMailRouter);

// --- Update/Delete Intern ---

const deleteUserRouter = require('./routes/deleteUser');
app.post('/delete-user/:id', deleteUserRouter);

// Update user (post form)
const updateUserRouter = require('./routes/updateUserRoute');
app.post('/update-user/:id', updateUserRouter);


// Notice Route
const noticeRoute = require('./routes/noticeRoute');
app.use('/superAdmin', noticeRoute);

const deleteNoticeRoute = require('./routes/deleteNoticeRoute');
app.use('/superAdmin', deleteNoticeRoute);

// Ambassador Routes 

const ambassadorRoute = require('./routes/ambassadorRoute');
app.get('/ambassador',ambassadorRoute);
// Create Ambassador
const createAmbassdorRoute = require('./routes/createAmbassedorRoute');
app.post('/create-ambassador', createAmbassdorRoute);

// Update Ambassador

const updateAmbassadorRoute = require('./routes/updateAmbassadorRoute');
app.post('/update-ambassador/:id',updateAmbassadorRoute);

// Delete Ambassador 
const deleteAmbassadorRoute = require('./routes/deleteAmbassadorRoute');
app.post('/delete-ambassador/:id',deleteAmbassadorRoute);

// View Ambassador
const viewAmbassadorRoute = require('./routes/viewAmbassadorRoute');
app.get('/superAdmin/ambassador/:ambassadorId',viewAmbassadorRoute);
// --- Intern Routes ---

const internRouter = require('./routes/internRoute');
app.get('/intern', internRouter);

const viewAdminRouter = require('./routes/viewAdminRoute');
app.get('/superAdmin/admin/:adminId', viewAdminRouter);

// Meeting

const meetings = require('./routes/allotMeetingsRoute');
app.post('/allot-meetings',meetings);
app.post('/update-meeting/:meetingId',meetings);
app.post('/delete-meeting/:meetingId',meetings);

// Attendence

const updateAttendence = require('./routes/updateAttendanceRoute');
app.post('/meetings/update-attendance',updateAttendence)

//Password Change
const updatePasswordRoute = require('./routes/changePasswordRoute');
app.post('/intern/change-password',updatePasswordRoute);
app.post('/ambassador/change-password',updatePasswordRoute);

// Update Image Route
const updateImageRoute = require('./routes/updateImageRoute');
app.post('/update-image',updateImageRoute);
app.post('/ambassador/update-image',updateImageRoute);

// forgott password 
const forgotPasswordRouter = require('./routes/forgotPassword');
app.use('/', forgotPasswordRouter);

// Reset Password
const sendOtpRouter = require('./routes/send-otpRoute');
app.use('/', sendOtpRouter);

const verifyResetRouter = require('./routes/verifyResetRoute');
app.use('/', verifyResetRouter);


// Assign and create Quiz
const quizRoutes = require("./routes/quizRoute");
app.use("/quiz", quizRoutes);

// Get and Submit Quiz
const startQuizRoutes = require("./routes/startQuizRoute");
app.use("/intern", startQuizRoutes);

// Screenshot of the Intern
const uploadScreenshotRoute = require("./routes/uploadScreenshotRoute");
app.use("/", uploadScreenshotRoute);

// Desktop Mode change prevent route
const blockedMobileRouter = require('./routes/mobileBlockedRoute');
app.use('/',blockedMobileRouter);

const toggleUpdateButton = require('./routes/toggleUpdateButton');
app.post('/project/toggle-visibility/:id',toggleUpdateButton);

const updateInternQuizRouter = require('./routes/updateInternQuizRoute');
app.use('/', updateInternQuizRouter);
app.listen(3000, () => console.log("Server running at http://localhost:3000"));
