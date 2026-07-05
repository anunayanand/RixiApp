const { z } = require("zod");

// Standard User Registration Validation
exports.registerUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(50),
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    phone: z.string().min(10, "Phone must be at least 10 characters").optional(),
    college: z.string().optional(),
    university: z.string().optional(),
  })
});

// Standard Login Validation
exports.loginUserSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  })
});
