import { type Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { historicalContent, achievements, bookmarks, users, comments } from "@db/schema";
import { desc, eq, and, sql } from "drizzle-orm";
import OpenAI from "openai";
import { z } from "zod";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Sample content for seeding
const sampleContent = [
  {
    title: "The Mystery of the Maya Calendar",
    period: "Ancient Maya",
    category: "Ancient History",
    hook: "The Maya calendar wasn't just a way to track time—it was a complex mathematical system that predicted celestial events with astonishing accuracy. But how did they achieve such precision without modern technology?",
    content: `At the heart of Maya civilization lay an extraordinary understanding of time and mathematics. Their calendar system, far from being a simple way to count days, was an intricate mathematical model that tracked multiple cycles simultaneously—the sacred 260-day tzolkin, the 365-day solar haab, and the Long Count calendar that spans over 5,000 years.

The Maya astronomers achieved remarkable accuracy in their calculations. Without telescopes or modern instruments, they predicted solar eclipses and tracked Venus's orbit with an error of just two hours in 500 years. This precision resulted from generations of careful observation and mathematical innovation.

The calendar wasn't just about tracking time—it was deeply integrated into Maya society. Priests used it to schedule religious ceremonies, farmers relied on it for agricultural planning, and rulers legitimized their power through prophecies tied to significant calendar dates. The infamous "end date" of December 21, 2012, was simply the completion of a 5,126-year cycle, much like our own calendar turning from one century to another.

The mathematical sophistication behind the Maya calendar system reveals something profound about human ingenuity. Using just simple tools and careful observation, they created a system so precise that it rivals modern astronomical calculations in some aspects.`,
    takeaway: "Ancient civilizations were capable of extraordinary scientific achievements through careful observation and mathematical thinking—a reminder that innovation doesn't always require advanced technology.",
    imageUrl: "https://picsum.photos/seed/maya/800/400",
  },
  {
    title: "The Hidden History of Paper Money",
    period: "Medieval China",
    category: "Economic History",
    hook: "Before the world adopted paper money, ancient Chinese merchants made a revolutionary discovery: wealth doesn't need to be heavy. This innovation would transform the global economy forever.",
    content: `In 9th century China, merchants faced a peculiar problem: carrying heavy strings of copper coins for large transactions was both impractical and dangerous. Their solution? Paper money, or 'flying cash'—a revolutionary concept that would reshape the world's economic landscape.

The first paper currency emerged during the Tang Dynasty (618-907 CE), initially as privately issued bills of credit by wealthy merchants. These merchants would deposit their heavy coins with trusted agents and receive paper certificates in return—essentially creating the world's first banknotes. By the Song Dynasty (960-1279 CE), the government had taken control of this innovation, establishing the world's first state-issued paper currency system.

This financial revolution had profound effects. Trade flourished as merchants could now travel long distances without the burden of metal currency. The government gained new economic tools, being able to control the money supply directly. However, this power came with risks—the temptation to print more money during times of crisis led to the world's first experiences with inflation and monetary policy.

The concept slowly spread westward along the Silk Road, eventually reaching Europe centuries later. Marco Polo's detailed accounts of Chinese paper money in his travels would later influence European banking practices, though Europe wouldn't adopt paper currency until the 17th century.`,
    takeaway: "Sometimes the most transformative innovations come from solving everyday problems, and their effects can ripple through centuries of human civilization.",
    imageUrl: "https://picsum.photos/seed/paper-money/800/400",
  },
  {
    title: "The Great Library's Lost Knowledge",
    period: "Ancient Egypt",
    category: "Cultural History",
    hook: "The Great Library of Alexandria wasn't just the largest collection of knowledge in the ancient world—it was humanity's first real attempt to gather all human knowledge in one place. What treasures did we lose when it vanished?",
    content: `The Great Library of Alexandria stood as the ancient world's most ambitious intellectual project—a universal library aimed at collecting all the world's knowledge under one roof. Founded in the 3rd century BCE under Ptolemy I, it grew to house an estimated 400,000 scrolls, drawing scholars from across the Mediterranean and beyond.

The Library's approach to knowledge was revolutionary. Ships docking at Alexandria were required to surrender any books they carried to be copied. The originals were kept in the Library, with copies returned to the owners. This aggressive collection policy helped create the world's first truly comprehensive research center.

Within its walls, groundbreaking discoveries were made. Eratosthenes calculated Earth's circumference with remarkable accuracy using just shadows and geometry. Archimedes developed fundamental principles of physics. Euclid wrote his "Elements," which would define mathematical reasoning for two millennia. The Library became a melting pot of Greek, Egyptian, Persian, and Indian knowledge.

The Library's destruction wasn't a single event but a series of tragedies spanning centuries. Caesar's fire in 48 BCE, religious conflicts, and urban warfare gradually diminished this intellectual treasure. Many works survived through copies spread across the ancient world, but countless unique manuscripts were lost forever—including works on mathematics, engineering, and natural philosophy that might have accelerated human progress by centuries.`,
    takeaway: "The Great Library reminds us that progress isn't always linear—sometimes humanity's greatest achievements can be lost, making preservation of knowledge as important as its discovery.",
    imageUrl: "https://picsum.photos/seed/alexandria/800/400",
  },
  // More content items follow the same pattern...
];

// Content generation schemas and types
const ContentSchema = z.object({
  title: z.string(),
  period: z.string(),
  category: z.string(),
  hook: z.string(),
  content: z.string(),
  takeaway: z.string(),
  imageUrl: z.string().optional(),
  likes: z.number().default(0),
});

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Get content feed
  app.get("/api/content", async (_req, res) => {
    try {
      console.log("Fetching content from database...");
      const content = await db
        .select()
        .from(historicalContent)
        .orderBy(desc(historicalContent.createdAt));

      console.log(`Found ${content.length} content items`);
      res.json(content);
    } catch (error: any) {
      console.error("Error fetching content:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get single content item with relations
  app.get("/api/content/:id", async (req, res) => {
    try {
      const contentId = parseInt(req.params.id);
      if (isNaN(contentId)) {
        return res.status(400).json({ error: "Invalid content ID" });
      }

      // Fetch content
      const [content] = await db
        .select()
        .from(historicalContent)
        .where(eq(historicalContent.id, contentId))
        .limit(1);

      if (!content) {
        return res.status(404).json({ error: "Content not found" });
      }

      // Fetch comments if user is authenticated
      let contentComments = [];
      if (req.user) {
        contentComments = await db
          .select({
            id: comments.id,
            text: comments.text,
            createdAt: comments.createdAt,
            username: users.username,
          })
          .from(comments)
          .innerJoin(users, eq(users.id, comments.userId))
          .where(eq(comments.contentId, contentId))
          .orderBy(desc(comments.createdAt));
      }

      // Check if user has bookmarked this content
      let isBookmarked = false;
      if (req.user) {
        const [bookmark] = await db
          .select()
          .from(bookmarks)
          .where(
            and(
              eq(bookmarks.userId, req.user.id),
              eq(bookmarks.contentId, contentId)
            )
          )
          .limit(1);
        isBookmarked = !!bookmark;
      }

      res.json({
        ...content,
        comments: contentComments,
        isBookmarked
      });
    } catch (error: any) {
      console.error("Error fetching content:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Seed database with initial content
  app.post("/api/seed-content", async (_req, res) => {
    try {
      console.log("Starting database seeding process...");

      // First, delete all existing content
      console.log("Deleting existing content...");
      await db.delete(historicalContent).execute();

      // Then insert the new content
      console.log("Inserting sample content...");
      const newContent = await db
        .insert(historicalContent)
        .values(sampleContent)
        .returning();

      console.log(`Successfully inserted ${newContent.length} items`);

      res.json({
        message: "Database seeded successfully",
        count: newContent.length,
        content: newContent
      });
    } catch (error: any) {
      console.error("Error in seed-content:", error);
      res.status(500).json({
        error: error.message,
        stack: error.stack
      });
    }
  });

  // Like content
  app.post("/api/content/:id/like", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const [updated] = await db
        .update(historicalContent)
        .set({ likes: sql`${historicalContent.likes} + 1` })
        .where(eq(historicalContent.id, parseInt(req.params.id)))
        .returning();

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Bookmark content
  app.post("/api/content/:id/bookmark", async (req, res) => {
    if (!req.user?.id) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const contentId = parseInt(req.params.id);
      if (isNaN(contentId)) {
        return res.status(400).json({ error: "Invalid content ID" });
      }

      const [exists] = await db
        .select()
        .from(bookmarks)
        .where(
          and(
            eq(bookmarks.userId, req.user.id),
            eq(bookmarks.contentId, contentId)
          )
        )
        .limit(1);

      if (exists) {
        await db
          .delete(bookmarks)
          .where(
            and(
              eq(bookmarks.userId, req.user.id),
              eq(bookmarks.contentId, contentId)
            )
          );
        res.json({ bookmarked: false });
      } else {
        await db
          .insert(bookmarks)
          .values({
            userId: req.user.id,
            contentId: contentId,
          });
        res.json({ bookmarked: true });
      }
    } catch (error: any) {
      console.error("Error toggling bookmark:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get user's bookmarks
  app.get("/api/bookmarks", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const bookmarkedContent = await db
        .select({
          content: historicalContent,
          bookmarkedAt: bookmarks.createdAt
        })
        .from(bookmarks)
        .innerJoin(historicalContent, eq(bookmarks.contentId, historicalContent.id))
        .where(eq(bookmarks.userId, req.user.id))
        .orderBy(desc(bookmarks.createdAt));

      res.json(bookmarkedContent);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // New AI content generation routes
  app.post("/api/content/generate", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const { category, period } = req.body;
      if (!category || !period) {
        return res.status(400).json({ error: "Category and period are required" });
      }

      // Generate content
      const generatedContent = await ContentGenerator.generate(category, period);

      // Validate generated content
      const parsedContent = ContentSchema.parse(generatedContent);

      // Store in database
      const [newContent] = await db
        .insert(historicalContent)
        .values({
          ...parsedContent,
          imageUrl: `https://picsum.photos/seed/${Date.now()}/800/400`,
        })
        .returning();

      res.json(newContent);
    } catch (error: any) {
      console.error("Error generating content:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Batch content generation for premium users
  app.post("/api/content/generate-batch", async (req, res) => {
    if (!req.user?.premium) {
      return res.status(403).json({
        error: "Batch generation is a premium feature"
      });
    }

    try {
      const { count = 5, category, period } = req.body;
      const maxCount = 10;

      const generations = await Promise.all(
        Array(Math.min(count, maxCount))
          .fill(null)
          .map(() => ContentGenerator.generate(category, period))
      );

      const validatedContent = generations.map(content =>
        ContentSchema.parse(content)
      );

      const newContent = await db
        .insert(historicalContent)
        .values(validatedContent.map(content => ({
          ...content,
          imageUrl: `https://picsum.photos/seed/${Date.now()}/800/400`,
        })))
        .returning();

      res.json(newContent);
    } catch (error: any) {
      console.error("Error in batch generation:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get premium content
  app.get("/api/content/premium", async (req, res) => {
    if (!req.user?.premium) {
      return res.status(403).json({
        error: "Premium subscription required"
      });
    }

    try {
      const content = await db
        .select()
        .from(historicalContent)
        .orderBy(desc(historicalContent.createdAt))
        .limit(20);

      res.json(content);
    } catch (error: any) {
      console.error("Error fetching premium content:", error);
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

class ContentGenerator {
  private static readonly SYSTEM_PROMPT = `You are an expert historian creating engaging microlearning content. 
  Each post should be historically accurate, engaging, and include:
  - A captivating hook
  - Clear, concise content (2-3 sentences)
  - An insightful takeaway
  Focus on accuracy while maintaining engagement.`;

  static async generate(category: string, period: string) {
    const prompt = `Create a historical post about ${category} during ${period}.
    Include a title, hook, content, and takeaway. Format as JSON with these keys.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: ContentGenerator.SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const content = JSON.parse(completion.choices[0].message.content);
    return content;
  }
}