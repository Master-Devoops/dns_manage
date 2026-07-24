import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  ADMIN_USERNAME: z.string().min(1),
  ADMIN_PASSWORD: z.string().min(4),
  JWT_SECRET: z.string().min(16),
  GODADDY_API_KEY: z.string().min(1),
  GODADDY_API_SECRET: z.string().min(1),
  GODADDY_ENV: z.enum(["production", "ote"]).default("production"),
  MANAGED_DOMAINS: z.string().optional().default(""),
  MYSQL_HOST: z.string().default("127.0.0.1"),
  MYSQL_PORT: z.coerce.number().default(3306),
  MYSQL_USER: z.string().default("root"),
  MYSQL_PASSWORD: z.string().optional().default(""),
  MYSQL_DATABASE: z.string().default("dns_manage"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const env = parsed.data;

export const config = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  adminUsername: env.ADMIN_USERNAME,
  adminPassword: env.ADMIN_PASSWORD,
  jwtSecret: env.JWT_SECRET,
  godaddy: {
    apiKey: env.GODADDY_API_KEY,
    apiSecret: env.GODADDY_API_SECRET,
    baseUrl:
      env.GODADDY_ENV === "ote"
        ? "https://api.ote-godaddy.com/v1"
        : "https://api.godaddy.com/v1",
  },
  managedDomains: env.MANAGED_DOMAINS
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean),
  mysql: {
    host: env.MYSQL_HOST,
    port: env.MYSQL_PORT,
    user: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD,
    database: env.MYSQL_DATABASE,
  },
};
