const { env } = require("../config/env");
const { executeQuery } = require("../db/query");
const { closePool } = require("../db/pool");
const { ROLES } = require("../constants/roles");
const { hashPassword } = require("../services/authService");

async function run() {
  const existing = await executeQuery(
    `
      SELECT id
      FROM users
      WHERE username = ? OR email = ?
      LIMIT 1
    `,
    [env.ADMIN_USERNAME, env.ADMIN_EMAIL]
  );

  if (existing.length > 0) {
    console.log("Admin user already exists, skipping seed.");
    return;
  }

  const passwordHash = await hashPassword(env.ADMIN_PASSWORD);
  await executeQuery(
    `
      INSERT INTO users (username, password, full_name, email, phone, address, role)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      env.ADMIN_USERNAME,
      passwordHash,
      env.ADMIN_FULL_NAME,
      env.ADMIN_EMAIL,
      env.ADMIN_PHONE,
      env.ADMIN_ADDRESS,
      ROLES.ADMIN,
    ]
  );

  console.log("Admin user seeded successfully.");
}

run()
  .catch((error) => {
    console.error("Admin seeding failed:", error.message);
    process.exit(1);
  })
  .finally(async () => {
    await closePool();
  });
