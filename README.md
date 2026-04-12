# Expense tracker (Cazura-style)

Next.js dashboard for budgets, transactions, and savings goals with PostgreSQL, Drizzle ORM, and Better Auth.

## Currency

The app is built for **Indian Rupee (INR)**. Monetary columns use the name **`amount`** (or `opening_balance`, `target_amount`, `saved_amount` where appropriate) and store integer **paisa** (100 paisa = ₹1). Display uses the **en-IN** locale (e.g. `₹1,23,456.78`).

Wallets default to `INR` ([`db/schema.ts`](db/schema.ts)).

If you upgraded from an older schema that used `amount_cents` / `*_cents` column names, run the SQL in [`drizzle/0001_rename_monetary_columns.sql`](drizzle/0001_rename_monetary_columns.sql) once against your database (or recreate the DB and `npm run db:push`).

## Getting Started

1. Copy [`.env.example`](.env.example) to `.env.local` and set `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and `NEXT_PUBLIC_APP_URL`.
2. Start Postgres: `docker compose up -d`
3. Apply schema: `npm run db:push`
4. Run the app: `npm run dev`

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run db:push` / `npm run db:generate` / `npm run db:migrate` — Drizzle
- `npm run docker:up` — start Postgres via Docker Compose

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
