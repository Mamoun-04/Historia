import { type Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { historicalContent, achievements } from "@db/schema";
import { desc, eq } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  app.get("/api/content", async (_req, res) => {
    const content = await db
      .select()
      .from(historicalContent)
      .orderBy(desc(historicalContent.createdAt));
    res.json(content);
  });

  app.get("/api/content/:id", async (req, res) => {
    const [content] = await db
      .select()
      .from(historicalContent)
      .where(eq(historicalContent.id, Number(req.params.id)))
      .limit(1);

    if (!content) {
      return res.status(404).send("Content not found");
    }

    res.json(content);
  });

  app.get("/api/achievements", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    const userAchievements = await db
      .select()
      .from(achievements);

    res.json(userAchievements);
  });

  const httpServer = createServer(app);
  return httpServer;
}
