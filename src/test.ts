import dotenv from 'dotenv';
import { DatabaseService } from './services/DatabaseService';
// import { PrivyService } from './PrivyService';
// import { OllamaService } from './OllamaService';
// import { BettingMarketService } from './BettingMarketService';
import { logger } from './utils/logger';
import { OllamaService } from './services/OllamaService';
import { WalletService } from './services/WalletService';
import { BettingMarketService } from './services/BettingMarketService';

// Load environment variables
dotenv.config();

async function runTests() {
  logger.info('Starting service tests...');

  try {
    // Test Database Service
    logger.info('Testing Database Service...');
    const dbService = new DatabaseService();
    await dbService.connect();
    logger.info('✅ Database connection successful');

    // Test Ollama Service
    logger.info('Testing Ollama Service...');
    const ollamaService = new OllamaService();
    await ollamaService.initialize();
    
    // Test intent extraction
    const testTweet = "Create a market: Will Bitcoin reach $100k by end of year?";
    const intent = await ollamaService.processTweetForBettingIntent(testTweet);
    logger.info('✅ Ollama intent extraction successful:', intent);

    // Test Wallet Service
    logger.info('Testing Wallet Service...');
    const walletService = new WalletService();
    await walletService.initialize();
    logger.info('✅ Wallet service initialization successful');

    // Test Betting Market Service
    logger.info('Testing Betting Market Service...');
    const bettingService = new BettingMarketService(dbService, walletService);
    logger.info('✅ Betting Market Service initialization successful');

    // Test complete flow
    logger.info('Testing complete flow...');
    const testIntent = {
      action: 'help' as const,
      params: {}
    };
    const result = await bettingService.processBettingIntent('test_user_123', testIntent);
    logger.info('✅ Complete flow test successful:', result);

    logger.info('🎉 All tests passed!');

  } catch (error) {
    logger.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    // Cleanup
    const dbService = new DatabaseService();
    await dbService.disconnect();
    process.exit(0);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
} 