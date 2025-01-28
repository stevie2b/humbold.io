import type { Express } from "express";
import { createServer, type Server } from "http";
import { generateTravelPlan } from "./lib/openai";
import { searchDestinations } from "./lib/destinations";

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
      if (!q || typeof q !== "string") {
        return res.status(400).json({ message: "Search query is required" });
      }

      const results = await searchDestinations(q);
      res.json(results);
    } catch (error) {
      console.error("Failed to search destinations:", error);
      res.status(500).json({ message: "Failed to search destinations" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}