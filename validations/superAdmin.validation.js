const { z } = require("zod");

exports.createAdminSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    emp_id: z.string().min(1, "Employee ID is required"),
    phone: z.string().min(10, "Phone must be at least 10 characters").optional(),
    domain: z.string().min(1, "Domain is required"),
  })
});

exports.createAmbassadorSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    phone: z.string().min(10, "Phone is required"),
    ambassador_id: z.string().min(1, "Ambassador ID is required"),
    referralId: z.string().min(1, "Referral ID is required"),
    college: z.string().optional(),
    university: z.string().optional(),
    designation: z.string().optional(),
    address: z.string().optional(),
    gender: z.string().optional(),
    linkedin_profile_url: z.string().url().optional().or(z.literal("")),
    insta_profile_url: z.string().url().optional().or(z.literal("")),
    discountPercent: z.string().optional().or(z.number().optional()),
    equity: z.string().optional().or(z.number().optional()),
  })
});

exports.updateAmbassadorSchema = z.object({
  body: z.object({
    ambassador_id: z.string().optional(),
    name: z.string().optional(),
    email: z.string().email("Invalid email format").optional(),
    phone: z.string().optional(),
    college: z.string().optional(),
    university: z.string().optional(),
    designation: z.string().optional(),
    offer_letter_link: z.string().url().optional().or(z.literal("")),
    certificate_link: z.string().url().optional().or(z.literal("")),
    password: z.string().optional(),
    mail_sent: z.string().optional(),
    discountPercent: z.string().optional().or(z.number().optional()),
  })
});

exports.createBootcampManagerSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  })
});

exports.updateInternQuizSchema = z.object({
  body: z.object({
    isPassed: z.string().optional(),
    quiz_score: z.string().optional().or(z.number().optional()),
    attemptCount: z.string().optional().or(z.number().optional()),
    assignmentScore: z.string().optional().or(z.number().optional()),
    certificate_id: z.string().optional(),
    certificate_link: z.string().url().optional().or(z.literal("")),
    starting_date: z.string().optional(),
    completion_date: z.string().optional(),
  })
});
