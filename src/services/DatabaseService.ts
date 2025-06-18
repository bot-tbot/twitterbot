import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import { config } from '../config/nconf';
import { UserWallet, BettingMarket, Bet } from '../types';

// User Wallet Schema
const UserWalletSchema = new mongoose.Schema<UserWallet>({
  userId: { type: String, required: true, unique: true },
  walletId: { type: String, required: true },
  address: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Betting Market Schema
const BettingMarketSchema = new mongoose.Schema<BettingMarket>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  options: [{ type: String, required: true }],
  endDate: { type: Date, required: true },
  createdBy: { type: String, required: true },
  totalPool: { type: Number, default: 0 },
  participants: [{ type: String }],
  status: { 
    type: String, 
    enum: ['active', 'closed', 'resolved'], 
    default: 'active' 
  },
  winningOption: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Bet Schema
const BetSchema = new mongoose.Schema<Bet>({
  marketId: { type: String, required: true },
  userId: { type: String, required: true },
  option: { type: String, required: true },
  amount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

export class DatabaseService {
  private UserWalletModel: mongoose.Model<UserWallet>;
  private BettingMarketModel: mongoose.Model<BettingMarket>;
  private BetModel: mongoose.Model<Bet>;

  constructor() {
    this.UserWalletModel = mongoose.model<UserWallet>('UserWallet', UserWalletSchema);
    this.BettingMarketModel = mongoose.model<BettingMarket>('BettingMarket', BettingMarketSchema);
    this.BetModel = mongoose.model<Bet>('Bet', BetSchema);
  }

  async connect(): Promise<void> {
    try {
      const mongoUri = config.database.uri;
      await mongoose.connect(mongoUri);
      logger.info('Connected to MongoDB');
    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      logger.info('Disconnected from MongoDB');
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error);
    }
  }

  // User Wallet Methods
  async saveUserWallet(userId: string, walletId: string, address: string): Promise<UserWallet> {
    try {
      const userWallet = new this.UserWalletModel({
        userId,
        walletId,
        address
      });
      return await userWallet.save();
    } catch (error) {
      logger.error('Error saving user wallet:', error);
      throw error;
    }
  }

  async getUserWallet(userId: string): Promise<UserWallet | null> {
    try {
      return await this.UserWalletModel.findOne({ userId });
    } catch (error) {
      logger.error('Error getting user wallet:', error);
      throw error;
    }
  }

  // Betting Market Methods
  async createBettingMarket(market: Omit<BettingMarket, 'id' | 'createdAt' | 'updatedAt'>): Promise<BettingMarket> {
    try {
      const bettingMarket = new this.BettingMarketModel(market);
      return await bettingMarket.save();
    } catch (error) {
      logger.error('Error creating betting market:', error);
      throw error;
    }
  }

  async getBettingMarket(marketId: string): Promise<BettingMarket | null> {
    try {
      return await this.BettingMarketModel.findById(marketId);
    } catch (error) {
      logger.error('Error getting betting market:', error);
      throw error;
    }
  }

  async getActiveBettingMarkets(): Promise<BettingMarket[]> {
    try {
      return await this.BettingMarketModel.find({ status: 'active' });
    } catch (error) {
      logger.error('Error getting active betting markets:', error);
      throw error;
    }
  }

  async updateBettingMarket(marketId: string, updates: Partial<BettingMarket>): Promise<BettingMarket | null> {
    try {
      return await this.BettingMarketModel.findByIdAndUpdate(
        marketId,
        { ...updates, updatedAt: new Date() },
        { new: true }
      );
    } catch (error) {
      logger.error('Error updating betting market:', error);
      throw error;
    }
  }

  // Bet Methods
  async placeBet(bet: Omit<Bet, 'id' | 'createdAt'>): Promise<Bet> {
    try {
      const newBet = new this.BetModel(bet);
      return await newBet.save();
    } catch (error) {
      logger.error('Error placing bet:', error);
      throw error;
    }
  }

  async getBetsByMarket(marketId: string): Promise<Bet[]> {
    try {
      return await this.BetModel.find({ marketId });
    } catch (error) {
      logger.error('Error getting bets by market:', error);
      throw error;
    }
  }

  async getUserBets(userId: string): Promise<Bet[]> {
    try {
      return await this.BetModel.find({ userId });
    } catch (error) {
      logger.error('Error getting user bets:', error);
      throw error;
    }
  }
} 