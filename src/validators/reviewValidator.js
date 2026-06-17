const { z } = require("zod");

const createReviewSchema = z.object({
  product_id: z.coerce.number().int().positive(),
  order_id: z.coerce.number().int().positive(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(2000).optional().nullable(),
});

const productIdParamSchema = z.object({
  product_id: z.coerce.number().int().positive(),
});

const listReviewsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  page_size: z.coerce.number().int().positive().max(100).optional().default(20),
});

module.exports = {
  createReviewSchema,
  productIdParamSchema,
  listReviewsQuerySchema,
};
