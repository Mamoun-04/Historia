import { type Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { historicalContent, achievements, bookmarks, users } from "@db/schema";
import { desc, eq } from "drizzle-orm";

// Sample content for testing
const sampleContent = [
  {
    title: "The Great Wall's Hidden Story",
    period: "Ancient China",
    category: "Architecture",
    hook: "Did you know the Great Wall wasn't just one wall, but a series of fortifications?",
    content: "Built over multiple dynasties, the Great Wall stretches over 13,000 miles. While popular belief suggests it's visible from space, this is actually a myth that began in 1932.",
    takeaway: "The wall's true purpose wasn't just military defense—it regulated trade and immigration.",
    imageUrl: "https://picsum.photos/seed/wall/800/400"
  },
  {
    title: "The Real Renaissance",
    period: "15th Century",
    category: "Art & Culture",
    hook: "Leonardo da Vinci wrote his notes backward, requiring a mirror to read them!",
    content: "The Renaissance wasn't just an artistic movement—it was a complete transformation of European society. It marked the transition from medieval to modern times.",
    takeaway: "This period laid the foundation for modern scientific thinking.",
    imageUrl: "https://picsum.photos/seed/renaissance/800/400"
  },
  {
    title: "Ancient Egyptian Dentistry",
    period: "Ancient Egypt",
    category: "Medicine",
    hook: "The world's first known dental procedure was performed over 7,000 years ago in Egypt.",
    content: "Ancient Egyptians were pioneers in dental care, developing toothpaste from ox hooves, ashes, and burnt eggshells. They even had specialized dental tools.",
    takeaway: "Many modern dental practices have roots in ancient Egyptian medicine.",
    imageUrl: "https://picsum.photos/seed/egypt/800/400"
  },
  {
    title: "Viking Navigation Secrets",
    period: "Viking Age",
    category: "Exploration",
    hook: "Vikings used mysterious 'sunstones' to navigate on cloudy days!",
    content: "Recent research suggests Vikings may have used crystals called 'sunstones' to locate the sun in overcast conditions. This allowed them to navigate with remarkable accuracy.",
    takeaway: "Viking navigation technology was far more advanced than previously thought.",
    imageUrl: "https://picsum.photos/seed/viking/800/400"
  }
];

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

  app.get("/api/bookmarks", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    const bookmarkedContent = await db
      .select({
        id: historicalContent.id,
        title: historicalContent.title,
        period: historicalContent.period,
        category: historicalContent.category,
        hook: historicalContent.hook,
        content: historicalContent.content,
        takeaway: historicalContent.takeaway,
        imageUrl: historicalContent.imageUrl,
        likes: historicalContent.likes,
        createdAt: historicalContent.createdAt,
      })
      .from(bookmarks)
      .innerJoin(
        historicalContent,
        eq(bookmarks.contentId, historicalContent.id)
      )
      .where(eq(bookmarks.userId, req.user.id))
      .orderBy(desc(bookmarks.createdAt));

    res.json(bookmarkedContent);
  });

  // Development endpoint to seed the database with sample content
  app.post("/api/seed-content", async (_req, res) => {
    try {
      // Clear existing content
      await db.delete(historicalContent);

      // Insert sample content
      await db.insert(historicalContent).values(sampleContent);

      res.json({ message: "Database seeded with sample content" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
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

  app.post("/api/premium/upgrade", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    try {
      // Update user's premium status in the database
      await db
        .update(users)
        .set({ premium: true })
        .where(eq(users.id, req.user.id));

      // Return success
      res.json({ message: "Successfully upgraded to premium" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}