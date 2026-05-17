# Repository Guidelines

## Project Structure & Module Organization

This is a CommonJS Node.js backend for R&T Express built with Express and MySQL. Application code lives in `src/`: `app.js` wires middleware and routes, `server.js` starts HTTP, `routes/` defines API entry points, `controllers/` handles requests, `services/` contains business integrations, `db/` manages MySQL access, and `validators/` contains Zod schemas. Shared helpers are in `utils/`, constants in `constants/`, and middleware in `middleware/`. Tests are in `tests/**/*.test.js`. API docs are in `docs/API_REFERENCE.md`, migrations in `src/db/migrations/`, and uploaded runtime files in `uploads/`.

## Build, Test, and Development Commands

- `npm install`: install dependencies from `package-lock.json`.
- `npm run dev`: start the local server with `nodemon src/server.js`.
- `npm start`: start the server with Node for production-like execution.
- `npm run lint`: run ESLint across the repository.
- `npm test`: run the full Jest suite serially.
- `npm run test:single -- tests/orderStatus.test.js`: run one test file.
- `npm run db:migrate`: apply SQL migrations.
- `npm run db:seed-admin`: create the initial admin account.

Copy `.env.example` to `.env` before running server or database scripts.

## Coding Style & Naming Conventions

Use CommonJS modules (`require`, `module.exports`) and plain JavaScript. Follow existing naming: plural folders such as `controllers`, `routes`, and `validators`; descriptive camelCase filenames such as `authController.js`. Keep route handlers thin by moving reusable logic to services, validators, middleware, or utilities. ESLint uses `@eslint/js` recommended rules, allows `console`, and treats unused variables as errors unless prefixed with `_`.

## Testing Guidelines

Jest runs in Node and discovers `tests/**/*.test.js`. Add or update tests for route behavior, authorization, validation, image serving, and status transitions when touching those areas. Keep test names behavior-focused, for example `authRbac.test.js` or `categoryProductsEndpoint.test.js`. Coverage targets `src/**/*.js` except `src/server.js`.

## Commit & Pull Request Guidelines

Recent commits use short, imperative summaries such as `upload image feature`. Prefer concise subjects that describe the change; avoid vague messages like `change some files`. Pull requests should include a brief description, issue links, database or environment changes, and commands run, especially `npm run lint` and `npm test`. Include API examples only when response shapes or upload behavior changes.

## Security & Configuration Tips

Do not commit `.env`, credentials, uploaded user files, or Firebase service account data. Keep production `PUBLIC_BASE_URL` set so uploaded image URLs are absolute HTTPS URLs. Review new endpoints for authentication, authorization, Zod validation, and consistent error responses.
