import type { Express } from "express";
import { createServer, type Server } from "http";
import { elasticsearchService } from "./services/elasticsearch";
import { discordService } from "./services/discord";
import { searchFiltersSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get statistics endpoint
  app.get("/api/stats", async (_req, res) => {
    try {
      const stats = await elasticsearchService.getStatistics();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  // Search messages endpoint
  app.get("/api/search", async (req, res) => {
    try {
      console.log("Search request received:", {
        query: req.query,
        url: req.url,
        method: req.method
      });

      const filters = searchFiltersSchema.parse({
        content: req.query.content || undefined,
        author_id: req.query.author_id || undefined,
        channel_id: req.query.channel_id || undefined,
        guild_id: req.query.guild_id || undefined,
        sort: req.query.sort || 'desc',
        page: req.query.page ? parseInt(req.query.page as string) : 1,
      });

      console.log("Parsed filters:", filters);

      const results = await elasticsearchService.searchMessages(filters);
      console.log("Search results:", {
        messageCount: results.messages.length,
        total: results.total,
        page: results.page,
        has_more: results.has_more
      });

      res.json(results);
    } catch (error: any) {
      console.error("Error searching messages:", {
        error: error?.message || error,
        stack: error?.stack,
        query: req.query
      });
      res.status(500).json({ error: "Failed to search messages", details: error?.message || String(error) });
    }
  });

  // Get Discord user endpoint
  app.get("/api/user/:id", async (req, res) => {
    try {
      const userId = req.params.id;
      const botToken = req.headers.authorization?.replace('Bot ', '');

      const user = await discordService.getUser(userId, botToken);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user);
    } catch (error: any) {
      console.error(`Error fetching user ${req.params.id}:`, error?.message || error);
      res.status(500).json({ error: "Failed to fetch user", details: error?.message || String(error) });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
