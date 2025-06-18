import { DatabaseService } from './services/DatabaseService';
import { WalletService } from './services/WalletService';
import { OllamaService } from './services/OllamaService';
import { BettingMarketService } from './services/BettingMarketService';
import { logger } from './utils/logger';

async function debugBot() {
  try {
    console.log('🔍 Debugging Bot Services...\n');

    // Initialize services
    const databaseService = new DatabaseService();
    const walletService = new WalletService();
    const ollamaService = new OllamaService();
    const bettingMarketService = new BettingMarketService(databaseService, walletService);

    console.log('✅ Services initialized');

    // Test database connection
    console.log('\n📊 Testing database connection...');
    await databaseService.connect();
    console.log('✅ Database connected');

    // Test wallet service
    console.log('\n💰 Testing wallet service...');
    await walletService.initialize();
    console.log('✅ Wallet service initialized');

    // Test Ollama service
    console.log('\n🤖 Testing Ollama service...');
    await ollamaService.initialize();
    console.log('✅ Ollama service initialized');

    // Test wallet generation
    console.log('\n🔑 Testing wallet generation...');
    const testUserId = 'test_user_123';
    const wallet = await walletService.generateUserWallet(testUserId);
    console.log(`✅ Wallet generated: ${wallet.address}`);

    // Test balance checking
    console.log('\n💳 Testing balance check...');
    const balance = await walletService.getWalletBalance(testUserId);
    console.log(`✅ Balance: ${balance} ETH`);

    // Test Ollama intent processing
    console.log('\n🧠 Testing Ollama intent processing...');
    const testMessage = 'help';
    const intent = await ollamaService.processTweetForBettingIntent(testMessage);
    console.log('✅ Intent processed:', intent);

    // Test intent validation
    console.log('\n✅ Testing intent validation...');
    const validation = ollamaService.validateIntent(intent);
    console.log('✅ Intent validation:', validation);

    // Test betting market service
    console.log('\n🎲 Testing betting market service...');
    const result = await bettingMarketService.processBettingIntent(testUserId, intent);
    console.log('✅ Betting intent processed:', result);

    console.log('\n🎉 All services working correctly!');
    
    // Cleanup
    await databaseService.disconnect();
    console.log('✅ Database disconnected');

  } catch (error) {
    console.error('❌ Error during debugging:', error);
    process.exit(1);
  }
}

debugBot()
  .then(() => {
    console.log('\n✅ Debug complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Debug failed:', error);
    process.exit(1);
  }); 