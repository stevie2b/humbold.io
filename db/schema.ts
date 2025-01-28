import { pgTable, text, serial, jsonb, timestamp, varchar, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const travelPlans = pgTable("travel_plans", {
  id: serial("id").primaryKey(),
  preferences: jsonb("preferences").notNull(),
  itinerary: jsonb("itinerary").notNull(),
  recommendations: jsonb("recommendations").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const destinations = pgTable("destinations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  countryCode: varchar("country_code", { length: 2 }).notNull(),
  description: text("description"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  imageUrl: text("image_url"),
  seasonalRatings: jsonb("seasonal_ratings").$type<{
    spring: number;
    summer: number;
    autumn: number;
    winter: number;
  }>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTravelPlanSchema = createInsertSchema(travelPlans);
export const selectTravelPlanSchema = createSelectSchema(travelPlans);
export type InsertTravelPlan = typeof travelPlans.$inferInsert;
export type SelectTravelPlan = typeof travelPlans.$inferSelect;

export const insertDestinationSchema = createInsertSchema(destinations);
export const selectDestinationSchema = createSelectSchema(destinations);
export type InsertDestination = typeof destinations.$inferInsert;
export type SelectDestination = typeof destinations.$inferSelect;