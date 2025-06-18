import { ethers } from "ethers";
import * as bip39 from "bip39";
import * as bip32 from "bip32";
import * as ecc from "tiny-secp256k1";

export class WalletGenerator {
  private mnemonic: string;
  private hdRoot: bip32.BIP32Interface;
  private currentIndex: number;
  private readonly pathPrefix: string;

  constructor(mnemonic?: string, startIndex = 0, pathPrefix = "m/44'/60'/0'/0/") {
    this.mnemonic = mnemonic || bip39.generateMnemonic();
    const seed = bip39.mnemonicToSeedSync(this.mnemonic);
    this.hdRoot = bip32.BIP32Factory(ecc).fromSeed(seed);
    this.currentIndex = startIndex;
    this.pathPrefix = pathPrefix;
  }

  public getMnemonic(): string {
    return this.mnemonic;
  }

  public generateNextAddress(): { address: string; index: number; path: string; privateKey: string } {
    const path = `${this.pathPrefix}${this.currentIndex}`;
    const childNode = this.hdRoot.derivePath(path);
    const privateKeyBuffer = childNode.privateKey!;
    const privateKey = Buffer.from(privateKeyBuffer).toString('hex');
    const wallet = new ethers.Wallet(privateKey);
    const result = {
      address: wallet.address,
      index: this.currentIndex,
      path: path,
      privateKey: privateKey
    };
    this.currentIndex++;
    return result;
  }

  public generateAddressForUser(userId: string): { address: string; index: number; path: string; privateKey: string } {
    // Create a deterministic index based on user ID
    const userIndex = this.hashUserId(userId);
    const path = `${this.pathPrefix}${userIndex}`;
    const childNode = this.hdRoot.derivePath(path);
    const privateKeyBuffer = childNode.privateKey!;
    const privateKey = Buffer.from(privateKeyBuffer).toString('hex');
    const wallet = new ethers.Wallet(privateKey);
    
    return {
      address: wallet.address,
      index: userIndex,
      path: path,
      privateKey: privateKey
    };
  }

  private hashUserId(userId: string): number {
    // Simple hash function - in production, use a more robust method
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

export class TransactionHelper {
  private wallet: ethers.Wallet;
  private provider: ethers.Provider;
  
  constructor(privateKey: string, rpcUrl: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
  }
  
  async getBalance(): Promise<string> {
    const balance = await this.provider.getBalance(this.wallet.address);
    return ethers.formatEther(balance);
  }
  
  async sendTransaction(to: string, amount: string): Promise<string> {
    const tx = await this.wallet.sendTransaction({
      to: to,
      value: ethers.parseEther(amount)
    });
    
    console.log(`Transaction sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Transaction confirmed in block: ${receipt?.blockNumber}`);
    
    return tx.hash;
  }
  
  async getTransactionHistory(): Promise<any[]> {
    // This would require additional API calls to get transaction history
    // Implementation depends on the specific blockchain explorer API
    console.log("Transaction history requires blockchain explorer API integration");
    return [];
  }
} 