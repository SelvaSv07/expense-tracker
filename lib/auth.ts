import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: process.env.BETTER_AUTH_URL
    ? [process.env.BETTER_AUTH_URL]
    : ["http://localhost:3000"],
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret:
    process.env.BETTER_AUTH_SECRET ??
    "dev-only-secret-min-32-characters-long-change-me!!",
  plugins: [nextCookies()],
});
