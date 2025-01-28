import { type Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { historicalContent, achievements, bookmarks, users, comments } from "@db/schema";
import { desc, eq, and } from "drizzle-orm";
import OpenAI from "openai";
import { Redis } from "ioredis";
import { z } from "zod";

// Initialize OpenAI and Redis clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const redis = new Redis("redis://redis:6379");

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

// Content generation helper class
class ContentGenerator {
  private static readonly SYSTEM_PROMPT = `You are an expert historian creating engaging microlearning content. 
  Each post should be historically accurate, engaging, and include:
  - A captivating hook
  - Clear, concise content (2-3 sentences)
  - An insightful takeaway
  Focus on accuracy while maintaining engagement.`;

  private static async generateWithCache(
    prompt: string,
    cacheKey: string,
    expirySeconds: number = 3600
  ) {
    // Check cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Generate new content
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

    // Cache the result
    await redis.setex(cacheKey, expirySeconds, JSON.stringify(content));

    return content;
  }

  static async generate(category: string, period: string) {
    const prompt = `Create a historical post about ${category} during ${period}.
    Include a title, hook, content, and takeaway. Format as JSON with these keys.`;

    const cacheKey = `history:${category}:${period}:${Date.now().toString(36)}`;
    return this.generateWithCache(prompt, cacheKey);
  }
}

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Original routes remain the same...
  app.get("/api/content", async (_req, res) => {
    const content = await db
      .select()
      .from(historicalContent)
      .orderBy(desc(historicalContent.createdAt))
      .limit(10);
    res.json(content);
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

      // Check rate limit
      const rateLimitKey = `ratelimit:generate:${req.user.id}`;
      const requests = await redis.incr(rateLimitKey);
      if (requests === 1) {
        await redis.expire(rateLimitKey, 60); // 1 minute window
      }

      if (requests > 5 && !req.user.premium) { // Higher limit for premium users
        return res.status(429).json({ 
          error: "Rate limit exceeded. Upgrade to premium for higher limits." 
        });
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

    const content = await db
      .select()
      .from(historicalContent)
      .orderBy(desc(historicalContent.createdAt))
      .limit(20);

    res.json(content);
  });

  // Your existing routes continue here...

  const httpServer = createServer(app);
  return httpServer;
}