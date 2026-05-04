import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { opportunitiesTable } from "./opportunities";

export const activityTable = pgTable("activity", {
  id: uuid("id").primaryKey().defaultRandom(),
  action: text("action").notNull(),
  opportunityId: uuid("opportunity_id").references(() => opportunitiesTable.id, {
    onDelete: "cascade",
  }),
  opportunityTitle: text("opportunity_title").notNull(),
  authorId: uuid("author_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  authorName: text("author_name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertActivitySchema = createInsertSchema(activityTable).omit({
  id: true,
  createdAt: true,
});

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activityTable.$inferSelect;
