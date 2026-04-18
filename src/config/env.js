const dotenv = require("dotenv");
const { z } = require("zod");

dotenv.config({ quiet: true });

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DB_HOST: z.string().min(1).default("127.0.0.1"),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_USER: z.string().min(1).default("root"),
  DB_PASSWORD: z.string().default(""),
  DB_NAME: z.string().min(1).default("rt_express"),
  JWT_SECRET: z.string().min(16).default("dev_jwt_secret_change_me"),
  JWT_EXPIRES_IN: z.string().default("12h"),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(10),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  ADMIN_USERNAME: z.string().default("admin"),
  ADMIN_PASSWORD: z.string().default("change_admin_password"),
  ADMIN_FULL_NAME: z.string().default("System Admin"),
  ADMIN_EMAIL: z.string().default("admin@example.com"),
  ADMIN_PHONE: z.string().default("0123456789"),
  ADMIN_ADDRESS: z.string().default("Head Office"),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid environment configuration: ${details}`);
}

const env = parsed.data;

module.exports = { env };
