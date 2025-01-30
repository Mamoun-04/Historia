import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  premium: boolean("premium").default(false),
  streak: integer("streak").default(0),
  lastLogin: timestamp("last_login").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Historical content table
export const historicalContent = pgTable("historical_content", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  period: text("period").notNull(),
  category: text("category").notNull(),
  hook: text("hook").notNull(),
  content: text("content").notNull(),
  takeaway: text("takeaway").notNull(),
  imageUrl: text("image_url"),
  likes: integer("likes").default(0),
  roadmap_id: integer("roadmap_id"), // Kept to avoid data loss
  section_id: integer("section_id"), // Kept to avoid data loss
  createdAt: timestamp("created_at").defaultNow(),
});

// Achievements table
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  condition: json("condition").notNull(), // JSON object defining unlock conditions
});

// User achievements junction table
export const userAchievements = pgTable("user_achievements", {
  userId: integer("user_id").references(() => users.id),
  achievementId: integer("achievement_id").references(() => achievements.id),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
});

// Comments table
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  contentId: integer("content_id").references(() => historicalContent.id),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bookmarks table
export const bookmarks = pgTable("bookmarks", {
  userId: integer("user_id").references(() => users.id),
  contentId: integer("content_id").references(() => historicalContent.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define relations
export const userRelations = relations(users, ({ many }) => ({
  achievements: many(userAchievements),
  comments: many(comments),
  bookmarks: many(bookmarks),
}));

export const contentRelations = relations(historicalContent, ({ many }) => ({
  comments: many(comments),
  bookmarks: many(bookmarks),
}));

// Create Zod schemas for type validation
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const insertContentSchema = createInsertSchema(historicalContent);
export const selectContentSchema = createSelectSchema(historicalContent);

export const insertAchievementSchema = createInsertSchema(achievements);
export const selectAchievementSchema = createSelectSchema(achievements);

// Export types
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;

export type InsertContent = typeof historicalContent.$inferInsert;
export type SelectContent = typeof historicalContent.$inferSelect;

export type InsertAchievement = typeof achievements.$inferInsert;
export type SelectAchievement = typeof achievements.$inferSelect;