import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  PORT: z.string().default("5000"),
  DB_HOST: z.string().default("localhost"),
  DB_PORT: z.string().default("6504"),
  DB_NAME: z.string().default("realtime_chat_and_thread_app"),
  DB_USER: z.string().default("postgres"),
  DB_PASSWORD: z.string().default("mrv7777"),
  CLERK_PUBLISHABLE_KEY: z.string(),
  CLERK_SECRET_KEY: z.string(),
  DB_SSL: z.string().optional().default("false"),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  process.exit(1);
}

export const env = parsed.data;
