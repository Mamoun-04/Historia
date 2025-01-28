import { type Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { historicalContent, achievements, bookmarks, users, comments } from "@db/schema";
import { desc, eq, and, lt, gt } from "drizzle-orm";

// Sample content for testing
const sampleContent = [
  {
    title: "The Mystery of the Maya Calendar",
    period: "Ancient Maya",
    category: "Ancient History",
    hook: "Did you know the Maya predicted the end of a cycle, not the end of the world in 2012?",
    content: "The Maya Long Count calendar completed its 13th b'ak'tun cycle on December 21, 2012, leading to widespread misinterpretation. In reality, this sophisticated calendar system demonstrates the Maya's advanced understanding of astronomy and mathematics.",
    takeaway: "Ancient civilizations often possessed knowledge that still impresses us today.",
    imageUrl: "https://picsum.photos/seed/maya/800/400",
    likes: 0,
  },
  {
    title: "The Real Cleopatra",
    period: "Ancient Egypt",
    category: "Cultural History",
    hook: "Cleopatra was actually Greek, not Egyptian - and she was a scholar, not just a beauty!",
    content: "Despite popular depictions, Cleopatra VII was a member of the Ptolemaic dynasty, of Macedonian-Greek descent. She was highly educated, speaking nine languages and contributing to medical and scientific texts.",
    takeaway: "Historical figures often have depths that popular culture overlooks.",
    imageUrl: "https://picsum.photos/seed/cleopatra/800/400",
    likes: 0,
  },
  {
    title: "The First Computer Programmer",
    period: "Industrial Era",
    category: "Scientific History",
    hook: "The first computer programmer was a woman - Ada Lovelace wrote the first algorithm in 1842!",
    content: "Ada Lovelace, daughter of poet Lord Byron, collaborated with Charles Babbage on his Analytical Engine. She wrote what is considered the first computer program, an algorithm to calculate Bernoulli numbers.",
    takeaway: "Women have been pioneers in computer science since its inception.",
    imageUrl: "https://picsum.photos/seed/ada/800/400",
    likes: 0,
  },
  {
    title: "The Great Tea Race",
    period: "Industrial Era",
    category: "Modern History",
    hook: "In 1866, ships raced across the globe just to deliver the first tea of the season!",
    content: "The Great Tea Race of 1866 saw clipper ships racing from China to London. The winners, Ariel and Taeping, arrived within minutes of each other after a 99-day journey of over 14,000 miles.",
    takeaway: "Competition has driven innovation and daring throughout history.",
    imageUrl: "https://picsum.photos/seed/tea/800/400",
    likes: 0,
  },
  {
    title: "The Berlin Wall's Secret Art",
    period: "20th Century",
    category: "Cultural History",
    hook: "The Berlin Wall became the world's largest canvas for protest art!",
    content: "The western side of the Berlin Wall transformed into an extensive gallery of protest art and graffiti. The East Side Gallery, a 1.3km-long section, still stands as the largest open-air gallery in the world.",
    takeaway: "Art often emerges as a powerful form of political expression.",
    imageUrl: "https://picsum.photos/seed/berlin/800/400",
    likes: 0,
  },
  {
    title: "The Viking Sunstone",
    period: "Medieval History",
    category: "Scientific History",
    hook: "Vikings might have navigated cloudy seas using magical crystals!",
    content: "Recent research suggests Vikings used crystals called 'sunstones' to navigate on cloudy days. These Iceland spars could detect the sun's position by polarized light, enabling precise navigation.",
    takeaway: "Ancient technologies were often more sophisticated than we imagine.",
    imageUrl: "https://picsum.photos/seed/viking/800/400",
    likes: 0,
  },
  {
    title: "The War of the Stray Dog",
    period: "20th Century",
    category: "Military History",
    hook: "A Greek soldier's dog sparked an international incident in 1925!",
    content: "The Incident at Petrich, also known as the War of the Stray Dog, began when a Greek soldier chased his dog across the Bulgarian border. The incident escalated into a brief military confrontation between Greece and Bulgaria.",
    takeaway: "Sometimes major historical events have surprisingly trivial triggers.",
    imageUrl: "https://picsum.photos/seed/dog/800/400",
    likes: 0,
  },
  {
    title: "The Lost Roman Legion",
    period: "Ancient Rome",
    category: "Military History",
    hook: "Did a Roman legion end up serving in ancient China?",
    content: "Some historians believe that survivors of the lost Roman legion of Crassus may have ended up serving as mercenaries in China. A settlement in modern-day China shows evidence of Roman military formations.",
    takeaway: "Ancient civilizations were more connected than we often assume.",
    imageUrl: "https://picsum.photos/seed/legion/800/400",
    likes: 0,
  },
  {
    title: "The Japanese Sword Test",
    period: "Medieval History",
    category: "Cultural History",
    hook: "Japanese swords were tested on real criminals - with official certifications!",
    content: "In medieval Japan, swordsmiths would test their blades on condemned criminals, recording the number of bodies their swords could cut through. These test results were engraved on the sword's tang.",
    takeaway: "Cultural practices that seem shocking today were once formal institutions.",
    imageUrl: "https://picsum.photos/seed/sword/800/400",
    likes: 0,
  },
  {
    title: "The Sacred Band of Thebes",
    period: "Ancient Greece",
    category: "Military History",
    hook: "An elite military unit was composed entirely of same-sex couples!",
    content: "The Sacred Band of Thebes was an elite military unit consisting of 150 pairs of male lovers. They were undefeated for 33 years until facing Alexander the Great at Chaeronea in 338 BCE.",
    takeaway: "Ancient attitudes toward sexuality and military prowess often differed from modern assumptions.",
    imageUrl: "https://picsum.photos/seed/thebes/800/400",
    likes: 0,
  },
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

  // Bookmark/Unbookmark content
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
        // If bookmark exists, remove it
        await db
          .delete(bookmarks)
          .where(
            and(
              eq(bookmarks.userId, req.user.id),
              eq(bookmarks.contentId, Number(req.params.id))
            )
          );
        return res.json({ message: "Bookmark removed successfully" });
      }

      // If bookmark doesn't exist, create it
      await db.insert(bookmarks).values({
        userId: req.user.id,
        contentId: Number(req.params.id),
      });

      res.json({ message: "Content bookmarked successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });


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