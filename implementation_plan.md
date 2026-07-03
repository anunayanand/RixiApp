# Enhance Folder Structure with Controllers

This plan outlines the strategy to extract business logic from the `routes/` directory into a newly created `controllers/` directory, addressing the highest priority technical debt in `FUTURE_IMPROVEMENTS.md`.

## User Review Required

> [!IMPORTANT]  
> This is a major architectural refactor. Moving all routes at once could be risky and lead to large, hard-to-review changes. We propose doing this iteratively, starting with a single module (e.g., `public` or `auth`) to establish the pattern, before rolling it out to the entire application.

## Open Questions

> [!WARNING]  
> 1. Which module would you like to start with? (I recommend starting with the `public` module as it's typically simpler).
> 2. Should we also implement the `asyncHandler` wrapper (Item #2 in `FUTURE_IMPROVEMENTS.md`) at the same time to eliminate repetitive `try/catch` blocks while we refactor?

## Proposed Changes

### 1. Replicate Folder Structure

Create parallel subdirectories inside `controllers/` to match the existing `routes/` structure:
- `controllers/public/`
- `controllers/auth/`
- `controllers/admin/`
- etc.

### 2. Extract Business Logic

For each route file, we will create a corresponding controller file. 
For example, for `routes/public/homeRoute.js`:

#### [NEW] controllers/public/homeController.js
```javascript
const SuperAdmin = require("../../models/SuperAdmin");
const Bootcamp = require("../../models/Bootcamp");

exports.getHomePage = async (req, res) => {
  try {
    const superAdminExists = await SuperAdmin.findOne({});
    if (!superAdminExists) return res.redirect("/register-superAdmin");

    const bootcamps = await Bootcamp.find({ status: 'live' })
      .sort({ creationDate: -1 })
      .lean();

    res.render("index", { bootcamps });
  } catch(err) {
    req.flash("error", "Server Error");
    res.redirect("/login");
  }
};
```

#### [MODIFY] routes/public/homeRoute.js
```javascript
const express = require('express');
const router = express.Router();
const homeController = require('../../controllers/public/homeController');

router.get("/", homeController.getHomePage);

module.exports = router;
```

### 3. Iterative Migration

Once the pattern is established and verified on the first module, we will proceed to migrate the remaining routing modules.

## Verification Plan

### Manual Verification
- Start the server and manually verify the refactored endpoints.
- Ensure that page renders, redirects, and error handling remain functionally identical.
