require('dotenv').config();
const express = require("express");

// 1. Initialize Database & Configurations
require("./config/db");
require("./config/cloudinary");

// 2. Initialize Background Tasks
require("./jobs/bootcampCron");
require("./jobs/backgroundTasks");

const app = express();

// 3. Initialize Express Middleware (Sessions, Parsers, Views)
require("./middleware/appMiddleware")(app);

// 4. Mount Master Router
app.use('/', require('./routes/index'));

// 5. Initialize Error Handlers (404/500)
require("./middleware/errorHandlers")(app);

// 6. Start Server
app.listen(8080, () => console.log("Server running at http://localhost:8080"));
