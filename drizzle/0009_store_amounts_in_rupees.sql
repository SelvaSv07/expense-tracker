-- Monetary integer columns were stored in paisa (1/100 ₹); convert to whole rupees.
UPDATE "user_finance" SET "opening_balance" = ROUND("opening_balance"::numeric / 100)::integer;
UPDATE "transactions" SET "amount" = ROUND("amount"::numeric / 100)::integer;
UPDATE "budgets" SET "amount" = ROUND("amount"::numeric / 100)::integer;
UPDATE "goals" SET
  "target_amount" = ROUND("target_amount"::numeric / 100)::integer,
  "saved_amount" = ROUND("saved_amount"::numeric / 100)::integer;
UPDATE "goal_contributions" SET "amount" = ROUND("amount"::numeric / 100)::integer;
