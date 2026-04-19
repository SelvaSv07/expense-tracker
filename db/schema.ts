import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  pgEnum,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// --- Better Auth (PostgreSQL) ---

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

// --- App (INR; integer columns store whole rupees) ---

/** One row per user: starting balance for running balance (optional). */
export const userFinance = pgTable("user_finance", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  openingBalance: integer("opening_balance").notNull().default(0),
  /** UTC calendar date (YYYY-MM-DD) of last passive subscription materialization; limits runs to once per day. */
  lastSubscriptionMaterializeOn: date("last_subscription_materialize_on"),
});

export const userFinanceRelations = relations(userFinance, ({ one }) => ({
  user: one(user, {
    fields: [userFinance.userId],
    references: [user.id],
  }),
}));

export const aiMessageRole = pgEnum("ai_message_role", [
  "user",
  "assistant",
  "tool",
  "system",
]);

export const aiApprovalStatus = pgEnum("ai_approval_status", [
  "pending",
  "approved",
  "rejected",
  "expired",
]);

export const userAiSettings = pgTable("user_ai_settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  openaiApiKeyEnc: text("openai_api_key_enc").notNull(),
  keyLast4: text("key_last4").notNull(),
  model: text("model"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const aiConversations = pgTable(
  "ai_conversations",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("New Chat"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("ai_conversations_user_updated_idx").on(t.userId, t.updatedAt)],
);

export const aiMessages = pgTable(
  "ai_messages",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => aiConversations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: aiMessageRole("role").notNull(),
    content: text("content").notNull(),
    metadata: text("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("ai_messages_user_conversation_created_idx").on(
      t.userId,
      t.conversationId,
      t.createdAt,
    ),
  ],
);

export const aiApprovalStates = pgTable(
  "ai_approval_states",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** Opaque session id (matches client; chats are not persisted server-side). */
    conversationId: text("conversation_id").notNull(),
    serializedRunState: text("serialized_run_state").notNull(),
    status: aiApprovalStatus("status").notNull().default("pending"),
    toolName: text("tool_name"),
    toolArguments: text("tool_arguments"),
    toolCallId: text("tool_call_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("ai_approval_states_user_conversation_idx").on(t.userId, t.conversationId),
    index("ai_approval_states_status_created_idx").on(t.status, t.createdAt),
  ],
);

export const categories = pgTable(
  "categories",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: text("type").notNull(), // "income" | "expense"
    icon: text("icon"),
    /** Hex fill color for icon tile (e.g. #22c55e). */
    color: text("color").notNull().default("#64748b"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("categories_user_id_idx").on(t.userId)],
);

/** User-defined labels for payment method (e.g. Cash, Card, UPI). Stored name is written to `transactions.payment_method`. */
export const paymentMethods = pgTable(
  "payment_methods",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("payment_methods_user_id_idx").on(t.userId),
    uniqueIndex("payment_methods_user_name_uidx").on(t.userId, t.name),
  ],
);

/** Recurring or fixed-term bill (EMI, streaming, etc.); charges become `transactions` rows when due. */
export const subscriptions = pgTable(
  "subscriptions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    serviceName: text("service_name").notNull(),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    amount: integer("amount").notNull(),
    paymentMethod: text("payment_method"),
    note: text("note"),
    /** `recurring` | `until` */
    scheduleType: text("schedule_type").notNull(),
    /** Day of month (1–31); clamped to month length when posting. */
    billingDay: integer("billing_day").notNull(),
    untilYear: integer("until_year"),
    untilMonth: integer("until_month"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("subscriptions_user_id_idx").on(t.userId)],
);

export const transactions = pgTable(
  "transactions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    amount: integer("amount").notNull(),
    occurredAt: timestamp("occurred_at").notNull(),
    transactionName: text("transaction_name"),
    note: text("note"),
    paymentMethod: text("payment_method"),
    subscriptionId: text("subscription_id").references(() => subscriptions.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("transactions_user_occurred_idx").on(t.userId, t.occurredAt),
    index("transactions_subscription_id_idx").on(t.subscriptionId),
  ],
);

export const budgets = pgTable(
  "budgets",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    yearMonth: timestamp("year_month").notNull(),
    /** When true, `year_month` is `BUDGET_RECURRING_ANCHOR`; amount repeats from `starts_month` onward. */
    recurring: boolean("recurring").notNull().default(false),
    /** First month a recurring budget applies (`null` = every month, for legacy rows). Ignored when `recurring` is false. */
    startsMonth: timestamp("starts_month"),
    amount: integer("amount").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("budgets_user_category_month_uidx").on(
      t.userId,
      t.categoryId,
      t.yearMonth,
    ),
  ],
);

export const goals = pgTable(
  "goals",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    targetAmount: integer("target_amount").notNull(),
    savedAmount: integer("saved_amount").notNull().default(0),
    targetDate: timestamp("target_date"),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("goals_user_id_idx").on(t.userId)],
);

export const goalContributions = pgTable(
  "goal_contributions",
  {
    id: text("id").primaryKey(),
    goalId: text("goal_id")
      .notNull()
      .references(() => goals.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    occurredAt: timestamp("occurred_at").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("goal_contributions_goal_occurred_idx").on(t.goalId, t.occurredAt)],
);

export const paymentMethodsRelations = relations(paymentMethods, ({ one }) => ({
  user: one(user, {
    fields: [paymentMethods.userId],
    references: [user.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(user, {
    fields: [categories.userId],
    references: [user.id],
  }),
  transactions: many(transactions),
  budgets: many(budgets),
  subscriptions: many(subscriptions),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  user: one(user, {
    fields: [subscriptions.userId],
    references: [user.id],
  }),
  category: one(categories, {
    fields: [subscriptions.categoryId],
    references: [categories.id],
  }),
  transactions: many(transactions),
}));

export const userAiSettingsRelations = relations(userAiSettings, ({ one }) => ({
  user: one(user, {
    fields: [userAiSettings.userId],
    references: [user.id],
  }),
}));

export const aiConversationsRelations = relations(
  aiConversations,
  ({ one, many }) => ({
    user: one(user, {
      fields: [aiConversations.userId],
      references: [user.id],
    }),
    messages: many(aiMessages),
    approvals: many(aiApprovalStates),
  }),
);

export const aiMessagesRelations = relations(aiMessages, ({ one }) => ({
  user: one(user, {
    fields: [aiMessages.userId],
    references: [user.id],
  }),
  conversation: one(aiConversations, {
    fields: [aiMessages.conversationId],
    references: [aiConversations.id],
  }),
}));

export const aiApprovalStatesRelations = relations(aiApprovalStates, ({ one }) => ({
  user: one(user, {
    fields: [aiApprovalStates.userId],
    references: [user.id],
  }),
  conversation: one(aiConversations, {
    fields: [aiApprovalStates.conversationId],
    references: [aiConversations.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(user, {
    fields: [transactions.userId],
    references: [user.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
  subscription: one(subscriptions, {
    fields: [transactions.subscriptionId],
    references: [subscriptions.id],
  }),
}));

export const budgetsRelations = relations(budgets, ({ one }) => ({
  user: one(user, {
    fields: [budgets.userId],
    references: [user.id],
  }),
  category: one(categories, {
    fields: [budgets.categoryId],
    references: [categories.id],
  }),
}));

export const goalsRelations = relations(goals, ({ one, many }) => ({
  user: one(user, {
    fields: [goals.userId],
    references: [user.id],
  }),
  contributions: many(goalContributions),
}));

export const goalContributionsRelations = relations(
  goalContributions,
  ({ one }) => ({
    goal: one(goals, {
      fields: [goalContributions.goalId],
      references: [goals.id],
    }),
  }),
);

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  finance: one(userFinance, {
    fields: [user.id],
    references: [userFinance.userId],
  }),
  paymentMethods: many(paymentMethods),
  subscriptions: many(subscriptions),
  transactions: many(transactions),
  budgets: many(budgets),
  aiSettings: one(userAiSettings, {
    fields: [user.id],
    references: [userAiSettings.userId],
  }),
  aiConversations: many(aiConversations),
  aiMessages: many(aiMessages),
  aiApprovalStates: many(aiApprovalStates),
}));
