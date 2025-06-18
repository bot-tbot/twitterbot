import { TwitterBot } from './services/TwitterBot';
import { DatabaseService } from './services/DatabaseService';
import { WalletService } from './services/WalletService';
import { OllamaService } from './services/OllamaService';
import { BettingMarketService } from './services/BettingMarketService';
import { logger } from './utils/logger';
import { validateConfig } from './config/nconf';

async function runBot() {
  logger.info('🚀 Starting Twitter Betting Bot...');

  try {
    // Validate configuration
    validateConfig();
    logger.info('✅ Configuration validated successfully');

    // Initialize services
    const databaseService = new DatabaseService();
    const walletService = new WalletService();
    const ollamaService = new OllamaService();
    const bettingMarketService = new BettingMarketService(databaseService, walletService);
    
    const twitterBot = new TwitterBot(
      databaseService,
      walletService,
      ollamaService,
      bettingMarketService
    );

    // Connect to database
    await databaseService.connect();
    logger.info('✅ Database connected successfully');

    // Initialize services
    await walletService.initialize();
    await ollamaService.initialize();
    logger.info('✅ Services initialized successfully');

    // Start the Twitter bot
    await twitterBot.start();
    logger.info('✅ Twitter Bot started successfully');

    // Keep the process running
    // process.on('SIGINT', async () => {
    //   logger.info('🛑 Received SIGINT, shutting down gracefully...');
    //   // await twitterBot.stop();
    //   await databaseService.disconnect();
    //   process.exit(0);
    // });

    // process.on('SIGTERM', async () => {
    //   logger.info('🛑 Received SIGTERM, shutting down gracefully...');
    //   await twitterBot.stop();
    //   await databaseService.disconnect();
    //   process.exit(0);
    // });

  } catch (error) {
    logger.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
}

// Start the bot
runBot(); 