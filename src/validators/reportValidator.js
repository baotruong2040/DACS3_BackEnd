const { z } = require("zod");

const revenueReportQuerySchema = z.object({
  period: z.enum(["daily", "weekly", "monthly"]),
  from: z.iso.date(),
  to: z.iso.date(),
});

const topProductsQuerySchema = z.object({
  from: z.iso.date(),
  to: z.iso.date(),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
});

module.exports = {
  revenueReportQuerySchema,
  topProductsQuerySchema,
};
