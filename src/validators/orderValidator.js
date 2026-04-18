const { z } = require("zod");
const { ORDER_STATUS } = require("../constants/orderStatus");

const orderIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const createOrderSchema = z.object({
  delivery_address: z.string().min(5).max(1000),
  items: z
    .array(
      z.object({
        product_id: z.coerce.number().int().positive(),
        quantity: z.coerce.number().int().min(1),
      })
    )
    .min(1),
});

const listOrdersQuerySchema = z.object({
  status: z
    .enum([
      ORDER_STATUS.PENDING,
      ORDER_STATUS.PREPARING,
      ORDER_STATUS.READY,
      ORDER_STATUS.DELIVERING,
      ORDER_STATUS.DELIVERED,
      ORDER_STATUS.CANCELLED,
    ])
    .optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  page_size: z.coerce.number().int().positive().max(100).optional().default(20),
});

const updateOrderStatusSchema = z.object({
  status: z.enum([
    ORDER_STATUS.PREPARING,
    ORDER_STATUS.READY,
    ORDER_STATUS.DELIVERING,
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.CANCELLED,
  ]),
});

module.exports = {
  orderIdParamSchema,
  createOrderSchema,
  listOrdersQuerySchema,
  updateOrderStatusSchema,
};
