module.exports = function (app) {
  // 404 - Page Not Found (must come after all routes)
  app.use((req, res, next) => {
    res.status(404).render("pages/404");
  });

  // Global error handler
  app.use((err, req, res, next) => {
    console.error("App Error:", err);

    const status = err.status || err.statusCode || 500;

    if (status === 403) return res.status(403).render("pages/403");
    if (status === 501) return res.status(501).render("pages/501");
    if (status === 503) return res.status(503).render("pages/503");

    // Default: 500 Internal Server Error
    res.status(500).render("pages/500");
  });
};
