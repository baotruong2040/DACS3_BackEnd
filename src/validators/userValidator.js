const { z } = require("zod");
const { ROLES } = require("../constants/roles");

const userIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const createStaffSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(72),
  full_name: z.string().min(1).max(100),
  email: z.string().email().max(100),
  phone: z.string().min(8).max(15),
  address: z.string().max(500).optional().nullable(),
  role: z.enum([ROLES.CUSTOMER, ROLES.STAFF, ROLES.ADMIN]).optional(),
});

const updateUserSchema = z
  .object({
    full_name: z.string().min(1).max(100).optional(),
    email: z.string().email().max(100).optional(),
    phone: z.string().min(8).max(15).optional(),
    address: z.string().max(500).optional().nullable(),
    role: z.enum([ROLES.CUSTOMER, ROLES.STAFF, ROLES.ADMIN]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

const updateMeSchema = z
  .object({
    full_name: z.string().min(1).max(100).optional(),
    email: z.string().email().max(100).optional(),
    phone: z.string().min(8).max(15).optional(),
    address: z.string().max(500).optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

const fcmTokenSchema = z.object({
  fcm_token: z.string().min(1),
});

module.exports = {
  userIdParamSchema,
  createStaffSchema,
  updateUserSchema,
  updateMeSchema,
  fcmTokenSchema,
};
