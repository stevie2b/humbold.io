import { pgTable, text, serial, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const travelPlans = pgTable("travel_plans", {
  id: serial("id").primaryKey(),
  preferences: jsonb("preferences").notNull(),
  itinerary: jsonb("itinerary").notNull(),
  recommendations: jsonb("recommendations").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTravelPlanSchema = createInsertSchema(travelPlans);
export const selectTravelPlanSchema = createSelectSchema(travelPlans);
export type InsertTravelPlan = typeof travelPlans.$inferInsert;
export type SelectTravelPlan = typeof travelPlans.$inferSelect;
