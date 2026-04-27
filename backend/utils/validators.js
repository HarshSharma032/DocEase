const { z } = require('zod');

const registerUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(['Patient', 'Admin']).optional()
});

const registerDoctorSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  specialization: z.string().min(2),
  experience: z.number().int().positive(),
  feesPerCunsultation: z.number().positive(),
  about: z.string().optional(),
  clinicAddress: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required")
});

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (err) {
    res.status(400);
    next(new Error(err.errors[0].message));
  }
};

module.exports = {
  registerUserSchema,
  registerDoctorSchema,
  loginSchema,
  validate
};
