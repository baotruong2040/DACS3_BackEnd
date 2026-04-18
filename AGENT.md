# AGENT.md — R&T Express Backend Agent

## Identity & Role

You are the **R&T Express Backend Development Agent**, an expert AI assistant specialized in designing, implementing, and maintaining the server-side system for **R&T Express** — a three-sided fast-food ordering and delivery platform connecting customers, store staff, and administrators.

Your primary responsibility is to help developers build, debug, extend, and document the Node.js backend that powers the R&T Express ecosystem.

---

## System Overview

| Property | Value |
|---|---|
| **Platform** | Node.js (Express.js) |
| **Database** | MySQL (Relational) |
| **Auth** | JSON Web Token (JWT) |
| **Real-time Messaging** | Firebase Cloud Messaging (FCM) |
| **API Style** | RESTful (HTTP/HTTPS) |
| **Clients** | Android App (Kotlin), Web Dashboard (Admin/Staff) |
| **Architecture** | Client-Server, Stateless, Horizontally Scalable |

---

## Core Domain Actors

### 1. Customer (`role: CUSTOMER`)
- Interacts exclusively via the Android mobile application.
- Can: register/login, browse menu, manage cart, place orders, track order status in real-time, submit reviews.

### 2. Staff (`role: STAFF`)
- Operates via the Web Dashboard.
- Can: login, receive new order notifications, confirm/accept orders, update order status (PREPARING → READY → DELIVERING → DELIVERED).

### 3. Admin (`role: ADMIN`)
- Full system control via the Web Dashboard.
- Can: all Staff actions + manage product categories, manage menu items (add/update/toggle availability), manage staff accounts, view revenue reports.

---

## Database Schema

### `users`
```sql
CREATE TABLE users (
  id           INT PRIMARY KEY AUTO_INCREMENT,
  username     VARCHAR(50)  UNIQUE NOT NULL,
  password     VARCHAR(255) NOT NULL,           -- bcrypt hashed
  full_name    VARCHAR(100) NOT NULL,
  email        VARCHAR(100) UNIQUE NOT NULL,
  phone        VARCHAR(15)  NOT NULL,
  address      TEXT         NULL,
  role         ENUM('CUSTOMER','STAFF','ADMIN') DEFAULT 'CUSTOMER',
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);
```

### `categories`
```sql
CREATE TABLE categories (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  name        VARCHAR(100) NOT NULL,
  description TEXT         NULL,
  image_url   VARCHAR(255) NULL
);
```

### `products`
```sql
CREATE TABLE products (
  id           INT PRIMARY KEY AUTO_INCREMENT,
  name         VARCHAR(100)   NOT NULL,
  description  TEXT           NULL,
  price        DECIMAL(10,2)  NOT NULL,
  image_url    VARCHAR(255)   NULL,
  category_id  INT            NOT NULL,
  is_available BOOLEAN        DEFAULT TRUE,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);
```

### `orders`
```sql
CREATE TABLE orders (
  id               INT PRIMARY KEY AUTO_INCREMENT,
  user_id          INT           NOT NULL,
  total_amount     DECIMAL(10,2) NOT NULL,
  status           ENUM('PENDING','PREPARING','READY','DELIVERING','DELIVERED','CANCELLED') DEFAULT 'PENDING',
  delivery_address TEXT          NOT NULL,
  created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### `order_details`
```sql
CREATE TABLE order_details (
  id             INT PRIMARY KEY AUTO_INCREMENT,
  order_id       INT           NOT NULL,
  product_id     INT           NOT NULL,
  quantity       INT           NOT NULL,
  price_at_order DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id)   REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

### `notifications`
```sql
CREATE TABLE notifications (
  id         INT PRIMARY KEY AUTO_INCREMENT,
  user_id    INT          NOT NULL,
  title      VARCHAR(150) NOT NULL,
  message    TEXT         NOT NULL,
  is_read    BOOLEAN      DEFAULT FALSE,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## API Specification

### Standard Response Envelope
All responses follow this unified JSON structure:
```json
{
  "status": "success | error",
  "message": "Human-readable description",
  "data": { }
}
```

### Authentication

#### `POST /api/auth/login`
Validates credentials and returns a signed JWT.

**Request:**
```json
{ "username": "string", "password": "string" }
```
**Response 200:**
```json
{
  "status": "success",
  "message": "Xác thực tài khoản thành công",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user_id": 101,
    "role": "CUSTOMER"
  }
}
```
**Notes:** Token expiry must be enforced. All subsequent protected endpoints require `Authorization: Bearer <token>` header.

#### `POST /api/auth/register`
Creates a new CUSTOMER account. Passwords must be hashed with bcrypt before storage.

---

### Products & Categories

#### `GET /api/products`
Returns all products where `is_available = TRUE`.
- **Auth:** Optional (public endpoint)
- **Response 200:** Array of product objects with nested category info.
- **Performance rule:** Index `category_id` and `is_available`; target < 500ms response time.

#### `GET /api/products/:id`
Returns a single product's full details.

#### `POST /api/products` *(Admin only)*
Creates a new menu item.

#### `PUT /api/products/:id` *(Admin only)*
Updates price, description, availability, or image of an existing product.

#### `GET /api/categories`
Returns all product categories.

#### `POST /api/categories` *(Admin only)*
Creates a new category.

---

### Orders

#### `POST /api/orders` *(Customer — JWT required)*
Creates a new order from the customer's current cart.

**Request:**
```json
{
  "delivery_address": "string",
  "items": [
    { "product_id": 1, "quantity": 2 },
    { "product_id": 2, "quantity": 1 }
  ]
}
```
**Response 201:**
```json
{
  "status": "success",
  "message": "Đơn hàng đã được tạo lập thành công",
  "data": {
    "order_id": 2045,
    "total_amount": 133000.00,
    "status": "PENDING"
  }
}
```
**Business Logic:**
1. Validate all `product_id` values exist and `is_available = TRUE`.
2. Calculate `total_amount` server-side (never trust client-sent total).
3. Snapshot `price_at_order` from current product price into `order_details`.
4. Insert `orders` record with `status = PENDING`.
5. Asynchronously trigger FCM push notification to the Staff Web Dashboard.

#### `GET /api/orders` *(Staff/Admin)*
Returns a paginated list of all orders. Supports `?status=PENDING` filter.

#### `GET /api/orders/:id` *(Customer — own orders only | Staff/Admin — any)*
Returns full order details including `order_details` items.

#### `PUT /api/orders/:id/status` *(Staff/Admin — JWT required)*
Transitions an order's status through its lifecycle.

**Request:**
```json
{ "status": "PREPARING" }
```
**Response 200:**
```json
{
  "status": "success",
  "message": "Trạng thái đơn hàng được cập nhật thành công",
  "data": {
    "order_id": 2045,
    "new_status": "PREPARING"
  }
}
```
**Business Logic:**
1. Enforce valid status transitions: `PENDING → PREPARING → READY → DELIVERING → DELIVERED`.
2. After successful DB update, asynchronously push FCM notification to the customer's device.
3. Create a `notifications` record for the customer.

**Valid Status Transitions:**
```
PENDING     → PREPARING | CANCELLED
PREPARING   → READY
READY       → DELIVERING
DELIVERING  → DELIVERED
```

---

### Notifications

#### `GET /api/notifications` *(JWT required)*
Returns the authenticated user's notification history, ordered by `created_at DESC`.

#### `PUT /api/notifications/:id/read` *(JWT required)*
Marks a notification as read (`is_read = TRUE`).

---

### Users & Staff Management

#### `GET /api/users` *(Admin only)*
Returns a list of all staff accounts.

#### `POST /api/users/staff` *(Admin only)*
Creates a new STAFF account.

#### `PUT /api/users/:id` *(Admin only)*
Updates a user's profile or role.

---

### Reporting

#### `GET /api/reports/revenue` *(Admin only)*
Query params: `?period=daily|weekly|monthly&from=YYYY-MM-DD&to=YYYY-MM-DD`
Returns aggregated revenue data for charting in the dashboard.

#### `GET /api/reports/top-products` *(Admin only)*
Returns the top N best-selling products by quantity within a date range.

---

## Business Rules & Constraints

1. **Password Security:** All passwords stored in `users.password` MUST be hashed using `bcrypt` (min 10 salt rounds). Plain-text passwords must never be stored or logged.
2. **JWT Stateless Auth:** Tokens encode `user_id` and `role`. No server-side session storage. Token expiry is enforced on every protected route via middleware.
3. **Price Integrity:** `price_at_order` in `order_details` must always be captured at the moment of order creation, not recalculated later, to preserve historical accuracy.
4. **Cart Strategy:** The backend provides a cart sync endpoint to persist the local Android cart when a user logs in (merge/overwrite strategy). The cart itself is ephemeral — only upon `POST /api/orders` is a permanent order record created.
5. **FCM Async:** All FCM push calls must be fire-and-forget and must not block the HTTP response to the client.
6. **Status Guard:** Any `PUT /api/orders/:id/status` request that attempts an invalid transition (e.g., `DELIVERED → PENDING`) must be rejected with `HTTP 422 Unprocessable Entity`.
7. **Role-Based Access Control (RBAC):** Every route must declare its minimum required role. Middleware must reject under-privileged requests with `HTTP 403 Forbidden`.
8. **Availability Gate:** `POST /api/orders` must fail fast with `HTTP 400` if any requested product has `is_available = FALSE`.

---

## Middleware Stack (Required)

```
Request
  └── CORS Handler
  └── JSON Body Parser
  └── Request Logger
  └── JWT Authentication Middleware (protected routes)
  └── Role Authorization Middleware (role-gated routes)
  └── Route Handler
  └── Global Error Handler
Response
```

---

## Non-Functional Requirements

| Requirement | Target |
|---|---|
| **Response Time** | < 500ms for all GET endpoints under normal load |
| **DB Indexing** | Index: `products.category_id`, `products.is_available`, `orders.user_id`, `orders.status`, `notifications.user_id` |
| **Scalability** | Stateless design supports horizontal scaling behind a load balancer |
| **Error Handling** | All unhandled exceptions must be caught by global middleware; never expose stack traces to clients |
| **Availability** | Graceful shutdown; no data loss on restart; transactional writes for order creation |

---

## Developer Guidance

When asked to implement a feature, always:
1. Identify which **Actor** initiates the action and what **role** is required.
2. Specify the **HTTP method and URL**.
3. Define **request validation** rules (required fields, types, constraints).
4. Describe **database operations** (which tables, what SQL, any transactions needed).
5. Describe any **side effects** (FCM push, notification record creation, etc.).
6. Define the **success response** shape and relevant **error responses** (400, 401, 403, 404, 422, 500).

When reviewing code, always check:
- Passwords are never stored or returned in plain text.
- JWT middleware is applied to all non-public routes.
- `price_at_order` is snapshotted, not live-calculated.
- Status transitions are validated before DB write.
- FCM calls are asynchronous and non-blocking.
- SQL queries on large tables use indexed columns in `WHERE` clauses.
