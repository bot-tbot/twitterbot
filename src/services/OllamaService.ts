import axios from 'axios';
import { logger } from '../utils/logger';
import { config } from '../config/nconf';
import { OllamaRequest, OllamaResponse, BettingIntent } from '../types';

export class OllamaService {
  private baseUrl: string;
  private model: string;

  constructor() {
    this.baseUrl = config.ollama.baseUrl;
    this.model = config.ollama.model;
  }

  async initialize(): Promise<void> {
    try {
      logger.info('Initializing Ollama service...');
      
      // Test the connection to Ollama
      const response = await axios.get(`${this.baseUrl}/api/tags`);
      logger.info(`Ollama service initialized successfully. Available models: ${response.data.models?.map((m: any) => m.name).join(', ')}`);
    } catch (error) {
      logger.error('Failed to initialize Ollama service:', error);
      throw new Error('Ollama service is not available. Make sure Ollama is running locally.');
    }
  }

  /**
   * Sends a request to Ollama and returns the response (handles streaming JSONL)
   */
  async query(request: OllamaRequest): Promise<OllamaResponse> {
    const readline = require('readline');
    try {
      logger.info('Sending request to Ollama (streaming)...', { model: request.model, promptLength: request.prompt.length });
      const response = await axios.post(`${this.baseUrl}/api/generate`, request, { responseType: 'stream' });
      logger.info('Ollama API response status:', response.status);
      
      let fullResponse = '';
      let lastObj: any = null;
      const rl = readline.createInterface({ input: response.data, crlfDelay: Infinity });
      for await (const line of rl) {
        if (!line.trim()) continue;
        try {
          const obj = JSON.parse(line);
          lastObj = obj;
          if (typeof obj.response === 'string') {
            fullResponse += obj.response;
          }
        } catch (err) {
          logger.error('Error parsing Ollama stream line:', line);
        }
      }
      logger.info('Ollama full concatenated response:', fullResponse);
      if (!lastObj) {
        throw new Error('No valid JSON objects received from Ollama');
      }
      // Return in the expected OllamaResponse format
      return {
        ...lastObj,
        response: fullResponse
      };
    } catch (error) {
      logger.error('Error querying Ollama (stream):', error);
      if (axios.isAxiosError && axios.isAxiosError(error)) {
        logger.error('Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
      }
      throw error;
    }
  }

  /**
   * Processes a tweet and extracts betting intent using Ollama
   */
  async processTweetForBettingIntent(tweetText: string): Promise<BettingIntent> {
    try {
      logger.info(`Processing tweet for betting intent: ${tweetText}`);

      const prompt = `
You are a betting market bot that analyzes tweets to understand user intentions for creating betting markets or placing bets.

Analyze the following tweet and extract the betting intent:

Tweet: "${tweetText}"

Instructions:
1. Determine if the user wants to create a betting market, place a bet, check balance, or needs help
2. Extract relevant parameters like title, description, options, amount, etc.
3. Return a JSON response in the following format:
{
  "action": "create_market" | "place_bet" | "check_balance" | "help",
  "params": {
    "title": "string (for create_market)",
    "description": "string (for create_market)",
    "options": ["option1", "option2"] (for create_market),
    "endDate": "YYYY-MM-DD" (for create_market),
    "amount": number (for place_bet),
    "option": "string" (for place_bet),
    "marketId": "string" (for place_bet)
  }
}
Examples:
- "Create a market: Will Bitcoin reach $100k by end of year?" → create_market with title and options
    {
      "action": "create_market",
      "params": {
        "title": "Bitcoin Price Prediction",
        "description": "Will Bitcoin reach $100k by end of year?",
        "options": ["Yes", "No"],
        "endDate": "2025-12-31"
      }
    }
- "Bet 0.1 ETH on option A for market 123" → place_bet with amount, option, marketId
    {
      "action": "place_bet",
      "params": {
        "amount": 0.1,
        "option": "A",
        "marketId": "123"
      }
    }
- "What's my balance?" → check_balance
    {
      "action": "check_balance"
    }
- "How do I create a market?" → help
    {
      "action": "help"
    }

Return only the JSON response, no additional text.
`;

      const request: OllamaRequest = {
        model: this.model,
        prompt,
        options: {
          temperature: 0.1, // Low temperature for more consistent responses
          top_p: 0.9,
          num_predict: 500
        }
      };

      const response = await this.query(request);
      logger.info('Raw Ollama response:', response.response);
      
      // Check if response exists
      if (!response || !response.response) {
        logger.error('No response from Ollama:', response);
        return {
          action: 'help',
          params: {}
        };
      }
      
      // Parse the response to extract JSON
      const jsonMatch = response.response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.warn('No JSON found in Ollama response:', response.response);
        return {
          action: 'help',
          params: {}
        };
      }

      const intent: BettingIntent = JSON.parse(jsonMatch[0]);
      logger.info(`Extracted betting intent: ${intent.action}`, intent.params);
      
      return intent;
    } catch (error) {
      logger.error('Error processing tweet for betting intent:', error);
      return {
        action: 'help',
        params: {}
      };
    }
  }

  /**
   * Generates a response message for the user based on the action taken
   */
  async generateResponseMessage(action: string, params: any, result?: any): Promise<string> {
    try {
      const prompt = `
You are a helpful betting market bot. Generate a friendly, concise response to the user based on the action taken.

Action: ${action}
Parameters: ${JSON.stringify(params)}
Result: ${result ? JSON.stringify(result) : 'N/A'}

Generate a response that:
1. Confirms the action was completed
2. Provides relevant details (market ID, transaction hash, etc.)
3. Is friendly and encouraging
4. Keeps it under 280 characters for Twitter

Examples:
- For market creation: "🎲 Market created! 'Will Bitcoin reach $100k?' is now live. Market ID: 12345"
- For bet placement: "💰 Bet placed! 0.1 ETH on 'Yes' for market 12345. Good luck!"
- For balance check: "💳 Your balance: 1.5 ETH"
- For help: "🤖 I can help you create betting markets and place bets! Try: 'Create a market: Will ETH reach $5000?'"

Return only the response message, no additional text.
`;

      const request: OllamaRequest = {
        model: this.model,
        prompt,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          num_predict: 200
        }
      };

      const response = await this.query(request);
      return response.response.trim();
    } catch (error) {
      logger.error('Error generating response message:', error);
      return 'Sorry, something went wrong. Please try again!';
    }
  }

  /**
   * Validates if the extracted intent is valid
   */
  validateIntent(intent: BettingIntent): { isValid: boolean; error?: string } {
    switch (intent.action) {
      case 'create_market':
        if (!intent.params.title) {
          return { isValid: false, error: 'Market title is required' };
        }
        if (!intent.params.options || intent.params.options.length < 2) {
          return { isValid: false, error: 'At least 2 options are required' };
        }
        break;
      
      case 'place_bet':
        if (!intent.params.amount || intent.params.amount <= 0) {
          return { isValid: false, error: 'Valid bet amount is required' };
        }
        if (!intent.params.option) {
          return { isValid: false, error: 'Bet option is required' };
        }
        if (!intent.params.marketId) {
          return { isValid: false, error: 'Market ID is required' };
        }
        break;
      
      case 'check_balance':
      case 'help':
        // These actions don't require additional validation
        break;
      
      default:
        return { isValid: false, error: 'Invalid action' };
    }

    return { isValid: true };
  }
} 