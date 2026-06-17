const { z } = require("zod");

const addFavoriteSchema = z.object({
  product_id: z.coerce.number().int().positive(),
});

const productIdParamSchema = z.object({
  product_id: z.coerce.number().int().positive(),
});

module.exports = {
  addFavoriteSchema,
  productIdParamSchema,
};
