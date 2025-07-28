import { Client } from '@elastic/elasticsearch';
import { DiscordMessage, Statistics, SearchFilters, SearchResults } from '@shared/schema';

// Ensure .env is loaded (safe to call multiple times)
import dotenv from 'dotenv';
dotenv.config();

class ElasticsearchService {
  private client: Client;
  private indices = ['chunk1', 'chunk2', 'chunk3', 'chunk4', 'chunk5', 'chunk6', 'chunk7', 'chunk8', 'chunk9', 'chunk10', 'chunk11', 'chunk12', 'chunk13', 'chunk14', 'chunk15', 'chunk16', 'chunk17', 'chunk18', 'chunk19', 'chunk20', 'chunk21', 'chunk22', 'chunk23', 'chunk24', 'chunk25', 'chunk26', 'chunk27', 'chunk28', 'chunk29', 'chunk30'];

  constructor() {
    const cloudId = process.env.ELASTICSEARCH_CLOUD_ID;
    const username = process.env.ELASTICSEARCH_USERNAME;
    const password = process.env.ELASTICSEARCH_PASSWORD;

    // Improved error reporting
    const missingVars = [];
    if (!cloudId) missingVars.push('ELASTICSEARCH_CLOUD_ID');
    if (!username) missingVars.push('ELASTICSEARCH_USERNAME');
    if (!password) missingVars.push('ELASTICSEARCH_PASSWORD');
    if (missingVars.length > 0) {
      throw new Error(
        `Missing required Elasticsearch environment variables: ${missingVars.join(', ')}. Please check your .env file.`
      );
    }

    try {
      this.client = new Client({
        cloud: { id: cloudId! },
        auth: { username: username!, password: password! },
      });
      console.log('✅ Elasticsearch client initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Elasticsearch client:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.ping();
      console.log('✅ Elasticsearch connection test successful');
      return true;
    } catch (error) {
      console.error('❌ Elasticsearch connection test failed:', error);
      return;
    }

    return false;
  }

  async getStatistics(): Promise<Statistics> {
    try {
      const [totalMessages, uniqueUsers, uniqueGuilds] = await Promise.all([
        this.getTotalMessages(),
        this.getUniqueUsers(),
        this.getUniqueGuilds(),
      ]);

      return {
        total_messages: totalMessages,
        unique_users: uniqueUsers,
        unique_guilds: uniqueGuilds,
      };
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw new Error('Failed to fetch statistics');
    }
  }

  private async getTotalMessages(): Promise<number> {
    const response = await this.client.count({
      index: this.indices,
    });

    // Handle both old and new response formats
    const count = response.count ?? response.body?.count;
    if (typeof count !== 'number') {
      console.error('Unexpected count response format:', JSON.stringify(response, null, 2));
      throw new Error('Invalid count response format');
    }

    return count;
  }

  private async getUniqueUsers(): Promise<number> {
    try {
      const response = await this.client.search({
        index: this.indices,
        size: 0,
        aggs: {
          unique_users: {
            cardinality: {
              field: 'author_id',
            },
          },
        },
      });

      // Handle both old and new response formats
      const aggregations = response.aggregations ?? response.body?.aggregations;

      if (!aggregations || !aggregations.unique_users) {
        console.error('No aggregations found in response');
        return 0;
      }

      return aggregations.unique_users.value || 0;
    } catch (error) {
      console.error('Error in getUniqueUsers:', error);
      return 0;
    }
  }

  private async getUniqueGuilds(): Promise<number> {
    try {
      const response = await this.client.search({
        index: this.indices,
        size: 0,
        aggs: {
          unique_guilds: {
            cardinality: {
              field: 'guild_id',
            },
          },
        },
      });

      // Handle both old and new response formats
      const aggregations = response.aggregations ?? response.body?.aggregations;

      if (!aggregations || !aggregations.unique_guilds) {
        console.error('No aggregations found in response');
        return 0;
      }

      return aggregations.unique_guilds.value || 0;
    } catch (error) {
      console.error('Error in getUniqueGuilds:', error);
      return 0;
    }
  }

  async searchMessages(filters: SearchFilters): Promise<SearchResults> {
    try {
      console.log("Elasticsearch searchMessages called with filters:", filters);

      const pageSize = 100; // Increased page size for better UX
      const from = (filters.page - 1) * pageSize;

      const query: any = {
        bool: {
          must: [],
        },
      };

      // Add content filter if provided - now only direct match
      if (filters.content) {
        query.bool.must.push({
          match_phrase: {
            content: {
              query: filters.content
            }
          }
        });
      }

      if (filters.author_id) {
        query.bool.must.push({
          term: { 'author_id': filters.author_id },
        });
      }

      if (filters.channel_id) {
        query.bool.must.push({
          term: { 'channel_id': filters.channel_id },
        });
      }

      if (filters.guild_id) {
        query.bool.must.push({
          term: { 'guild_id': filters.guild_id },
        });
      }

      if (query.bool.must.length === 0) {
        query.bool.must.push({ match_all: {} });
      }

      const searchParams = {
        index: this.indices,
        query,
        track_total_hits: true, // Ensure we get accurate total counts
        sort: [
          {
            timestamp: {
              order: filters.sort,
            },
          },
        ],
        from,
        size: pageSize,
        // Remove any default limits
        timeout: '60s', // Increase timeout for large result sets
        // Ensure we can access all results beyond 10k limit
        max_result_window: 1000000, // Allow up to 1M results
      };

      console.log("Elasticsearch search params:", JSON.stringify(searchParams, null, 2));

      const response = await this.client.search(searchParams);

      console.log("Elasticsearch response received:", {
        took: response.took,
        hits_total: (response.hits?.total ?? response.body?.hits?.total),
        hits_count: (response.hits?.hits?.length ?? response.body?.hits?.hits?.length)
      });

      // Handle both old and new response formats
      const hits = response.hits ?? response.body?.hits;
      if (!hits) {
        console.error('Unexpected search response format:', JSON.stringify(response, null, 2));
        throw new Error('Invalid search response format');
      }

      const messages: DiscordMessage[] = hits.hits.map((hit: any) => hit._source);
      const total = typeof hits.total === 'number' ? hits.total : hits.total?.value || 0;
      const hasMore = from + pageSize < total;

      const result = {
        messages,
        total,
        page: filters.page,
        has_more: hasMore,
      };

      console.log("Final search result:", {
        messageCount: result.messages.length,
        total: result.total,
        page: result.page,
        has_more: result.has_more
      });

      return result;
    } catch (error: any) {
      console.error('Error searching messages:', {
        error: error?.message || error,
        stack: error?.stack,
        filters
      });
      throw new Error(`Failed to search messages: ${error?.message || error}`);
    }
  }
}

export const elasticsearchService = new ElasticsearchService();
