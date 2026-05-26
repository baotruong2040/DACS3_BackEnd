# R&T Express Backend API Reference

## Overview

- **Base URL:** `http://localhost:3000/api` (development)
- **Authentication:** Bearer token in `Authorization` header: `Authorization: Bearer <JWT_TOKEN>`
- **Format:** JSON (except file uploads, which use `multipart/form-data`)
- **Database:** MySQL
- **Framework:** Express.js + Node.js

## Response Envelope

All responses use a standard envelope:

```json
{
  "status": "success | error",
  "message": "Human-readable description",
  "data": {}
}
```

**Example success (201 Created):**
```json
{
  "status": "success",
  "message": "Product created successfully",
  "data": { "product_id": 5 }
}
```

**Example error (400 Bad Request):**
```json
{
  "status": "error",
  "message": "Product name is required",
  "data": null
}
```

## Authentication

### POST `/api/auth/register`
- **Role:** Public
- **Description:** Create a new customer account
- **Body:**
  ```json
  {
    "username": "john_doe",
    "password": "password123",
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "0912345678",
    "address": "123 Nguyen Hue St, HCMC (optional)"
  }
  ```
- **Validation:**
  - `username`: required, unique, alphanumeric
  - `password`: required, minimum 8 characters, hashed with bcrypt
  - `email`: required, valid email format, unique
  - `phone`: required
  - `address`: optional, stored as-is
- **Success:** `201 Created`
  ```json
  {
    "status": "success",
    "message": "User registered successfully",
    "data": { "user_id": 1, "role": "CUSTOMER" }
  }
  ```
- **Errors:**
  - `400`: Missing/invalid fields
  - `409`: Username or email already exists
  - `500`: Server error

### POST `/api/auth/login`
- **Role:** Public
- **Description:** Authenticate and get JWT token
- **Body:**
  ```json
  {
    "username": "john_doe",
    "password": "password123"
  }
  ```
- **Success:** `200 OK`
  ```json
  {
    "status": "success",
    "message": "Login successful",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user_id": 1,
      "role": "CUSTOMER"
    }
  }
  ```
- **Token Usage:**
  ```bash
  curl -H "Authorization: Bearer <token>" http://localhost:3000/api/orders
  ```
- **Errors:**
  - `400`: Missing username or password
  - `401`: Invalid credentials
  - `500`: Server error

## Products & Categories

### GET `/api/products`
- **Role:** Public
- **Description:** List all available products with category info
- **Query Parameters:**
  - `category_id` (optional): Filter by category (integer)
  - `page` (optional): Page number for pagination (default: 1)
  - `page_size` (optional): Items per page (default: 10, max: 100)
- **Success:** `200 OK`
  ```json
  {
    "status": "success",
    "message": "Products retrieved successfully",
    "data": {
      "products": [
        {
          "id": 1,
          "name": "Phở Bò",
          "description": "Traditional beef pho",
          "price": 50000,
          "image_url": "https://api.example.com/uploads/products/1715794425000-123456789.jpg",
          "category_id": 1,
          "category_name": "Noodle Soups",
          "is_available": true,
          "created_at": "2024-05-15T10:00:00Z"
        }
      ],
      "pagination": {
        "page": 1,
        "page_size": 10,
        "total": 25
      }
    }
  }
  ```
- **Errors:** `400` (invalid parameters)

### GET `/api/products/:id`
- **Role:** Public
- **Description:** Get single product details
- **Params:** `id` (integer, required)
- **Success:** `200 OK`
  ```json
  {
    "status": "success",
    "message": "Product retrieved successfully",
    "data": {
      "id": 1,
      "name": "Phở Bò",
      "description": "Traditional beef pho",
      "price": 50000,
      "image_url": "https://api.example.com/uploads/products/1715794425000-123456789.jpg",
      "category_id": 1,
      "category_name": "Noodle Soups",
      "is_available": true,
      "created_at": "2024-05-15T10:00:00Z"
    }
  }
  ```
- **Errors:** `404` (product not found)

### GET `/api/products/search`
- **Role:** Public
- **Description:** Search and filter available products with pagination and sorting
- **Query Parameters:**
  - `q` (optional): Text search in product name and description (max 255 chars)
  - `category_ids` (optional): Filter by categories (comma-separated IDs, e.g., `1,2,3`)
  - `sort_by` (optional): Sort field - `id`, `name`, or `price` (default: `id`)
  - `sort_order` (optional): Sort direction - `asc` or `desc` (default: `desc`)
  - `page` (optional): Page number (default: `1`)
  - `page_size` (optional): Items per page (default: `20`, max: `100`)
- **Examples:**
  - `GET /api/products/search?q=pho` — search products with "pho" in name/description
  - `GET /api/products/search?category_ids=1,2&sort_by=price&sort_order=asc` — products in categories 1,2 sorted by price ascending
  - `GET /api/products/search?q=beef&category_ids=1&page=2&page_size=10` — paginated search results
- **Success:** `200 OK`
  ```json
  {
    "status": "success",
    "message": "Products search results fetched successfully",
    "data": {
      "products": [
        {
          "id": 1,
          "name": "Phở Bò",
          "description": "Traditional beef pho",
          "price": 50000,
          "image_url": "https://api.example.com/uploads/products/1715794425000-123456789.jpg",
          "is_available": true,
          "category_id": 1,
          "category_name": "Noodle Soups"
        }
      ],
      "page": 1,
      "page_size": 20,
      "total": 5
    }
  }
  ```
- **Errors:**
  - `400`: Invalid query parameters (invalid page, page_size > 100, invalid sort_by, etc.)

### POST `/api/products`
- **Role:** `ADMIN`
- **Description:** Create new product (with optional image upload)
- **Content-Type:** `multipart/form-data` OR `application/json`
- **Body (JSON):**
  ```json
  {
    "name": "Phở Bò",
    "price": 50000,
    "category_id": 1,
    "description": "Traditional beef pho (optional)",
    "image_url": "https://external-cdn.com/image.jpg (optional, ignored if file uploaded)",
    "is_available": true
  }
  ```
- **Body (multipart/form-data):**
  ```
  name: Phở Bò
  price: 50000
  category_id: 1
  description: Traditional beef pho
  is_available: true
  image: [binary file]  (JPEG, PNG, WebP, GIF, AVIF; max 5MB)
  ```
- **Image Upload Logic:**
  - If `image` file is provided: auto-rename to `{timestamp}-{random}.{ext}`, save to `/uploads/products/`, generate public HTTPS URL
  - If no file but `image_url` provided: use `image_url` directly
  - File takes precedence over `image_url`
- **Validation:**
  - `name`: required, non-empty string
  - `price`: required, positive number
  - `category_id`: required, must exist in database
  - Image file (if provided): max 5MB, only image MIME types
- **Success:** `201 Created`
  ```json
  {
    "status": "success",
    "message": "Product created successfully",
    "data": { "product_id": 5 }
  }
  ```
- **Errors:**
  - `400`: Missing required fields, invalid data, file too large, unsupported image type
  - `401`: Missing/invalid JWT token
  - `403`: User is not ADMIN
  - `404`: Category not found
  - `500`: Server error

### PUT `/api/products/:id`
- **Role:** `ADMIN`
- **Description:** Update product (with optional image re-upload)
- **Params:** `id` (integer, required)
- **Content-Type:** `multipart/form-data` OR `application/json`
- **Body:** At least one of:
  - `name`: new product name
  - `description`: new description
  - `price`: new price (must be positive)
  - `image_url`: new external image URL (ignored if file uploaded)
  - `category_id`: new category (must exist)
  - `is_available`: true/false
  - `image`: [binary file] (same validation as POST)
- **Success:** `200 OK`
  ```json
  {
    "status": "success",
    "message": "Product updated successfully",
    "data": { "product_id": 5 }
  }
  ```
- **Errors:**
  - `400`: No fields to update, invalid data, category not found
  - `401`: Missing/invalid JWT
  - `403`: User is not ADMIN
  - `404`: Product not found

### GET `/api/categories`
- **Role:** Public
- **Description:** List all categories
- **Success:** `200 OK`
  ```json
  {
    "status": "success",
    "message": "Categories retrieved successfully",
    "data": {
      "categories": [
        {
          "id": 1,
          "name": "Noodle Soups",
          "description": "Traditional Vietnamese pho and other noodle soups",
          "image_url": "https://api.example.com/uploads/categories/1715794425000-987654321.jpg",
          "created_at": "2024-05-15T09:00:00Z"
        }
      ]
    }
  }
  ```

### GET `/api/categories/:id/products`
- **Role:** Public
- **Description:** List available products in a specific category (paginated)
- **Params:** `id` (integer, required)
- **Query Parameters:**
  - `page` (optional): Page number (default: `1`)
  - `page_size` (optional): Items per page (default: `20`, max: `100`)
- **Success:** `200 OK`
  ```json
  {
    "status": "success",
    "message": "Category products fetched successfully",
    "data": {
      "products": [
        {
          "id": 1,
          "name": "Phở Bò",
          "description": "Traditional beef pho",
          "price": 50000,
          "image_url": "https://api.example.com/uploads/products/1715794425000-123456789.jpg",
          "is_available": true,
          "category_id": 1,
          "category_name": "Noodle Soups"
        }
      ],
      "page": 1,
      "page_size": 20,
      "total": 12
    }
  }
  ```
- **Errors:**
  - `400`: Invalid `id`, `page`, or `page_size`
  - `404`: Category not found

### POST `/api/categories`
- **Role:** `ADMIN`
- **Description:** Create new category (with optional image upload)
- **Content-Type:** `multipart/form-data` OR `application/json`
- **Body (JSON):**
  ```json
  {
    "name": "Noodle Soups",
    "description": "Traditional Vietnamese pho and other noodle soups (optional)",
    "image_url": "https://external-cdn.com/category.jpg (optional)"
  }
  ```
- **Body (multipart/form-data):**
  ```
  name: Noodle Soups
  description: Traditional Vietnamese pho and other noodle soups
  image: [binary file]
  ```
- **Image Rules:** Same as product image upload
- **Success:** `201 Created`
  ```json
  {
    "status": "success",
    "message": "Category created successfully",
    "data": { "category_id": 3 }
  }
  ```
- **Errors:**
  - `400`: Missing name, invalid image
  - `401`: Missing/invalid JWT
  - `403`: User is not ADMIN

## Orders

### POST `/api/orders`
- **Role:** `CUSTOMER` (requires valid JWT token)
- **Description:** Create a new order (customer's own order; staff/admin can override)
- **Body:**
  ```json
  {
    "delivery_address": "123 Nguyen Hue St, HCMC",
    "items": [
      { "product_id": 1, "quantity": 2 },
      { "product_id": 3, "quantity": 1 }
    ]
  }
  ```
- **Validation:**
  - `delivery_address`: required, non-empty string
  - `items`: required, array with at least 1 item
  - Each item must have `product_id` (exists in DB) and `quantity` (positive integer)
- **Server-Side Business Logic:**
  - ✅ Verifies all products exist and are available (rejects if any unavailable)
  - ✅ Calculates `total_amount` = sum of (price × quantity) for all items
  - ✅ Snapshots each item's `price_at_order` at creation time (immutable for history)
  - ✅ Creates `orders` + `order_details` in a single transaction (all-or-nothing)
  - ✅ Sends FCM push notification to staff (fire-and-forget)
- **Success:** `201 Created`
  ```json
  {
    "status": "success",
    "message": "Order created successfully",
    "data": {
      "order_id": 42,
      "total_amount": 150000,
      "status": "PENDING",
      "delivery_address": "123 Nguyen Hue St, HCMC",
      "created_at": "2024-05-15T14:30:00Z"
    }
  }
  ```
- **Errors:**
  - `400`: Missing fields, invalid product ID, product unavailable, empty items
  - `401`: Missing/invalid JWT
  - `403`: User is not CUSTOMER (staff/admin cannot create orders for others)
  - `404`: Product not found
  - `500`: Database error (partial rollback)

### GET `/api/orders?status=all&page=1&page_size=50`
- **Role:** `STAFF` or `ADMIN`
- **Description:** List all orders (staff/admin only)
- **Query Parameters:**
  - `status` (optional): Filter by status (PENDING, PREPARING, READY, DELIVERING, DELIVERED, CANCELLED)
  - `page` (optional): Page number (default: 1)
  - `page_size` (optional): Items per page (default: 10, max: 100)
- **Success:** `200 OK`
  ```json
  {
    "status": "success",
    "message": "Orders retrieved successfully",
    "data": {
      "orders": [
        {
          "id": 42,
          "user_id": 1,
          "delivery_address": "123 Nguyen Hue St, HCMC",
          "total_amount": 150000,
          "status": "PREPARING",
          "created_at": "2024-05-15T14:30:00Z",
          "item_count": 3
        }
      ],
      "pagination": {
        "page": 1,
        "page_size": 10,
        "total": 25
      }
    }
  }
  ```
- **Errors:**
  - `400`: Invalid status or pagination
  - `401`: Missing/invalid JWT
  - `403`: User is not STAFF or ADMIN

### GET `/api/users/:id/orders`
- **Role:** Authenticated
- **Description:** List orders for a specific user by user id
- **Params:** `id` (integer, required)
- **Query Parameters:**
  - `status` (optional): Filter by status (PENDING, PREPARING, READY, DELIVERING, DELIVERED, CANCELLED)
  - `page` (optional): Page number (default: 1)
  - `page_size` (optional): Items per page (default: 10, max: 50)
- **Success:** `200 OK`
  ```json
  {
    "status": "success",
    "message": "Orders fetched successfully",
    "data": {
      "items": [
        {
          "id": 11,
          "user_id": 2,
          "total_amount": 250000,
          "status": "PREPARING",
          "delivery_address": "45 Le Loi St",
          "created_at": "2024-05-15T14:30:00Z",
          "updated_at": "2024-05-15T14:30:00Z"
        }
      ],
      "page": 1,
      "page_size": 10,
      "total": 1
    }
  }
  ```
- **Errors:**
  - `400`: Invalid status or pagination
  - `401`: Missing/invalid JWT
  - `404`: User not found

### GET `/api/orders/:id`
- **Role:** Authenticated
- **Description:** Get order details with items
  - **CUSTOMER:** Can only view their own order
  - **STAFF/ADMIN:** Can view any order
- **Params:** `id` (integer, required)
- **Success:** `200 OK`
  ```json
  {
    "status": "success",
    "message": "Order retrieved successfully",
    "data": {
      "id": 42,
      "user_id": 1,
      "user_name": "Jane Doe",
      "delivery_address": "123 Nguyen Hue St, HCMC",
      "total_amount": 150000,
      "status": "PREPARING",
      "created_at": "2024-05-15T14:30:00Z",
      "items": [
        {
          "product_id": 1,
          "product_name": "Phở Bò",
          "quantity": 2,
          "price_at_order": 50000,
          "subtotal": 100000
        },
        {
          "product_id": 3,
          "product_name": "Cơm Tấm",
          "quantity": 1,
          "price_at_order": 50000,
          "subtotal": 50000
        }
      ]
    }
  }
  ```
- **Errors:**
  - `401`: Missing/invalid JWT
  - `403`: Customer trying to access another user's order
  - `404`: Order not found

### PUT `/api/orders/:id/status`
- **Role:** `STAFF` or `ADMIN`
- **Description:** Update order status (enforces valid state transitions)
- **Params:** `id` (integer, required)
- **Body:**
  ```json
  {
    "status": "PREPARING"
  }
  ```
- **Valid Status Transitions:**
  ```
  PENDING     → PREPARING, CANCELLED
  PREPARING   → READY
  READY       → DELIVERING
  DELIVERING  → DELIVERED
  DELIVERED   → (terminal, no further changes)
  CANCELLED   → (terminal, no further changes)
  ```
- **Example Workflow:**
  1. Order created → `PENDING`
  2. Staff presses "Start" → `PREPARING`
  3. Kitchen finishes → `READY`
  4. Driver picks up → `DELIVERING`
  5. Delivered → `DELIVERED`
- **Success:** `200 OK`
  ```json
  {
    "status": "success",
    "message": "Order status updated successfully",
    "data": {
      "order_id": 42,
      "new_status": "PREPARING",
      "updated_at": "2024-05-15T14:35:00Z"
    }
  }
  ```
- **Errors:**
  - `400`: Invalid status value
  - `401`: Missing/invalid JWT
  - `403`: User is not STAFF or ADMIN
  - `404`: Order not found
  - `422`: Invalid state transition (e.g., trying to go READY → PENDING)

## Notifications

### GET `/api/notifications`
- **Role:** Authenticated (any user)
- **Description:** Get current user's notifications
- **Query Parameters:**
  - `page` (optional): Page number (default: 1)
  - `page_size` (optional): Items per page (default: 10, max: 50)
  - `unread_only` (optional): Filter only unread (true/false)
- **Success:** `200 OK`
  ```json
  {
    "status": "success",
    "message": "Notifications retrieved successfully",
    "data": {
      "notifications": [
        {
          "id": 1,
          "user_id": 1,
          "title": "Order Accepted",
          "message": "Your order #42 has been accepted by the restaurant",
          "is_read": false,
          "order_id": 42,
          "created_at": "2024-05-15T14:35:00Z"
        }
      ],
      "pagination": {
        "page": 1,
        "page_size": 10,
        "total": 5,
        "unread_count": 2
      }
    }
  }
  ```
- **Errors:** `401` (missing/invalid JWT)

### PUT `/api/notifications/:id/read`
- **Role:** Authenticated (own notification only)
- **Description:** Mark a notification as read
- **Params:** `id` (integer, required)
- **Body:** (empty or omitted)
- **Success:** `200 OK`
  ```json
  {
    "status": "success",
    "message": "Notification marked as read",
    "data": {
      "notification_id": 1,
      "is_read": true
    }
  }
  ```
- **Errors:**
  - `401`: Missing/invalid JWT
  - `404`: Notification not found

## Users (Admin)

### GET `/api/users`
- **Role:** `ADMIN`
- **Description:** List all staff accounts (no customers here; use staff filter)
- **Query Parameters:**
  - `role` (optional): Filter by role (STAFF, ADMIN)
  - `page` (optional): Page number (default: 1)
  - `page_size` (optional): Items per page (default: 10, max: 50)
- **Success:** `200 OK`
  ```json
  {
    "status": "success",
    "message": "Users retrieved successfully",
    "data": {
      "users": [
        {
          "id": 2,
          "username": "staff_member",
          "full_name": "Jane Smith",
          "email": "jane@example.com",
          "phone": "0987654321",
          "role": "STAFF",
          "created_at": "2024-05-10T10:00:00Z"
        }
      ],
      "pagination": {
        "page": 1,
        "page_size": 10,
        "total": 5
      }
    }
  }
  ```
- **Errors:**
  - `401`: Missing/invalid JWT
  - `403`: User is not ADMIN

### POST `/api/users/staff`
- **Role:** `ADMIN`
- **Description:** Create a new staff member account
- **Body:**
  ```json
  {
    "username": "new_staff",
    "password": "password123",
    "full_name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "0987654321",
    "address": "456 Tran Hung Dao St, HCMC (optional)"
  }
  ```
- **Validation:**
  - `username`: required, unique, alphanumeric
  - `password`: required, min 8 characters, bcrypt hashed
  - `email`: required, unique, valid format
  - `phone`: required
  - Default role: `STAFF` (cannot be changed via this endpoint)
- **Success:** `201 Created`
  ```json
  {
    "status": "success",
    "message": "Staff created successfully",
    "data": { "user_id": 3 }
  }
  ```
- **Errors:**
  - `400`: Missing fields or invalid data
  - `401`: Missing/invalid JWT
  - `403`: User is not ADMIN
  - `409`: Username or email already exists

### PUT `/api/users/:id`
- **Role:** `ADMIN`
- **Description:** Update user information
- **Params:** `id` (integer, required)
- **Body:** At least one of:
  - `full_name`: new full name
  - `email`: new email (must be unique)
  - `phone`: new phone
  - `address`: new address
  - `role`: STAFF or ADMIN (role change)
- **Success:** `200 OK`
  ```json
  {
    "status": "success",
    "message": "User updated successfully",
    "data": { "user_id": 3 }
  }
  ```
- **Errors:**
  - `400`: No fields to update, email already exists
  - `401`: Missing/invalid JWT
  - `403`: User is not ADMIN
  - `404`: User not found

## Reporting (Admin)

### GET `/api/reports/revenue`
- **Role:** `ADMIN`
- **Description:** Revenue analytics grouped by time period
- **Query Parameters:**
  - `period` (required): daily | weekly | monthly
  - `from` (required): Start date (YYYY-MM-DD format)
  - `to` (required): End date (YYYY-MM-DD format)
- **Example:** `GET /api/reports/revenue?period=daily&from=2024-05-01&to=2024-05-31`
- **Success:** `200 OK`
  ```json
  {
    "status": "success",
    "message": "Revenue report generated",
    "data": {
      "period": "daily",
      "from": "2024-05-01",
      "to": "2024-05-31",
      "buckets": [
        {
          "date": "2024-05-15",
          "total_revenue": 3500000,
          "order_count": 25,
          "avg_order_value": 140000
        },
        {
          "date": "2024-05-16",
          "total_revenue": 4200000,
          "order_count": 30,
          "avg_order_value": 140000
        }
      ],
      "summary": {
        "total_revenue": 125000000,
        "total_orders": 890,
        "avg_revenue": 3500000
      }
    }
  }
  ```
- **Errors:**
  - `400`: Invalid date format or period
  - `401`: Missing/invalid JWT
  - `403`: User is not ADMIN

### GET `/api/reports/top-products`
- **Role:** `ADMIN`
- **Description:** Best-selling products in a date range
- **Query Parameters:**
  - `from` (required): Start date (YYYY-MM-DD format)
  - `to` (required): End date (YYYY-MM-DD format)
  - `limit` (optional): Max results (default: 10, max: 100)
- **Example:** `GET /api/reports/top-products?from=2024-05-01&to=2024-05-31&limit=5`
- **Success:** `200 OK`
  ```json
  {
    "status": "success",
    "message": "Top products report generated",
    "data": {
      "from": "2024-05-01",
      "to": "2024-05-31",
      "products": [
        {
          "product_id": 1,
          "product_name": "Phở Bò",
          "total_quantity_sold": 245,
          "total_revenue": 12250000,
          "avg_price": 50000
        },
        {
          "product_id": 3,
          "product_name": "Cơm Tấm",
          "total_quantity_sold": 180,
          "total_revenue": 9000000,
          "avg_price": 50000
        }
      ]
    }
  }
  ```
- **Errors:**
  - `400`: Invalid date format
  - `401`: Missing/invalid JWT
  - `403`: User is not ADMIN

## Error Codes Summary

| Code | Meaning | Common Causes |
|------|---------|---------------|
| `400` | Bad Request | Missing/invalid fields, invalid data type, validation failure |
| `401` | Unauthorized | Missing JWT token, expired token, invalid signature |
| `403` | Forbidden | Insufficient role/permission (e.g., customer accessing admin endpoint) |
| `404` | Not Found | Resource doesn't exist (product, order, user, etc.) |
| `409` | Conflict | Duplicate username/email |
| `422` | Unprocessable Entity | Invalid state transition (e.g., order status change) |
| `500` | Server Error | Unexpected database/server error |

## Rate Limiting & Throttling

Currently no rate limiting is enforced. Future versions may add:
- Per-user request limits
- Spike protection on file uploads
- Database query timeouts

## File Upload Guidelines

**Supported Image Formats:** JPEG, PNG, WebP, GIF, AVIF
**Max File Size:** 5 MB
**Storage:** `/uploads/products/` or `/uploads/categories/`
**URL Format:** `https://api.example.com/uploads/{subfolder}/{timestamp}-{random}.{ext}`

**Example cURL for product with image:**
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "name=Phở Bò" \
  -F "price=50000" \
  -F "category_id=1" \
  -F "description=Traditional beef pho" \
  -F "image=@/path/to/photo.jpg"
```

## Environment Variables

Set these in `.env` file:
- `PUBLIC_BASE_URL`: Base URL for image serving (e.g., `https://api.example.com`)
- `PORT`: Server port (default: 3000)
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`: MySQL connection
- `JWT_SECRET`: Secret for signing JWT tokens
- `FIREBASE_API_KEY`, etc.: Firebase configuration for push notifications
