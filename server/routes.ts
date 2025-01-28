import type { Express } from "express";
import { createServer, type Server } from "http";
import { generateTravelPlan } from "./lib/openai";

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

  const httpServer = createServer(app);
  return httpServer;
}
