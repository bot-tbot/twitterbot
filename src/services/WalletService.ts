import { ethers } from 'ethers';
import { logger } from '../utils/logger';
import { config } from '../config/nconf';
import { WalletInfo } from '../types';
import { WalletGenerator } from '../utils/wallet';

export class WalletService {
  private provider: ethers.JsonRpcProvider;
  private walletCache: Map<string, WalletInfo> = new Map();
  private walletGenerator: WalletGenerator;
  private masterWallet: ethers.Wallet;

  constructor() {
    // Initialize provider for Base network
    this.provider = new ethers.JsonRpcProvider(config.wallet.rpcUrl || 'https://mainnet.base.org');
    
    // Initialize wallet generator
    this.walletGenerator = new WalletGenerator();
    
    // Create master wallet from private key in config
    const masterPrivateKey = config.wallet.masterSeedPhrase;
    if (!masterPrivateKey) {
      throw new Error('Master private key must be configured');
    }
    
    this.masterWallet = new ethers.Wallet(masterPrivateKey, this.provider);
    
    logger.info('WalletService initialized with WalletGenerator');
  }

  async initialize(): Promise<void> {
    try {
      logger.info('Initializing WalletService...');
      
      // Test connection by getting master wallet balance
      const balance = await this.provider.getBalance(this.masterWallet.address);
      logger.info(`Master wallet balance: ${ethers.formatEther(balance)} ETH`);
      
      logger.info('WalletService initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize WalletService:', error);
      throw error;
    }
  }

  /**
   * Generates a deterministic wallet for a user based on their Twitter ID
   * @param userId - The Twitter user ID
   * @returns The wallet information
   */
  async generateUserWallet(userId: string): Promise<WalletInfo> {
    try {
      // Check cache first
      if (this.walletCache.has(userId)) {
        return this.walletCache.get(userId)!;
      }

      logger.info(`Generating deterministic wallet for user: ${userId}`);

      // Use WalletGenerator to create deterministic wallet for user
      const walletData = this.walletGenerator.generateAddressForUser(userId);
      
      // Connect wallet to provider
      const userWallet = new ethers.Wallet(walletData.privateKey, this.provider);

      const walletInfo: WalletInfo = {
        userId,
        address: walletData.address,
        privateKey: walletData.privateKey,
        path: walletData.path,
        createdAt: new Date(),
        balance: '0'
      };

      // Cache the wallet
      this.walletCache.set(userId, walletInfo);

      logger.info(`Wallet generated for user ${userId}: ${walletInfo.address}`);
      return walletInfo;
    } catch (error) {
      logger.error(`Error generating wallet for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Gets a user's wallet (generates if doesn't exist)
   * @param userId - The Twitter user ID
   * @returns The wallet information
   */
  async getUserWallet(userId: string): Promise<WalletInfo> {
    try {
      // Check cache first
      if (this.walletCache.has(userId)) {
        const cached = this.walletCache.get(userId)!;
        // Update balance directly from provider to avoid recursion
        const balance = await this.provider.getBalance(cached.address);
        cached.balance = ethers.formatEther(balance);
        return cached;
      }

      // Generate new wallet
      return await this.generateUserWallet(userId);
    } catch (error) {
      logger.error(`Error getting wallet for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Gets the balance of a user's wallet
   * @param userId - The Twitter user ID
   * @returns The balance in ETH as a string
   */
  async getWalletBalance(userId: string): Promise<string> {
    try {
      const wallet = await this.getUserWallet(userId);
      const balance = await this.provider.getBalance(wallet.address);
      const balanceEth = ethers.formatEther(balance);
      
      // Update cache
      if (this.walletCache.has(userId)) {
        this.walletCache.get(userId)!.balance = balanceEth;
      }
      
      logger.info(`Wallet ${userId} balance: ${balanceEth} ETH`);
      return balanceEth;
    } catch (error) {
      logger.error(`Error getting balance for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Sends ETH from user's wallet to another address
   * @param fromUserId - The sender's Twitter user ID
   * @param toAddress - The recipient's address
   * @param amountEth - The amount in ETH
   * @returns The transaction hash
   */
  async sendEth(fromUserId: string, toAddress: string, amountEth: string): Promise<string> {
    try {
      logger.info(`Sending ${amountEth} ETH from user ${fromUserId} to ${toAddress}`);

      const userWallet = await this.getUserWallet(fromUserId);
      const wallet = new ethers.Wallet(userWallet.privateKey, this.provider);

      // Check balance
      const balance = await this.getWalletBalance(fromUserId);
      if (parseFloat(balance) < parseFloat(amountEth)) {
        throw new Error(`Insufficient balance. Have: ${balance} ETH, Need: ${amountEth} ETH`);
      }

      // Create transaction
      const tx = await wallet.sendTransaction({
        to: toAddress,
        value: ethers.parseEther(amountEth)
      });

      logger.info(`Transaction sent: ${tx.hash}`);
      return tx.hash;
    } catch (error) {
      logger.error(`Error sending ETH from user ${fromUserId}:`, error);
      throw error;
    }
  }

  /**
   * Funds a user's wallet from the master wallet
   * @param userId - The Twitter user ID
   * @param amountEth - The amount in ETH to fund
   * @returns The transaction hash
   */
  async fundUserWallet(userId: string, amountEth: string): Promise<string> {
    try {
      logger.info(`Funding user ${userId} with ${amountEth} ETH`);

      const userWallet = await this.getUserWallet(userId);
      
      // Send from master wallet to user wallet
      const tx = await this.masterWallet.sendTransaction({
        to: userWallet.address,
        value: ethers.parseEther(amountEth)
      });

      logger.info(`Funding transaction sent: ${tx.hash}`);
      return tx.hash;
    } catch (error) {
      logger.error(`Error funding user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Gets the master wallet address
   * @returns The master wallet address
   */
  getMasterWalletAddress(): string {
    return this.masterWallet.address;
  }

  /**
   * Gets the master wallet balance
   * @returns The master wallet balance in ETH as a string
   */
  async getMasterWalletBalance(): Promise<string> {
    try {
      const balance = await this.provider.getBalance(this.masterWallet.address);
      const balanceEth = ethers.formatEther(balance);
      logger.info(`Master wallet balance: ${balanceEth} ETH`);
      return balanceEth;
    } catch (error) {
      logger.error('Error getting master wallet balance:', error);
      throw error;
    }
  }

  /**
   * Gets the wallet generator instance (for advanced usage)
   * @returns The WalletGenerator instance
   */
  getWalletGenerator(): WalletGenerator {
    return this.walletGenerator;
  }

  /**
   * Generates a new wallet using the sequential method
   * @returns The wallet information
   */
  generateNextWallet(): { address: string; index: number; path: string; privateKey: string } {
    return this.walletGenerator.generateNextAddress();
  }

  /**
   * Gets the master wallet's mnemonic phrase
   * @returns The mnemonic phrase
   */
  getMasterMnemonic(): string {
    return this.walletGenerator.getMnemonic();
  }
} 