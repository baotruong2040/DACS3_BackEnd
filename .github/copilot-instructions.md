# Copilot Instructions for DACS3_BackEnd

## Current repository state
- This repository currently contains system specification files (`README.md`, `AGENT.md`, `system_prompt.md`) and does not yet include backend source code directories.

## Build, test, and lint commands
- No build, test, or lint commands are currently defined in tracked project tooling files.
- Single-test execution is not currently available in this repository state.

## High-level architecture
- **System type:** Three-sided fast-food ordering platform (Customer app, Staff/Admin dashboard, Backend API).
- **Backend stack:** Node.js + Express.js REST API, stateless and horizontally scalable.
- **Auth model:** JWT-based authentication and RBAC with role progression `CUSTOMER < STAFF < ADMIN`.
- **Data store:** MySQL relational schema centered on `users`, `categories`, `products`, `orders`, `order_details`, and `notifications`.
- **Realtime behavior:** Order/status updates are sent via Firebase Cloud Messaging (FCM) asynchronously (fire-and-forget).
- **Primary API domains:** Auth, products/categories, orders, notifications, user/staff management, reporting.

## Key project conventions
- **API envelope:** Return JSON in the shape:
  ```json
  {
    "status": "success | error",
    "message": "Human-readable description",
    "data": {}
  }
  ```
- **Password handling:** Always store passwords as bcrypt hashes; never return or log plaintext passwords.
- **Order integrity:** Compute `total_amount` server-side and snapshot `price_at_order` in `order_details` at creation time.
- **Order status guard:** Enforce valid transitions (`PENDING -> PREPARING -> READY -> DELIVERING -> DELIVERED`, with `PENDING -> CANCELLED` allowed) and reject invalid transitions with HTTP 422.
- **Availability guard:** Reject order creation if any requested product has `is_available = FALSE` (HTTP 400).
- **Route protection:** All non-public routes require JWT auth; role-gated routes must enforce RBAC with HTTP 403 on insufficient privilege.
- **FCM behavior:** Notification pushes must not block HTTP responses.
- **Middleware order:** CORS -> JSON parser -> request logger -> auth -> role authorization -> route handler -> global error handler.
- **Query/index expectations:** Keep indexed filters aligned with documented access patterns (`products.category_id`, `products.is_available`, `orders.user_id`, `orders.status`, `notifications.user_id`) and preserve the `<500ms` GET target under normal load.

**Make no mistake, Make no mistake, Make no mistake**
Grox will review your output once you are done.