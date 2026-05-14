# DACS3_BackEnd

R&T Express backend server built with Express.js + MySQL.

## Setup

1. Copy `.env.example` to `.env` and update values.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run DB migration:
   ```bash
   npm run db:migrate
   ```
4. Seed first admin account:
   ```bash
   npm run db:seed-admin
   ```
5. Start server:
   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev` — run in development mode
- `npm start` — run in production mode
- `npm run lint` — lint source code
- `npm test` — run full test suite
- `npm run test:single -- tests/orderStatus.test.js` — run one test file
- `npm run db:migrate` — apply SQL migration
- `npm run db:seed-admin` — seed initial admin account

## API docs

See `docs/API_REFERENCE.md`.

## Image uploads

- Product and category endpoints accept an optional file field named `image` via `multipart/form-data`.
- Uploaded files are served from `/uploads/...`.
- Set `PUBLIC_BASE_URL` in production so returned image URLs are absolute HTTPS URLs.
