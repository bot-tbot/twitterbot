// import { TwitterApi } from 'twitter-api-v2';
// import { logger } from '../utils/logger';
// import { config } from '../config/nconf';

// export class SimpleTwitterBot {
//   private client: TwitterApi;
//   private rwClient: TwitterApi;
//   private botUserId: string;
//   private botHandle: string = '@WagmieB';
//   private isRunning: boolean = false;
//   private pollingInterval: NodeJS.Timeout | null = null;

//   constructor() {
//     // Initialize Twitter client using the same credentials as the auth system
//     this.client = new TwitterApi({
//       appKey: config.twitter.apiKey,
//       appSecret: config.twitter.apiSecret,
//       accessToken: config.twitter.accessToken,
//       accessSecret: config.twitter.accessSecret,
//     });

//     this.rwClient = this.client.readWrite as TwitterApi;
//     this.botUserId = config.twitter.botUserId;

//     if (!this.botUserId) {
//       throw new Error('Twitter bot user ID must be configured in config.json');
//     }
//   }

//   async start(): Promise<void> {
//     try {
//       logger.info('🚀 Starting WagmieB Twitter Bot...');
//       this.isRunning = true;
      
//       // Start polling for mentions
//       await this.startPolling();
      
//       logger.info('✅ WagmieB Twitter Bot started successfully');
//     } catch (error) {
//       logger.error('Failed to start Twitter Bot:', error);
//       throw error;
//     }
//   }

//   async stop(): Promise<void> {
//     try {
//       logger.info('Stopping WagmieB Twitter Bot...');
//       this.isRunning = false;
      
//       if (this.pollingInterval) {
//         clearInterval(this.pollingInterval);
//         this.pollingInterval = null;
//       }
      
//       logger.info('Twitter Bot stopped successfully');
//     } catch (error) {
//       logger.error('Error stopping Twitter Bot:', error);
//     }
//   }

//   private async startPolling(): Promise<void> {
//     let sinceId: string | undefined = undefined;

//     const pollMentions = async () => {
//       if (!this.isRunning) return;

//       try {
//         const mentions = await this.rwClient.v2.userMentionTimeline(this.botUserId, {
//           since_id: sinceId,
//           expansions: ['author_id', 'entities.mentions.username'],
//           'user.fields': ['username', 'name'],
//           max_results: 10,
//         });

//         for (const tweet of mentions.data?.data || []) {
//           if (tweet.author_id) {
//             await this.handleMention(tweet);
//             sinceId = tweet.id;
//           }
//         }
//       } catch (error) {
//         logger.error('Error polling mentions:', error);
//       }
//     };

//     // Poll immediately, then every 60 seconds (instead of 10)
//     await pollMentions();
//     this.pollingInterval = setInterval(pollMentions, 60000);
//   }

//   private async handleMention(tweet: any): Promise<void> {
//     try {
//       const text = tweet.text;
//       const authorId = tweet.author_id;
//       const tweetId = tweet.id;

//       logger.info(`📨 Received mention from user ${authorId}: ${text}`);

//       // Remove bot mention to get user command
//       const userMessage = text.replace(new RegExp(this.botHandle, 'gi'), "").trim();

//       // Simple command processing
//       const response = await this.processCommand(userMessage, authorId);

//       // Reply to the tweet
//       await this.replyToTweet(tweetId, response);

//     } catch (error) {
//       logger.error(`Error handling mention ${tweet.id}:`, error);
      
//       // Send error response
//       const errorMessage = '❌ Sorry, something went wrong. Please try again!';
//       await this.replyToTweet(tweet.id, errorMessage);
//     }
//   }

//   private async processCommand(message: string, userId: string): Promise<string> {
//     const lowerMessage = message.toLowerCase().trim();

//     // Simple command processing
//     if (lowerMessage.includes('help') || lowerMessage === '') {
//       return `🤖 Hi! I'm ${this.botHandle}, your betting market bot!

// Commands:
// • "Create market: Will Bitcoin reach $100k?" - Create a new betting market
// • "Bet 0.1 ETH on Yes for market 123" - Place a bet
// • "What's my balance?" - Check your wallet balance
// • "Show markets" - List active betting markets

// Coming soon: Real betting markets with ETH! 🎲`;
//     }

//     if (lowerMessage.includes('create market') || lowerMessage.includes('new market')) {
//       return `🎲 Market creation coming soon! 

// You said: "${message}"

// I'll be able to create betting markets where users can bet ETH on predictions. Stay tuned! 🚀`;
//     }

//     if (lowerMessage.includes('bet') || lowerMessage.includes('place bet')) {
//       return `💰 Betting functionality coming soon!

// You said: "${message}"

// Users will be able to bet ETH on various outcomes. The system will automatically handle wallet creation and transaction processing. 📈`;
//     }

//     if (lowerMessage.includes('balance') || lowerMessage.includes('wallet')) {
//       return `💳 Wallet functionality coming soon!

// I'll automatically create a wallet for you and show your ETH balance. You'll be able to fund it and place bets on markets. 🔐`;
//     }

//     if (lowerMessage.includes('markets') || lowerMessage.includes('show markets')) {
//       return `📊 Market listing coming soon!

// I'll show you all active betting markets where you can place bets. Each market will have different options and odds. 📋`;
//     }

//     // Default response for unrecognized commands
//     return `🤔 I didn't understand that command. 

// Try saying "help" to see what I can do, or ask me to create a betting market! 🎯`;
//   }

//   private async replyToTweet(tweetId: string, message: string): Promise<void> {
//     try {
//       // Ensure message is within Twitter's character limit
//       const truncatedMessage = message.length > 280 ? message.substring(0, 277) + '...' : message;
      
//       await this.rwClient.v2.reply(truncatedMessage, tweetId);
//       logger.info(`✅ Replied to tweet ${tweetId}: ${truncatedMessage.substring(0, 50)}...`);
//     } catch (error) {
//       logger.error(`Error replying to tweet ${tweetId}:`, error);
//     }
//   }

//   /**
//    * Posts a tweet
//    */
//   async postTweet(message: string): Promise<void> {
//     try {
//       await this.rwClient.v2.tweet(message);
//       logger.info(`Posted tweet: ${message}`);
//     } catch (error) {
//       logger.error('Error posting tweet:', error);
//     }
//   }

//   /**
//    * Gets bot information
//    */
//   async getBotInfo(): Promise<any> {
//     try {
//       const bot = await this.rwClient.v2.user(this.botUserId);
//       return bot.data;
//     } catch (error) {
//       logger.error('Error getting bot info:', error);
//       throw error;
//     }
//   }
// } 