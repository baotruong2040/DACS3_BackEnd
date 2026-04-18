# R&T Express Backend API Reference

All responses use the envelope:

```json
{
  "status": "success | error",
  "message": "Human-readable description",
  "data": {}
}
```

## Authentication

### POST `/api/auth/register`
- **Role:** Public
- **Body:**
  ```json
  {
    "username": "string",
    "password": "string >= 8 chars",
    "full_name": "string",
    "email": "valid email",
    "phone": "string",
    "address": "string | null (optional)"
  }
  ```
- **Success:** `201`, returns `user_id`, `role`
- **Errors:** `400`, `409`, `500`

### POST `/api/auth/login`
- **Role:** Public
- **Body:**
  ```json
  { "username": "string", "password": "string" }
  ```
- **Success:** `200`, returns `token`, `user_id`, `role`
- **Errors:** `400`, `401`, `500`

## Products & Categories

### GET `/api/products`
- **Role:** Public
- **Success:** `200`, available products with category info

### GET `/api/products/:id`
- **Role:** Public
- **Params:** `id` (integer)
- **Success:** `200`, single product
- **Errors:** `404`

### POST `/api/products`
- **Role:** `ADMIN`
- **Body:** `name`, `price`, `category_id`, optional `description`, `image_url`, `is_available`
- **Success:** `201`, returns `product_id`
- **Errors:** `400`, `401`, `403`, `404`

### PUT `/api/products/:id`
- **Role:** `ADMIN`
- **Params:** `id` (integer)
- **Body:** at least one updatable field (`name`, `description`, `price`, `image_url`, `category_id`, `is_available`)
- **Success:** `200`, returns `product_id`
- **Errors:** `400`, `401`, `403`, `404`

### GET `/api/categories`
- **Role:** Public
- **Success:** `200`, list of categories

### POST `/api/categories`
- **Role:** `ADMIN`
- **Body:** `name`, optional `description`, `image_url`
- **Success:** `201`, returns `category_id`
- **Errors:** `400`, `401`, `403`

## Orders

### POST `/api/orders`
- **Role:** `CUSTOMER`
- **Body:**
  ```json
  {
    "delivery_address": "string",
    "items": [{ "product_id": 1, "quantity": 2 }]
  }
  ```
- **Business guarantees:**
  - Rejects unavailable products (`400`)
  - Calculates `total_amount` server-side
  - Snapshots `price_at_order`
  - Uses transaction for `orders` + `order_details`
- **Success:** `201`, returns `order_id`, `total_amount`, `status`
- **Errors:** `400`, `401`, `403`, `404`, `500`

### GET `/api/orders`
- **Role:** `STAFF` or `ADMIN`
- **Query:** optional `status`, `page`, `page_size`
- **Success:** `200`, paginated order list
- **Errors:** `400`, `401`, `403`

### GET `/api/orders/:id`
- **Role:** Authenticated (`CUSTOMER` own order only, `STAFF/ADMIN` any)
- **Params:** `id` (integer)
- **Success:** `200`, order with `items`
- **Errors:** `401`, `403`, `404`

### PUT `/api/orders/:id/status`
- **Role:** `STAFF` or `ADMIN`
- **Params:** `id` (integer)
- **Body:** `{ "status": "PREPARING|READY|DELIVERING|DELIVERED|CANCELLED" }`
- **Valid transitions:**
  - `PENDING -> PREPARING | CANCELLED`
  - `PREPARING -> READY`
  - `READY -> DELIVERING`
  - `DELIVERING -> DELIVERED`
- **Success:** `200`, returns `order_id`, `new_status`
- **Errors:** `400`, `401`, `403`, `404`, `422`

## Notifications

### GET `/api/notifications`
- **Role:** Authenticated
- **Success:** `200`, current user's notifications
- **Errors:** `401`

### PUT `/api/notifications/:id/read`
- **Role:** Authenticated
- **Params:** `id` (integer)
- **Success:** `200`, returns `notification_id`, `is_read`
- **Errors:** `401`, `404`

## Users (Admin)

### GET `/api/users`
- **Role:** `ADMIN`
- **Success:** `200`, staff accounts list
- **Errors:** `401`, `403`

### POST `/api/users/staff`
- **Role:** `ADMIN`
- **Body:** `username`, `password`, `full_name`, `email`, `phone`, optional `address`
- **Success:** `201`, returns new staff `user_id`
- **Errors:** `400`, `401`, `403`, `409`

### PUT `/api/users/:id`
- **Role:** `ADMIN`
- **Params:** `id` (integer)
- **Body:** at least one of `full_name`, `email`, `phone`, `address`, `role`
- **Success:** `200`, returns `user_id`
- **Errors:** `400`, `401`, `403`, `404`

## Reporting (Admin)

### GET `/api/reports/revenue`
- **Role:** `ADMIN`
- **Query:** `period=daily|weekly|monthly`, `from=YYYY-MM-DD`, `to=YYYY-MM-DD`
- **Success:** `200`, grouped revenue buckets
- **Errors:** `400`, `401`, `403`

### GET `/api/reports/top-products`
- **Role:** `ADMIN`
- **Query:** `from=YYYY-MM-DD`, `to=YYYY-MM-DD`, optional `limit` (default 10)
- **Success:** `200`, top products by quantity and revenue
- **Errors:** `400`, `401`, `403`
