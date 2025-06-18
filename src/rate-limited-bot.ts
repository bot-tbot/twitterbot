import { TwitterApi } from 'twitter-api-v2';
import { logger } from './utils/logger';
import { config } from './config/nconf';
import { DatabaseService } from './services/DatabaseService';
import { WalletService } from './services/WalletService';
import { OllamaService } from './services/OllamaService';
import { BettingMarketService } from './services/BettingMarketService';

class RateLimitedBot {
  private client: TwitterApi;
  private rwClient: TwitterApi;
  private botUserId: string;
  private databaseService: DatabaseService;
  private walletService: WalletService;
  private ollamaService: OllamaService;
  private bettingMarketService: BettingMarketService;
  private processedTweets: Set<string> = new Set();

  constructor() {
    // Initialize Twitter client
    this.client = new TwitterApi({
      appKey: config.twitter.apiKey,
      appSecret: config.twitter.apiSecret,
      accessToken: config.twitter.accessToken,
      accessSecret: config.twitter.accessSecret,
    });

    this.rwClient = this.client.readWrite as TwitterApi;
    this.botUserId = config.twitter.botUserId;

    // Initialize services
    this.databaseService = new DatabaseService();
    this.walletService = new WalletService();
    this.ollamaService = new OllamaService();
    this.bettingMarketService = new BettingMarketService(this.databaseService, this.walletService);
  }

  async start() {
    try {
      console.log('🤖 Starting Rate-Limited Bot...');
      
      // Initialize services
      await this.databaseService.connect();
      await this.walletService.initialize();
      await this.ollamaService.initialize();
      
      console.log('✅ Services initialized');
      console.log('🔍 Checking for mentions...');
      
      // Process mentions once
      await this.processMentions();
      
      console.log('✅ Bot processing complete');
      
    } catch (error) {
      console.error('❌ Error:', error);
    } finally {
      await this.databaseService.disconnect();
    }
  }

  async processMentions() {
    try {
      // Get mentions with rate limiting
      const mentions = await this.client.v2.userMentionTimeline(this.botUserId, {
        max_results: 10,
        'tweet.fields': ['created_at', 'text', 'author_id'],
        'user.fields': ['username', 'name']
      });

      console.log(`📊 Found ${mentions.data?.data?.length || 0} mentions`);

      if (!mentions.data?.data) {
        console.log('📝 No mentions to process');
        return;
      }

      // Process each mention
      for (const tweet of mentions.data.data) {
        if (this.processedTweets.has(tweet.id)) {
          console.log(`⏭️ Skipping already processed tweet: ${tweet.id}`);
          continue;
        }

        console.log(`\n📨 Processing tweet: ${tweet.text.substring(0, 50)}...`);
        
        try {
          await this.processTweet(tweet);
          this.processedTweets.add(tweet.id);
          console.log(`✅ Processed tweet: ${tweet.id}`);
          
          // Wait 2 seconds between processing to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          console.error(`❌ Error processing tweet ${tweet.id}:`, error);
        }
      }

    } catch (error: any) {
      if (error.code === 429) {
        console.log('⏰ Rate limited - waiting 60 seconds before retry...');
        await new Promise(resolve => setTimeout(resolve, 60000));
        await this.processMentions(); // Retry
      } else {
        throw error;
      }
    }
  }

  async processTweet(tweet: any) {
    const text = tweet.text;
    const authorId = tweet.author_id;
    const tweetId = tweet.id;

    console.log(`👤 User: ${authorId}`);
    console.log(`💬 Message: ${text}`);

    // Remove bot mention
    const userMessage = text.replace(/@testbot870359\s*/gi, "").trim();
    console.log(`📝 Clean message: ${userMessage}`);

    // Process with Ollama
    console.log('🧠 Processing with Ollama...');
    const intent = await this.ollamaService.processTweetForBettingIntent(userMessage);
    console.log('✅ Intent:', intent);

    // Validate intent
    const validation = this.ollamaService.validateIntent(intent);
    if (!validation.isValid) {
      console.log(`❌ Invalid intent: ${validation.error}`);
      return;
    }

    // Ensure user has wallet
    await this.ensureUserWallet(authorId);

    // Process betting intent
    console.log('🎲 Processing betting intent...');
    const result = await this.bettingMarketService.processBettingIntent(authorId, intent);
    console.log('✅ Result:', result.message);

    // Try to reply (if permissions allow)
    try {
      await this.replyToTweet(tweetId, result.message);
      console.log('✅ Reply sent successfully');
    } catch (error: any) {
      if (error.code === 403) {
        console.log('❌ Cannot reply - need to update Twitter app permissions');
        console.log('💡 Go to Twitter Developer Portal and set app permissions to "Read and Write"');
      } else {
        console.log(`❌ Reply failed: ${error.message}`);
      }
    }
  }

  async ensureUserWallet(userId: string) {
    try {
      let userWallet = await this.databaseService.getUserWallet(userId);
      if (!userWallet) {
        console.log(`🔑 Creating wallet for user ${userId}`);
        const walletInfo = await this.walletService.generateUserWallet(userId);
        userWallet = await this.databaseService.saveUserWallet(
          userId,
          walletInfo.address,
          walletInfo.address
        );
        console.log(`✅ Wallet created: ${walletInfo.address}`);
      }
    } catch (error) {
      console.error(`❌ Error ensuring wallet for user ${userId}:`, error);
      throw error;
    }
  }

  async replyToTweet(tweetId: string, message: string) {
    const truncatedMessage = message.length > 280 ? message.substring(0, 277) + '...' : message;
    
    // Use client.v2.tweet with reply parameter instead of rwClient.v2.reply
    const reply = await this.client.v2.tweet({
      text: truncatedMessage,
      reply: {
        in_reply_to_tweet_id: tweetId,
      },
    });
    
    console.log(`✅ Reply sent successfully: ${reply.data.id}`);
  }
}

// Run the bot
const bot = new RateLimitedBot();
bot.start()
  .then(() => {
    console.log('🎉 Bot finished processing');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Bot failed:', error);
    process.exit(1);
  }); 