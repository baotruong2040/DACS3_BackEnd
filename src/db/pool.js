const mysql = require("mysql2/promise");
const { env } = require("../config/env");

const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
  decimalNumbers: true,
});

async function closePool() {
  await pool.end();
}

module.exports = {
  pool,
  closePool,
};
