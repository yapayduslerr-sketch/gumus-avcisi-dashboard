import { decimal, index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const sourceStatuses = mysqlTable("source_statuses", {
  id: int("id").autoincrement().primaryKey(),
  sourceKey: varchar("sourceKey", { length: 64 }).notNull().unique(),
  label: varchar("label", { length: 160 }).notNull(),
  status: mysqlEnum("status", ["DELAYED", "PENDING_API", "OK", "STALE", "ERROR"]).notNull(),
  sourceUrl: text("sourceUrl").notNull(),
  lastAttemptAt: timestamp("lastAttemptAt"),
  lastSuccessAt: timestamp("lastSuccessAt"),
  observedAt: timestamp("observedAt"),
  errorMessage: text("errorMessage"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ statusIndex: index("source_statuses_status_idx").on(table.status) }));

export const marketSnapshots = mysqlTable("market_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  symbol: varchar("symbol", { length: 24 }).notNull(),
  price: decimal("price", { precision: 18, scale: 6 }),
  changePercent: decimal("changePercent", { precision: 10, scale: 4 }),
  sourceKey: varchar("sourceKey", { length: 64 }).notNull(),
  sourceUrl: text("sourceUrl").notNull(),
  observedAt: timestamp("observedAt"),
  fetchedAt: timestamp("fetchedAt").defaultNow().notNull(),
  status: mysqlEnum("status", ["DELAYED", "OK", "STALE", "ERROR"]).notNull(),
  errorMessage: text("errorMessage"),
}, (table) => ({ symbolTimeIndex: index("market_snapshots_symbol_time_idx").on(table.symbol, table.fetchedAt) }));

export type SourceStatus = typeof sourceStatuses.$inferSelect;
export type MarketSnapshot = typeof marketSnapshots.$inferSelect;