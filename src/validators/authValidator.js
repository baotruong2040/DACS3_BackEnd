const { z } = require("zod");

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(72),
  full_name: z.string().min(1).max(100),
  email: z.string().email().max(100),
  phone: z.string().min(8).max(15),
  address: z.string().max(500).optional().nullable(),
});

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

module.exports = {
  registerSchema,
  loginSchema,
};
