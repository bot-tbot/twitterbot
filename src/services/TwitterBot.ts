import { TwitterApi } from 'twitter-api-v2';
import { logger } from '../utils/logger';
import { config } from '../config/nconf';
import { DatabaseService } from './DatabaseService';
import { WalletService } from './WalletService';
import { OllamaService } from './OllamaService';
import { BettingMarketService } from './BettingMarketService';
import { TwitterMention, ProcessedTweet, BettingIntent } from '../types';

export class TwitterBot {
  private client: TwitterApi;
  private rwClient: TwitterApi;
  private botUserId: string;
  private isRunning: boolean = false;
  private pollingInterval: NodeJS.Timeout | null = null;

  constructor(
    private databaseService: DatabaseService,
    private walletService: WalletService,
    private ollamaService: OllamaService,
    private bettingMarketService: BettingMarketService
  ) {
    // Initialize Twitter client
    this.client = new TwitterApi({
      appKey: config.twitter.apiKey,
      appSecret: config.twitter.apiSecret,
      accessToken: config.twitter.accessToken,
      accessSecret: config.twitter.accessSecret,
    });

    this.rwClient = this.client.readWrite as TwitterApi;
    this.botUserId = config.twitter.botUserId;

    if (!this.botUserId) {
      throw new Error('Twitter bot user ID must be configured in config.json or environment variables');
    }
  }

  async start(): Promise<void> {
    try {
      logger.info('Starting Twitter Bot...');
      this.isRunning = true;
      
      // Start polling for mentions
      await this.startPolling();
      
      logger.info('Twitter Bot started successfully');
    } catch (error) {
      logger.error('Failed to start Twitter Bot:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      logger.info('Stopping Twitter Bot...');
      this.isRunning = false;
      
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }
      
      logger.info('Twitter Bot stopped successfully');
    } catch (error) {
      logger.error('Error stopping Twitter Bot:', error);
    }
  }

  private async startPolling(): Promise<void> {
    let sinceId: string | undefined = undefined;

    const pollMentions = async () => {
      if (!this.isRunning) return;

      try {
        const mentions = await this.rwClient.v2.userMentionTimeline(this.botUserId, {
          since_id: sinceId,
          expansions: ['author_id', 'entities.mentions.username'],
          'user.fields': ['username', 'name'],
          max_results: 10,
        });

        for (const tweet of mentions.data?.data || []) {
          if (tweet.author_id) {
            const processed = this.processTweet(tweet as TwitterMention, mentions);
            if (processed) {
              await this.handleTweet(processed);
            }
            sinceId = tweet.id;
          }
        }
      } catch (error) {
        logger.error('Error polling mentions:', error);
      }
    };

    await pollMentions();
    this.pollingInterval = setInterval(pollMentions, 300000); // Poll every 5 minutes (300 seconds)
  }

  private processTweet(tweet: TwitterMention, mentionsResponse: any): ProcessedTweet | null {
    try {
      const text = tweet.text;
      const authorId = tweet.author_id;
      const tweetId = tweet.id;
      const mentions = tweet.entities?.mentions || [];

      // Extract all mentioned users
      const mentionedUsers = mentions.map(mention => {
        const username = mention.username;
        const user = mentionsResponse.includes?.users.find((u: any) => u.username === username);
        return {
          username,
          userId: user?.id,
          isBot: username === 'testbot870359' // Use actual bot username
        };
      });

      // Remove bot mention to get user command
      const userMessage = text.replace(/@testbot870359\s*/i, "").trim();

      return {
        text: userMessage,
        authorId,
        tweetId,
        mentions: mentionedUsers,
      };
    } catch (error) {
      logger.error('Error processing tweet:', error);
      return null;
    }
  }

  private async handleTweet(processedTweet: ProcessedTweet): Promise<void> {
    try {
      logger.info(`Processing tweet from user ${processedTweet.authorId}: ${processedTweet.text}`);

      // Process the tweet with Ollama to extract betting intent
      const intent = await this.ollamaService.processTweetForBettingIntent(processedTweet.text);
      
      // Validate the intent
      const validation = this.ollamaService.validateIntent(intent);
      if (!validation.isValid) {
        await this.replyToTweet(processedTweet.tweetId, `❌ ${validation.error}. Type "help" for available commands.`);
        return;
      }

      // Ensure user has a wallet
      await this.ensureUserWallet(processedTweet.authorId);

      // Process the betting intent
      const result = await this.bettingMarketService.processBettingIntent(processedTweet.authorId, intent);

      // Reply to the tweet
      await this.replyToTweet(processedTweet.tweetId, result.message);

    } catch (error) {
      logger.error(`Error handling tweet ${processedTweet.tweetId}:`, error);
      
      // Send error response
      const errorMessage = '❌ Sorry, something went wrong. Please try again or type "help" for assistance.';
      await this.replyToTweet(processedTweet.tweetId, errorMessage);
    }
  }

  private async ensureUserWallet(userId: string): Promise<void> {
    try {
      // Check if user already has a wallet
      let userWallet = await this.databaseService.getUserWallet(userId);

      if (!userWallet) {
        logger.info(`Creating wallet for user ${userId}`);
        
        // Create a new wallet using WalletService
        const walletInfo = await this.walletService.generateUserWallet(userId);
        
        // Save the wallet to database
        userWallet = await this.databaseService.saveUserWallet(
          userId,
          walletInfo.address, // Use address as walletId for now
          walletInfo.address
        );
        
        logger.info(`Wallet created and saved for user ${userId}: ${walletInfo.address}`);
      }
    } catch (error) {
      logger.error(`Error ensuring wallet for user ${userId}:`, error);
      throw error;
    }
  }

  private async replyToTweet(tweetId: string, message: string): Promise<void> {
    try {
      // Ensure message is within Twitter's character limit
      const truncatedMessage = message.length > 280 ? message.substring(0, 277) + '...' : message;
      
      // Use client.v2.tweet with reply parameter instead of rwClient.v2.reply
      const reply = await this.client.v2.tweet({
        text: truncatedMessage,
        reply: {
          in_reply_to_tweet_id: tweetId,
        },
      });
      
      logger.info(`Replied to tweet ${tweetId}: ${truncatedMessage} (Reply ID: ${reply.data.id})`);
    } catch (error) {
      logger.error(`Error replying to tweet ${tweetId}:`, error);
    }
  }

  /**
   * Sends a direct message to a user
   */
  async sendDirectMessage(userId: string, message: string): Promise<void> {
    try {
      await this.rwClient.v2.sendDmToParticipant(userId, { text: message });
      logger.info(`Sent DM to user ${userId}: ${message}`);
    } catch (error) {
      logger.error(`Error sending DM to user ${userId}:`, error);
    }
  }

  /**
   * Posts a tweet
   */
  async postTweet(message: string): Promise<void> {
    try {
      await this.rwClient.v2.tweet(message);
      logger.info(`Posted tweet: ${message}`);
    } catch (error) {
      logger.error('Error posting tweet:', error);
    }
  }

  /**
   * Gets bot information
   */
  async getBotInfo(): Promise<any> {
    try {
      const bot = await this.rwClient.v2.user(this.botUserId);
      return bot.data;
    } catch (error) {
      logger.error('Error getting bot info:', error);
      throw error;
    }
  }
} 