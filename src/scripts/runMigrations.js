const fs = require("node:fs/promises");
const path = require("node:path");
const mysql = require("mysql2/promise");
const { env } = require("../config/env");

async function run() {
  const migrationPath = path.join(__dirname, "..", "db", "migrations", "001_init.sql");
  const sql = await fs.readFile(migrationPath, "utf8");

  const connection = await mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    multipleStatements: true,
  });

  try {
    await connection.query(sql);
    console.log("Migration completed: 001_init.sql");
  } finally {
    await connection.end();
  }
}

run().catch((error) => {
  console.error("Migration failed:", error.message);
  process.exit(1);
});
