import { ethers } from "ethers";
import { WalletGenerator, TransactionHelper } from "./random";

// Example: How to use generated wallets for transactions
export async function exampleTransactions() {
  console.log("=== Wallet Transaction Examples ===\n");

  // 1. Generate a wallet
  const walletGen = new WalletGenerator();
  const walletInfo = walletGen.generateNextAddress();
  
  console.log("Generated Wallet:");
  console.log(`Address: ${walletInfo.address}`);
  console.log(`Private Key: ${walletInfo.privateKey.substring(0, 10)}...`);
  console.log("");

  // 2. Setup for different networks
  const networks = {
    ethereum: {
      name: "Ethereum Mainnet",
      rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY",
      chainId: 1
    },
    polygon: {
      name: "Polygon (Matic)",
      rpcUrl: "https://polygon-rpc.com",
      chainId: 137
    },
    bsc: {
      name: "Binance Smart Chain",
      rpcUrl: "https://bsc-dataseed.binance.org",
      chainId: 56
    },
    arbitrum: {
      name: "Arbitrum One",
      rpcUrl: "https://arb1.arbitrum.io/rpc",
      chainId: 42161
    },
    optimism: {
      name: "Optimism",
      rpcUrl: "https://mainnet.optimism.io",
      chainId: 10
    }
  };

  // 3. Test connection to each network
  for (const [key, network] of Object.entries(networks)) {
    try {
      console.log(`Testing ${network.name}:`);
      const provider = new ethers.JsonRpcProvider(network.rpcUrl);
      const balance = await provider.getBalance(walletInfo.address);
      console.log(`  Balance: ${ethers.formatEther(balance)} ETH`);
      console.log(`  Chain ID: ${await provider.getNetwork().then(n => n.chainId)}`);
      console.log("");
    } catch (error) {
      console.log(`  Error connecting to ${network.name}: ${error.message}`);
      console.log("");
    }
  }

  // 4. Example transaction helper usage
  console.log("=== Transaction Helper Example ===");
  
  // Note: Replace with actual RPC URL and ensure wallet has funds
  const txHelper = new TransactionHelper(
    walletInfo.privateKey,
    "https://polygon-rpc.com" // Using Polygon as example
  );

  try {
    const balance = await txHelper.getBalance();
    console.log(`Current balance: ${balance} ETH`);
    
    // Example transaction (commented out for safety)
    console.log("\nTo send a transaction, uncomment the following:");
    console.log("// const txHash = await txHelper.sendTransaction(");
    console.log("//   '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', // recipient");
    console.log("//   '0.001' // amount in ETH");
    console.log("// );");
    console.log("// console.log('Transaction hash:', txHash);");
    
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
}

// Example: Batch transaction processing
export async function batchTransactionExample() {
  console.log("=== Batch Transaction Example ===\n");

  const walletGen = new WalletGenerator();
  const recipients = [
    "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "0x1234567890123456789012345678901234567890",
    "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
  ];

  const amounts = ["0.001", "0.002", "0.003"];

  // Generate wallet for this batch
  const walletInfo = walletGen.generateNextAddress();
  const provider = new ethers.JsonRpcProvider("https://polygon-rpc.com");
  const wallet = new ethers.Wallet(walletInfo.privateKey, provider);

  console.log(`Batch sender: ${wallet.address}`);
  console.log(`Recipients: ${recipients.length}`);
  console.log("");

  // Check balance first
  const balance = await provider.getBalance(wallet.address);
  console.log(`Available balance: ${ethers.formatEther(balance)} ETH`);

  // Calculate total needed
  const totalNeeded = amounts.reduce((sum, amount) => 
    sum + parseFloat(amount), 0
  );
  console.log(`Total needed: ${totalNeeded} ETH`);

  if (parseFloat(ethers.formatEther(balance)) < totalNeeded) {
    console.log("Insufficient balance for batch transaction");
    return;
  }

  // Example batch transaction (commented out for safety)
  console.log("\nBatch transaction code (commented for safety):");
  console.log("// for (let i = 0; i < recipients.length; i++) {");
  console.log("//   const tx = await wallet.sendTransaction({");
  console.log("//     to: recipients[i],");
  console.log("//     value: ethers.parseEther(amounts[i])");
  console.log("//   });");
  console.log("//   console.log(`Transaction ${i + 1}: ${tx.hash}`);");
  console.log("//   await tx.wait();");
  console.log("// }");
}

// Example: Smart contract interaction
export async function smartContractExample() {
  console.log("=== Smart Contract Interaction Example ===\n");

  // Example ERC-20 token contract ABI (simplified)
  const erc20Abi = [
    "function balanceOf(address owner) view returns (uint256)",
    "function transfer(address to, uint amount) returns (bool)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)"
  ];

  const walletGen = new WalletGenerator();
  const walletInfo = walletGen.generateNextAddress();
  
  // Example: USDC on Polygon
  const usdcAddress = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
  
  const provider = new ethers.JsonRpcProvider("https://polygon-rpc.com");
  const wallet = new ethers.Wallet(walletInfo.privateKey, provider);
  const contract = new ethers.Contract(usdcAddress, erc20Abi, wallet);

  try {
    console.log(`Wallet: ${wallet.address}`);
    console.log(`USDC Contract: ${usdcAddress}`);
    
    const symbol = await contract.symbol();
    const decimals = await contract.decimals();
    const balance = await contract.balanceOf(wallet.address);
    
    console.log(`Token Symbol: ${symbol}`);
    console.log(`Decimals: ${decimals}`);
    console.log(`Balance: ${ethers.formatUnits(balance, decimals)} ${symbol}`);
    
    console.log("\nTo transfer tokens, uncomment:");
    console.log("// const tx = await contract.transfer(");
    console.log("//   '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', // recipient");
    console.log("//   ethers.parseUnits('10', decimals) // amount");
    console.log("// );");
    console.log("// await tx.wait();");
    
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  exampleTransactions()
    .then(() => batchTransactionExample())
    .then(() => smartContractExample())
    .catch(console.error);
} 