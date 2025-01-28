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
    hook: "Did you know the Maya predicted the end of a cycle, not the end of the world in 2012?",
    content: "The Maya Long Count calendar completed its 13th b'ak'tun cycle on December 21, 2012, leading to widespread misinterpretation. In reality, this sophisticated calendar system demonstrates the Maya's advanced understanding of astronomy and mathematics.",
    takeaway: "Ancient civilizations often possessed knowledge that still impresses us today.",
    imageUrl: "https://picsum.photos/seed/maya/800/400",
  },
  {
    title: "The Silk Road's Hidden Influence",
    period: "Medieval Era",
    category: "Cultural History",
    hook: "How did ancient Chinese paper revolutionize European intellectual life?",
    content: "Paper, invented in China around 105 CE, took nearly a millennium to reach Europe through the Silk Road. This transfer sparked a revolution in record-keeping and literacy, laying the groundwork for the Renaissance.",
    takeaway: "Cultural exchange through trade routes shaped human civilization more than military conquests.",
    imageUrl: "https://picsum.photos/seed/silk-road/800/400",
  },
  {
    title: "The Great Library of Alexandria",
    period: "Ancient Egypt",
    category: "Ancient History",
    hook: "What knowledge was truly lost in history's most famous library fire?",
    content: "The Great Library of Alexandria housed up to 400,000 scrolls, making it the ancient world's largest collection of knowledge. Its destruction represents one of history's greatest intellectual losses, though it happened gradually over several centuries.",
    takeaway: "The preservation of knowledge is crucial for human progress.",
    imageUrl: "https://picsum.photos/seed/alexandria/800/400",
  },
  {
    title: "The First Computer Programmer",
    period: "Industrial Era",
    category: "Scientific History",
    hook: "Who was the world's first computer programmer? Hint: It wasn't a man.",
    content: "Ada Lovelace wrote the first algorithm intended for processing on a computer, making her the first computer programmer. Her notes on Charles Babbage's Analytical Engine in 1843 contained what is considered the first computer program.",
    takeaway: "Innovation knows no gender boundaries.",
    imageUrl: "https://picsum.photos/seed/ada/800/400",
  },
  {
    title: "Viking Navigation Secrets",
    period: "Middle Ages",
    category: "Military History",
    hook: "How did Vikings navigate without compasses?",
    content: "Vikings used sunstones (crystals of Iceland spar) to locate the sun on cloudy days, enabling accurate navigation. This sophisticated method, combined with their understanding of bird migration patterns, allowed them to explore vast distances.",
    takeaway: "Ancient peoples often developed ingenious solutions to complex problems.",
    imageUrl: "https://picsum.photos/seed/viking/800/400",
  },
  {
    title: "The Real Renaissance",
    period: "Renaissance",
    category: "Cultural History",
    hook: "Did the Renaissance really begin in Italy?",
    content: "While Italy is credited as the birthplace of the Renaissance, similar cultural revivals occurred in the Islamic Golden Age and the Song Dynasty of China centuries earlier. These movements significantly influenced European Renaissance thinking.",
    takeaway: "Great cultural movements often have multiple, interconnected origins.",
    imageUrl: "https://picsum.photos/seed/renaissance/800/400",
  },
  {
    title: "Ancient Egyptian Dentistry",
    period: "Ancient Egypt",
    category: "Scientific History",
    hook: "Would you trust a 5000-year-old dentist?",
    content: "Evidence shows that Ancient Egyptians were performing dental procedures as early as 3000 BCE. They developed surprisingly sophisticated treatments, including using gold wire to stabilize loose teeth and drilling holes to drain abscesses.",
    takeaway: "Medical innovation has a much longer history than we often realize.",
    imageUrl: "https://picsum.photos/seed/dentist/800/400",
  },
  {
    title: "The Original Social Network",
    period: "Industrial Era",
    category: "Cultural History",
    hook: "What was the Victorian era's version of Twitter?",
    content: "In the 1890s, the penny post allowed Victorians to send up to six letters per day in London, creating the world's first rapid social network. People would use these deliveries to arrange same-day meetings and share quick updates, much like modern social media.",
    takeaway: "The human desire for social connection drives technological innovation.",
    imageUrl: "https://picsum.photos/seed/penny-post/800/400",
  },
  {
    title: "The Great Wall's Hidden Story",
    period: "Ancient China",
    category: "Military History",
    hook: "Was the Great Wall of China really about defense?",
    content: "While commonly viewed as a defensive structure, the Great Wall of China also served as a customs border and regulated trade along the Silk Road. It was as much about controlling commerce and immigration as it was about military defense.",
    takeaway: "Historical monuments often served multiple, complex purposes.",
    imageUrl: "https://picsum.photos/seed/great-wall/800/400",
  },
  {
    title: "The Coffee Revolution",
    period: "Renaissance",
    category: "Cultural History",
    hook: "How did coffee change the course of history?",
    content: "The spread of coffee houses in 17th-century Europe created new spaces for intellectual discourse and political debate. These establishments were often called 'penny universities' because for the price of a coffee, anyone could engage in scholarly discussion.",
    takeaway: "Sometimes the smallest cultural changes can have profound historical impacts.",
    imageUrl: "https://picsum.photos/seed/coffee/800/400",
  }
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
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const [exists] = await db
        .select()
        .from(bookmarks)
        .where(and(
          eq(bookmarks.userId, req.user.id),
          eq(bookmarks.contentId, parseInt(req.params.id))
        ))
        .limit(1);

      if (exists) {
        await db
          .delete(bookmarks)
          .where(and(
            eq(bookmarks.userId, req.user.id),
            eq(bookmarks.contentId, parseInt(req.params.id))
          ));
        res.json({ bookmarked: false });
      } else {
        await db
          .insert(bookmarks)
          .values({
            userId: req.user.id,
            contentId: parseInt(req.params.id)
          });
        res.json({ bookmarked: true });
      }
    } catch (error: any) {
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