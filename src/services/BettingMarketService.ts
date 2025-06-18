import { logger } from '../utils/logger';
import { DatabaseService } from './DatabaseService';
import { WalletService } from './WalletService';
import { BettingMarket, Bet, BettingIntent } from '../types';
import { formatEther, parseEther } from 'viem';

export class BettingMarketService {
  constructor(
    private databaseService: DatabaseService,
    private walletService: WalletService
  ) {}

  /**
   * Creates a new betting market
   */
  async createMarket(userId: string, params: BettingIntent['params']): Promise<BettingMarket> {
    try {
      logger.info(`Creating betting market for user ${userId}:`, params);

      const { title, description, options, endDate } = params;

      if (!title || !options || options.length < 2) {
        throw new Error('Title and at least 2 options are required');
      }

      // Parse end date
      const parsedEndDate = endDate ? new Date(endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default to 7 days from now

      if (parsedEndDate <= new Date()) {
        throw new Error('End date must be in the future');
      }

      const market: Omit<BettingMarket, 'id' | 'createdAt' | 'updatedAt'> = {
        title,
        description: description || title,
        options,
        endDate: parsedEndDate,
        createdBy: userId,
        totalPool: 0,
        participants: [],
        status: 'active'
      };

      const createdMarket = await this.databaseService.createBettingMarket(market);
      logger.info(`Betting market created successfully: ${createdMarket.id}`);

      return createdMarket;
    } catch (error) {
      logger.error(`Error creating betting market for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Places a bet on a betting market
   */
  async placeBet(userId: string, params: BettingIntent['params']): Promise<Bet> {
    try {
      logger.info(`Placing bet for user ${userId}:`, params);

      const { marketId, option, amount } = params;

      if (!marketId || !option || !amount || amount <= 0) {
        throw new Error('Market ID, option, and valid amount are required');
      }

      // Get the market
      const market = await this.databaseService.getBettingMarket(marketId);
      if (!market) {
        throw new Error('Market not found');
      }

      if (market.status !== 'active') {
        throw new Error('Market is not active');
      }

      if (!market.options.includes(option)) {
        throw new Error('Invalid option for this market');
      }

      // Get user's wallet
      const userWallet = await this.databaseService.getUserWallet(userId);
      if (!userWallet) {
        throw new Error('User wallet not found. Please create a wallet first.');
      }

      // Check user's balance
      const balance = await this.walletService.getWalletBalance(userId);
      const balanceEth = parseFloat(balance);
      
      if (balanceEth < amount) {
        throw new Error(`Insufficient balance. You have ${balanceEth.toFixed(4)} ETH, need ${amount} ETH`);
      }

      // Place the bet in the database
      const bet: Omit<Bet, 'id' | 'createdAt'> = {
        marketId,
        userId,
        option,
        amount
      };

      const placedBet = await this.databaseService.placeBet(bet);

      // Update market total pool and participants
      await this.databaseService.updateBettingMarket(marketId, {
        totalPool: market.totalPool + amount,
        participants: market.participants.includes(userId) 
          ? market.participants 
          : [...market.participants, userId]
      });

      logger.info(`Bet placed successfully: ${placedBet.id}`);
      return placedBet;
    } catch (error) {
      logger.error(`Error placing bet for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Gets user's balance
   */
  async getUserBalance(userId: string): Promise<string> {
    try {
      logger.info(`Getting balance for user ${userId}`);

      const userWallet = await this.databaseService.getUserWallet(userId);
      if (!userWallet) {
        return '0.0'; // No wallet means no balance
      }

      const balance = await this.walletService.getWalletBalance(userId);
      
      logger.info(`User ${userId} balance: ${balance} ETH`);
      return balance;
    } catch (error) {
      logger.error(`Error getting balance for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Gets active betting markets
   */
  async getActiveMarkets(): Promise<BettingMarket[]> {
    try {
      return await this.databaseService.getActiveBettingMarkets();
    } catch (error) {
      logger.error('Error getting active markets:', error);
      throw error;
    }
  }

  /**
   * Gets a specific betting market
   */
  async getMarket(marketId: string): Promise<BettingMarket | null> {
    try {
      return await this.databaseService.getBettingMarket(marketId);
    } catch (error) {
      logger.error(`Error getting market ${marketId}:`, error);
      throw error;
    }
  }

  /**
   * Gets user's betting history
   */
  async getUserBets(userId: string): Promise<Bet[]> {
    try {
      return await this.databaseService.getUserBets(userId);
    } catch (error) {
      logger.error(`Error getting bets for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Resolves a betting market (admin function)
   */
  async resolveMarket(marketId: string, winningOption: string): Promise<BettingMarket | null> {
    try {
      logger.info(`Resolving market ${marketId} with winning option: ${winningOption}`);

      const market = await this.databaseService.getBettingMarket(marketId);
      if (!market) {
        throw new Error('Market not found');
      }

      if (!market.options.includes(winningOption)) {
        throw new Error('Invalid winning option');
      }

      const updatedMarket = await this.databaseService.updateBettingMarket(marketId, {
        status: 'resolved',
        winningOption
      });

      logger.info(`Market ${marketId} resolved successfully`);
      return updatedMarket;
    } catch (error) {
      logger.error(`Error resolving market ${marketId}:`, error);
      throw error;
    }
  }

  /**
   * Processes a betting intent and executes the appropriate action
   */
  async processBettingIntent(userId: string, intent: BettingIntent): Promise<{ success: boolean; result?: any; message: string }> {
    try {
      logger.info(`Processing betting intent for user ${userId}:`, intent);

      switch (intent.action) {
        case 'create_market':
          const market = await this.createMarket(userId, intent.params);
          return {
            success: true,
            result: market,
            message: `🎲 Market created! "${market.title}" is now live. Market ID: ${market.id}`
          };

        case 'place_bet':
          const bet = await this.placeBet(userId, intent.params);
          return {
            success: true,
            result: bet,
            message: `💰 Bet placed! ${intent.params.amount} ETH on "${intent.params.option}" for market ${intent.params.marketId}. Good luck!`
          };

        case 'check_balance':
          const balance = await this.getUserBalance(userId);
          return {
            success: true,
            result: { balance },
            message: `💳 Your balance: ${balance} ETH`
          };

        case 'help':
          return {
            success: true,
            message: `🤖 I can help you create betting markets and place bets!

Examples:
• "Create a market: Will Bitcoin reach $100k by end of year?"
• "Bet 0.1 ETH on Yes for market 12345"
• "What's my balance?"
• "Show active markets"`

          };

        default:
          return {
            success: false,
            message: '❌ Invalid action. Type "help" for available commands.'
          };
      }
    } catch (error) {
      logger.error(`Error processing betting intent for user ${userId}:`, error);
      return {
        success: false,
        message: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
} 