import { type Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { historicalContent, achievements, bookmarks, users, comments } from "@db/schema";
import { desc, eq, and, lt, gt } from "drizzle-orm";

// Sample content for testing
const sampleContent = [
  {
    title: "The Great Wall's Hidden Story",
    period: "Ancient China",
    category: "Architecture",
    hook: "Did you know the Great Wall wasn't just one wall, but a series of fortifications?",
    content: "Built over multiple dynasties, the Great Wall stretches over 13,000 miles. While popular belief suggests it's visible from space, this is actually a myth that began in 1932.",
    takeaway: "The wall's true purpose wasn't just military defense—it regulated trade and immigration.",
    imageUrl: "https://picsum.photos/seed/wall/800/400",
    likes: 0, // Added likes field
  },
  {
    title: "The Real Renaissance",
    period: "15th Century",
    category: "Art & Culture",
    hook: "Leonardo da Vinci wrote his notes backward, requiring a mirror to read them!",
    content: "The Renaissance wasn't just an artistic movement—it was a complete transformation of European society. It marked the transition from medieval to modern times.",
    takeaway: "This period laid the foundation for modern scientific thinking.",
    imageUrl: "https://picsum.photos/seed/renaissance/800/400",
    likes: 0, // Added likes field
  },
  {
    title: "Ancient Egyptian Dentistry",
    period: "Ancient Egypt",
    category: "Medicine",
    hook: "The world's first known dental procedure was performed over 7,000 years ago in Egypt.",
    content: "Ancient Egyptians were pioneers in dental care, developing toothpaste from ox hooves, ashes, and burnt eggshells. They even had specialized dental tools.",
    takeaway: "Many modern dental practices have roots in ancient Egyptian medicine.",
    imageUrl: "https://picsum.photos/seed/egypt/800/400",
    likes: 0, // Added likes field
  },
  {
    title: "Viking Navigation Secrets",
    period: "Viking Age",
    category: "Exploration",
    hook: "Vikings used mysterious 'sunstones' to navigate on cloudy days!",
    content: "Recent research suggests Vikings may have used crystals called 'sunstones' to locate the sun in overcast conditions. This allowed them to navigate with remarkable accuracy.",
    takeaway: "Viking navigation technology was far more advanced than previously thought.",
    imageUrl: "https://picsum.photos/seed/viking/800/400",
    likes: 0, // Added likes field
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
      const [updatedUser] = await db
        .update(users)
        .set({ premium: true })
        .where(eq(users.id, req.user.id))
        .returning();

      // Return success
      res.json({
        message: "Successfully upgraded to premium",
        user: updatedUser
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/premium/cancel", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    try {
      // Update user's premium status in the database
      const [updatedUser] = await db
        .update(users)
        .set({ premium: false })
        .where(eq(users.id, req.user.id))
        .returning();

      // Return success
      res.json({
        message: "Successfully cancelled premium subscription",
        user: updatedUser
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/streak/update", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.user.id))
        .limit(1);

      if (!user) {
        return res.status(404).send("User not found");
      }

      const lastLogin = new Date(user.lastLogin);
      const now = new Date();
      const timeDiff = now.getTime() - lastLogin.getTime();
      const minuteDiff = Math.floor(timeDiff / 1000 / 60);

      let streakLost = false;
      let previousStreak = user.streak || 0;
      let newStreak = previousStreak;

      // If more than 1 minute has passed since last login
      if (minuteDiff > 1) {
        newStreak = 1; // Start new streak at 1
        streakLost = previousStreak > 0; // Only mark as lost if they had a streak
      } else if (minuteDiff > 0) {
        // Only increment if some time has passed (avoid double counting)
        newStreak = previousStreak + 1;
      }

      const [updatedUser] = await db
        .update(users)
        .set({ 
          streak: newStreak,
          lastLogin: now,
        })
        .where(eq(users.id, req.user.id))
        .returning();

      res.json({ 
        user: updatedUser,
        streakLost,
        previousStreak
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Like content
  app.post("/api/content/:id/like", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const [content] = await db
        .update(historicalContent)
        .set({ 
          likes: historicalContent.likes + 1 
        })
        .where(eq(historicalContent.id, Number(req.params.id)))
        .returning();

      res.json(content);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Unlike content
  app.post("/api/content/:id/unlike", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const [content] = await db
        .update(historicalContent)
        .set({ 
          likes: historicalContent.likes - 1 
        })
        .where(eq(historicalContent.id, Number(req.params.id)))
        .returning();

      res.json(content);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Bookmark content
  app.post("/api/content/:id/bookmark", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    try {
      // Check if bookmark already exists
      const [existingBookmark] = await db
        .select()
        .from(bookmarks)
        .where(
          and(
            eq(bookmarks.userId, req.user.id),
            eq(bookmarks.contentId, Number(req.params.id))
          )
        )
        .limit(1);

      if (existingBookmark) {
        return res.status(400).send("Content already bookmarked");
      }

      await db.insert(bookmarks).values({
        userId: req.user.id,
        contentId: Number(req.params.id),
      });

      res.json({ message: "Content bookmarked successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Remove bookmark
  app.delete("/api/content/:id/bookmark", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    try {
      await db
        .delete(bookmarks)
        .where(
          and(
            eq(bookmarks.userId, req.user.id),
            eq(bookmarks.contentId, Number(req.params.id))
          )
        );

      res.json({ message: "Bookmark removed successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Add comment
  app.post("/api/content/:id/comment", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const [comment] = await db
        .insert(comments)
        .values({
          userId: req.user.id,
          contentId: Number(req.params.id),
          text: req.body.text,
        })
        .returning();

      res.json(comment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get comments for content
  app.get("/api/content/:id/comments", async (req, res) => {
    try {
      const contentComments = await db
        .select({
          id: comments.id,
          text: comments.text,
          createdAt: comments.createdAt,
          username: users.username,
          userId: users.id,
        })
        .from(comments)
        .innerJoin(users, eq(comments.userId, users.id))
        .where(eq(comments.contentId, Number(req.params.id)))
        .orderBy(desc(comments.createdAt));

      res.json(contentComments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Check if user has bookmarked content
  app.get("/api/content/:id/bookmarked", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const [bookmark] = await db
        .select()
        .from(bookmarks)
        .where(
          and(
            eq(bookmarks.userId, req.user.id),
            eq(bookmarks.contentId, Number(req.params.id))
          )
        )
        .limit(1);

      res.json({ bookmarked: !!bookmark });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}