import { z } from "zod";

// Discord message schema matching Elasticsearch document structure
export const discordMessageSchema = z.object({
  message_id: z.string(),
  content: z.string(),
  author_id: z.string(),
  channel_id: z.string(),
  guild_id: z.string(),
  timestamp: z.string(),
});

// Search filters schema
export const searchFiltersSchema = z.object({
  content: z.string().optional(),
  author_id: z.string().optional(),
  channel_id: z.string().optional(),
  guild_id: z.string().optional(),
  sort: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().min(1).default(1),
});

// Statistics schema
export const statisticsSchema = z.object({
  total_messages: z.number(),
  unique_users: z.number(),
  unique_guilds: z.number(),
});

// Discord user schema
export const discordUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  avatar: z.string().nullable(),
});

// Search results schema
export const searchResultsSchema = z.object({
  messages: z.array(discordMessageSchema),
  total: z.number(),
  page: z.number(),
  has_more: z.boolean(),
});

// Export types
export type DiscordMessage = z.infer<typeof discordMessageSchema>;
export type SearchFilters = z.infer<typeof searchFiltersSchema>;
export type Statistics = z.infer<typeof statisticsSchema>;
export type DiscordUser = z.infer<typeof discordUserSchema>;
export type SearchResults = z.infer<typeof searchResultsSchema>;
