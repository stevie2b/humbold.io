import type { Express } from "express";
import { createServer, type Server } from "http";
import { generateTravelPlan } from "./lib/openai";
import { searchDestinations } from "./lib/destinations";
import { db } from "@db";
import { destinations } from "@db/schema";
import { sql } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  app.post("/api/plan", async (req, res) => {
    try {
      const plan = await generateTravelPlan(req.body);
      res.json(plan);
    } catch (error) {
      console.error("Failed to generate travel plan:", error);
      res.status(500).json({ message: "Failed to generate travel plan" });
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

      // Use DISTINCT ON to ensure we get unique destinations
      const results = await db.query.destinations.findMany({
        orderBy: [
          sql`seasonal_ratings->>'${sql.raw(season)}' DESC`,
          sql`name ASC`
        ],
        limit: 4,
      });

      // Ensure unique destinations by name
      const uniqueResults = Array.from(
        new Map(results.map(item => [item.name, item])).values()
      );

      res.json(uniqueResults.slice(0, 4));
    } catch (error) {
      console.error("Failed to get recommended destinations:", error);
      res.status(500).json({ message: "Failed to get recommended destinations" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}