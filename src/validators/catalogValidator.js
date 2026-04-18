const { z } = require("zod");

const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional().nullable(),
  image_url: z.string().url().max(255).optional().nullable(),
});

const createProductSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(2000).optional().nullable(),
  price: z.coerce.number().positive(),
  image_url: z.string().url().max(255).optional().nullable(),
  category_id: z.coerce.number().int().positive(),
  is_available: z.boolean().optional(),
});

const updateProductSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(2000).optional().nullable(),
    price: z.coerce.number().positive().optional(),
    image_url: z.string().url().max(255).optional().nullable(),
    category_id: z.coerce.number().int().positive().optional(),
    is_available: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

module.exports = {
  idParamSchema,
  createCategorySchema,
  createProductSchema,
  updateProductSchema,
};
