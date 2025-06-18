import { OllamaService } from './services/OllamaService';
import { logger } from './utils/logger';

async function testOllama() {
  try {
    console.log('🧪 Testing Ollama Service...');
    
    const ollamaService = new OllamaService();
    
    // Initialize
    await ollamaService.initialize();
    console.log('✅ Ollama service initialized');
    
    // Test with a simple message
    const testMessage = 'will tommorow rain n=in new york ';
    console.log(`📝 Testing with message: "${testMessage}"`);
    
    const intent = await ollamaService.processTweetForBettingIntent(testMessage);
    console.log('✅ Intent result:', intent);
    
  } catch (error) {
    console.error('❌ Error testing Ollama:', error);
  }
}

testOllama(); 