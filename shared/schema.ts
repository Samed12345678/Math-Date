import { pgTable, text, serial, integer, boolean, timestamp, uuid, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Profile schema
export const genderEnum = pgEnum("gender", ["male", "female", "non-binary", "other"]);
export const interestedInEnum = pgEnum("interested_in", ["male", "female", "non-binary", "other", "everyone"]);

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  name: text("name").notNull(),
  birthdate: timestamp("birthdate").notNull(),
  bio: text("bio"),
  gender: genderEnum("gender").notNull(),
  interestedIn: interestedInEnum("interested_in").notNull(),
  location: text("location"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  lookingFor: text("looking_for").default("casual"),
  maxDistance: integer("max_distance").default(25),
  ageRangeMin: integer("age_range_min").default(18),
  ageRangeMax: integer("age_range_max").default(35),
  score: integer("score").default(70).notNull(), // Score out of 100
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
  photos: many(photos),
  interests: many(profileInterests),
  receivedLikes: many(likes, { relationName: "receivedLikes" }),
  sentLikes: many(likes, { relationName: "sentLikes" }),
  matches: many(matches),
}));

export const insertProfileSchema = createInsertSchema(profiles)
  .omit({ id: true, userId: true, score: true, createdAt: true, updatedAt: true })
  .extend({
    birthdate: z.coerce.date()
      .refine((date) => {
        // Calculate age
        const today = new Date();
        const birthDate = new Date(date);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        // Must be at least 18 years old
        return age >= 18;
      }, { message: "You must be at least 18 years old to use this app" }),
  });

export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profiles.$inferSelect;

// Photos schema
export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").references(() => profiles.id).notNull(),
  url: text("url").notNull(),
  isMain: boolean("is_main").default(false).notNull(),
  order: integer("order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const photosRelations = relations(photos, ({ one }) => ({
  profile: one(profiles, {
    fields: [photos.profileId],
    references: [profiles.id],
  }),
}));

export const insertPhotoSchema = createInsertSchema(photos)
  .omit({ id: true, createdAt: true });

export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type Photo = typeof photos.$inferSelect;

// Interests schema
export const interests = pgTable("interests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const interestsRelations = relations(interests, ({ many }) => ({
  profileInterests: many(profileInterests),
}));

// Profile Interests (many-to-many)
export const profileInterests = pgTable("profile_interests", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").references(() => profiles.id).notNull(),
  interestId: integer("interest_id").references(() => interests.id).notNull(),
});

export const profileInterestsRelations = relations(profileInterests, ({ one }) => ({
  profile: one(profiles, {
    fields: [profileInterests.profileId],
    references: [profiles.id],
  }),
  interest: one(interests, {
    fields: [profileInterests.interestId],
    references: [interests.id],
  }),
}));

// Likes schema
export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  likerId: integer("liker_id").references(() => profiles.id).notNull(),
  likedId: integer("liked_id").references(() => profiles.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const likesRelations = relations(likes, ({ one }) => ({
  liker: one(profiles, {
    fields: [likes.likerId],
    references: [profiles.id],
    relationName: "sentLikes",
  }),
  liked: one(profiles, {
    fields: [likes.likedId],
    references: [profiles.id],
    relationName: "receivedLikes",
  }),
}));

export const insertLikeSchema = createInsertSchema(likes)
  .omit({ id: true, createdAt: true });

export type InsertLike = z.infer<typeof insertLikeSchema>;
export type Like = typeof likes.$inferSelect;

// Matches schema
export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  profileId1: integer("profile_id_1").references(() => profiles.id).notNull(),
  profileId2: integer("profile_id_2").references(() => profiles.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
});

export const matchesRelations = relations(matches, ({ one, many }) => ({
  profile1: one(profiles, {
    fields: [matches.profileId1],
    references: [profiles.id],
  }),
  profile2: one(profiles, {
    fields: [matches.profileId2],
    references: [profiles.id],
  }),
  messages: many(messages),
}));

export type Match = typeof matches.$inferSelect;

// Messages schema
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").references(() => matches.id).notNull(),
  senderId: integer("sender_id").references(() => profiles.id).notNull(),
  content: text("content").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messagesRelations = relations(messages, ({ one }) => ({
  match: one(matches, {
    fields: [messages.matchId],
    references: [matches.id],
  }),
  sender: one(profiles, {
    fields: [messages.senderId],
    references: [profiles.id],
  }),
}));

export const insertMessageSchema = createInsertSchema(messages)
  .omit({ id: true, read: true, createdAt: true });

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Credits schema
export const credits = pgTable("credits", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").references(() => profiles.id).notNull().unique(),
  amount: integer("amount").default(10).notNull(),
  lastRefreshed: timestamp("last_refreshed").defaultNow().notNull(),
});

export const creditsRelations = relations(credits, ({ one }) => ({
  profile: one(profiles, {
    fields: [credits.profileId],
    references: [profiles.id],
  }),
}));

export type Credit = typeof credits.$inferSelect;
