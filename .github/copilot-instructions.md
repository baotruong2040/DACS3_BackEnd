# Copilot instructions for DACS3_BackEnd

## Build, test, and run
- Install deps: `npm install`
- Dev server: `npm run dev`
- Production start: `npm start`
- Lint: `npm run lint`
- Full test suite: `npm test`
- Single test file: `npm run test:single -- tests/orderStatus.test.js`
- DB migration: `npm run db:migrate`
- Seed initial admin: `npm run db:seed-admin`

## High-level architecture
- Express.js + MySQL backend for R&T Express.
- `src/app.js` wires middleware and routes; `src/server.js` boots the app, initializes Firebase, pings the DB, and handles graceful shutdown.
- The request flow is layered: `routes` -> `middleware` -> `controllers` -> `services` / `db` -> `utils`.
- Public API routes are mounted under `/api`; the health endpoint lives at `/health`.
- Validation uses Zod schemas in `src/validators`, and request parsing is enforced before controllers run.

## Key conventions
- Responses use the standard envelope:
  ```json
  {
    "status": "success | error",
    "message": "Human-readable description",
    "data": {}
  }
  ```
- Use `successResponse` / `errorResponse` from `src/utils/response.js`.
- Use `AppError` for expected failures and `asyncHandler` for async controllers.
- JWT auth is Bearer-only; RBAC is rank-based via `ROLES` and `hasMinimumRole` with `CUSTOMER < STAFF < ADMIN`.
- Non-public routes require auth; role-gated routes should return HTTP 403 when the role is too low.
- Keep SQL parameterized and use `withTransaction` for multi-write operations.
- Passwords must be bcrypt-hashed; never return plaintext passwords.
- Orders are server-authoritative: calculate `total_amount` on the server, snapshot `price_at_order`, and reject unavailable products.
- Order status transitions are constrained by `src/constants/orderStatus.js`; invalid transitions return HTTP 422.
- `PENDING -> PREPARING | CANCELLED`, `PREPARING -> READY`, `READY -> DELIVERING`, `DELIVERING -> DELIVERED`.
- Order creation writes `orders` and `order_details` in a transaction, then notifies staff and triggers FCM push fire-and-forget.
- Customers can only access their own orders; staff/admin can access broader order data.
- Keep filters aligned with the indexed schema fields in `src/db/migrations/001_init.sql` (`products.category_id`, `products.is_available`, `orders.user_id`, `orders.status`, `notifications.user_id`).
- Product/category image uploads use `multipart/form-data` with an `image` file field; files are served from `/uploads/...` and should use `PUBLIC_BASE_URL` for absolute HTTPS URLs in production.

## Reference files
- `README.md` for setup and script names.
- `docs/API_REFERENCE.md` for endpoint and payload summaries.