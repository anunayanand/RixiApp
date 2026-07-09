const { ZodError } = require("zod");
const ApiResponse = require("../utils/ApiResponse");

const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      // Parse req.body, req.query, and req.params against the schema
      const validData = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Optionally, attach the validated data back to the request
      if (validData.body !== undefined) req.body = validData.body;
      if (validData.query !== undefined) req.query = validData.query;
      if (validData.params !== undefined) req.params = validData.params;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors nicely
        const errorMessages = error.errors.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));

        return res.status(400).json({
          success: false,
          message: "Validation Error",
          errors: errorMessages,
        });
      }
      next(error);
    }
  };
};

module.exports = validateRequest;
