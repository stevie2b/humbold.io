import type { Express } from "express";
import { createServer, type Server } from "http";
import { generateTravelPlan } from "./lib/openai";
import { searchDestinations } from "./lib/destinations";
import { db } from "@db";
import { destinations } from "@db/schema";
import { sql } from "drizzle-orm";
import { MAJOR_CITIES } from "./lib/cities-data";

export function registerRoutes(app: Express): Server {
  app.post("/api/plan", async (req, res) => {
    try {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OpenAI API key is not configured");
      }

      const { numberOfDays, ...otherPreferences } = req.body;
      console.log("Generating plan with preferences:", { numberOfDays, ...otherPreferences });

      const plan = await generateTravelPlan({
        numberOfDays: parseInt(numberOfDays) || 7,
        ...otherPreferences
      });
      res.json(plan);
    } catch (error) {
      console.error("Failed to generate travel plan:", error);
      res.status(500).json({ 
        message: "Failed to generate travel plan", 
        details: error.message 
      });
    }
  });

  app.get("/api/destinations/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== "string" || q.length < 2) {
        return res.status(400).json({ message: "Search query must be at least 2 characters" });
      }

      const results = await searchDestinations(q);
      res.json(results);
    } catch (error) {
      console.error("Failed to search destinations:", error);
      res.status(500).json({ message: "Failed to search destinations" });
    }
  });

  app.get("/api/destinations/recommended", async (req, res) => {
    try {
      const { season } = req.query;
      if (!season || typeof season !== "string") {
        return res.status(400).json({ message: "Season parameter is required" });
      }

      try {
        const results = await db.query.destinations.findMany({
          orderBy: [
            sql`(seasonal_ratings->>'${sql.raw(season)}')::numeric DESC`,
            sql`name ASC`
          ],
          limit: 8,
        });

        if (results.length === 0) {
          // Fallback to default recommendations if no database results
          const defaultRecommendations = MAJOR_CITIES
            .sort((a, b) => b.seasonalRatings[season] - a.seasonalRatings[season])
            .slice(0, 4);
          return res.json(defaultRecommendations);
        }

        const uniqueResults = Array.from(
          new Map(results.map(item => [item.name, item])).values()
        ).slice(0, 4);

        res.json(uniqueResults);
      } catch (dbError) {
        console.error("Database error, using fallback recommendations:", dbError);
        // Fallback to hardcoded recommendations
        const fallbackRecommendations = MAJOR_CITIES
          .sort((a, b) => b.seasonalRatings[season] - a.seasonalRatings[season])
          .slice(0, 4);
        res.json(fallbackRecommendations);
      }
    } catch (error) {
      console.error("Failed to get recommended destinations:", error);
      res.status(500).json({ message: "Failed to get recommended destinations" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}