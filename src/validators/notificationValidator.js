const { z } = require("zod");

const notificationIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

module.exports = {
  notificationIdParamSchema,
};
