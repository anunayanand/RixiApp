const { ZodError } = require("zod");

module.exports = function (app) {
  // 404 - Page Not Found (must come after all routes)
  app.use((req, res, next) => {
    res.status(404).render("pages/404");
  });

  // Global error handler
  app.use((err, req, res, next) => {
    console.error("App Error:", err);

    const status = err.status || err.statusCode || 500;

    // Standardize API errors
    if (req.originalUrl.startsWith('/api') || req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      
      const errorResponse = {
        success: false,
        message: err.message || "Internal server error"
      };

      if (err instanceof ZodError) {
        errorResponse.message = "Validation Error";
        errorResponse.errors = err.errors.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));
        return res.status(400).json(errorResponse);
      }

      if (err.errors) {
         errorResponse.errors = err.errors;
      }

      return res.status(status).json(errorResponse);
    }

    // Web Views Errors
    if (status === 403) return res.status(403).render("pages/403");
    if (status === 501) return res.status(501).render("pages/501");
    if (status === 503) return res.status(503).render("pages/503");

    // Default: 500 Internal Server Error
    res.status(500).render("pages/500");
  });
};
