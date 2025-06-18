import { TwitterBot } from './services/TwitterBot';
import { DatabaseService } from './services/DatabaseService';
import { WalletService } from './services/WalletService';
import { OllamaService } from './services/OllamaService';
import { BettingMarketService } from './services/BettingMarketService';
import { logger } from './utils/logger';
import { validateConfig } from './config/nconf';

class App {
  private databaseService: DatabaseService;
  private walletService: WalletService;
  private ollamaService: OllamaService;
  private bettingMarketService: BettingMarketService;
  private twitterBot: TwitterBot;

  constructor() {
    this.databaseService = new DatabaseService();
    this.walletService = new WalletService();
    this.ollamaService = new OllamaService();
    this.bettingMarketService = new BettingMarketService(
      this.databaseService,
      this.walletService
    );
    this.twitterBot = new TwitterBot(
      this.databaseService,
      this.walletService,
      this.ollamaService,
      this.bettingMarketService
    );
  }

  async start() {
    try {
      logger.info('Starting Twitter Bot...');
      
      // Validate configuration
      validateConfig();
      logger.info('Configuration validated successfully');
      
      // Connect to database
      await this.databaseService.connect();
      logger.info('Database connected successfully');

      // Initialize services
      await this.ollamaService.initialize();
      logger.info('Services initialized successfully');

      // Start the Twitter bot
      await this.twitterBot.start();
      logger.info('Twitter Bot started successfully');

    } catch (error) {
      logger.error('Failed to start application:', error);
      process.exit(1);
    }
  }

  async stop() {
    try {
      await this.twitterBot.stop();
      await this.databaseService.disconnect();
      logger.info('Application stopped gracefully');
    } catch (error) {
      logger.error('Error stopping application:', error);
    }
  }
}

// Start the application
const app = new App();
app.start().catch((error) => {
  logger.error('Failed to start application:', error);
  process.exit(1);
}); 