const { z } = require("zod");

const booleanFromString = z.preprocess((value) => {
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") {
      return true;
    }

    if (value.toLowerCase() === "false") {
      return false;
    }
  }

  return value;
}, z.boolean());

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
  is_available: booleanFromString.optional(),
});

const updateProductSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(2000).optional().nullable(),
    price: z.coerce.number().positive().optional(),
    image_url: z.string().url().max(255).optional().nullable(),
    category_id: z.coerce.number().int().positive().optional(),
    is_available: booleanFromString.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

const listCategoryProductsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  page_size: z.coerce.number().int().positive().max(100).optional().default(20),
});

const searchProductsQuerySchema = z.object({
  q: z.string().max(255).optional().default(""),
  category_ids: z
    .string()
    .optional()
    .default("")
    .transform((val) => {
      if (!val) return [];
      return val
        .split(",")
        .map((id) => parseInt(id, 10))
        .filter((id) => !Number.isNaN(id) && id > 0);
    }),
  sort_by: z.enum(["id", "name", "price"]).optional().default("id"),
  sort_order: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.coerce.number().int().positive().optional().default(1),
  page_size: z.coerce.number().int().positive().max(100).optional().default(20),
});

module.exports = {
  idParamSchema,
  createCategorySchema,
  createProductSchema,
  updateProductSchema,
  listCategoryProductsQuerySchema,
  searchProductsQuerySchema,
};
