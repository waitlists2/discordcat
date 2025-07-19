import { DiscordUser } from '@shared/schema';

class DiscordService {
  private userCache = new Map<string, DiscordUser>();
  private botTokens: string[];
  private tokenIndex: number = 0;

  constructor() {
    this.botTokens = [
      process.env.DISCORD_BOT_TOKEN,
      process.env.DISCORD_BOT_TOKEN2,
      process.env.DISCORD_BOT_TOKEN3
    ].filter(Boolean) as string[];
    if (this.botTokens.length === 0) {
      console.warn('No Discord bot tokens found in environment variables.');
    }
  }

  private getNextToken(): string | undefined {
    if (this.botTokens.length === 0) return undefined;
    const token = this.botTokens[this.tokenIndex];
    this.tokenIndex = (this.tokenIndex + 1) % this.botTokens.length;
    return token;
  }

  async getUser(userId: string, botToken?: string): Promise<DiscordUser | null> {
    // Check cache first
    if (this.userCache.has(userId)) {
      return this.userCache.get(userId)!;
    }

    // Use provided token, otherwise rotate between available tokens
    const token = botToken || this.getNextToken();
    if (!token) {
      // Return fallback user without avatar
      const fallbackUser: DiscordUser = {
        id: userId,
        username: `User ${userId.slice(-4)}`,
        avatar: null,
      };
      this.userCache.set(userId, fallbackUser);
      return fallbackUser;
    }

    try {
      const response = await fetch(`https://discord.com/api/v10/users/${userId}`, {
        headers: {
          Authorization: `Bot ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Discord API error: ${response.status}`);
      }

      const userData = await response.json();
      const user: DiscordUser = {
        id: userData.id,
        username: userData.username,
        avatar: userData.avatar 
          ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`
          : null,
      };

      // Cache the user data
      this.userCache.set(userId, user);
      return user;
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error);
      // Return fallback user
      const fallbackUser: DiscordUser = {
        id: userId,
        username: `User ${userId.slice(-4)}`,
        avatar: null,
      };
      this.userCache.set(userId, fallbackUser);
      return fallbackUser;
    }
  }
}

export const discordService = new DiscordService();
