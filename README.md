# Twitter Prediction Market Bot

A scalable, decentralized Twitter bot that creates prediction markets based on user mentions, powered by Ollama for natural language processing and deterministic wallet generation using ethers.js.

## 🚀 Features

- 🤖 **Twitter Integration**: Monitors mentions and responds to user commands
- 🧠 **AI-Powered**: Uses Ollama (local LLM) to understand user intents
- 🔐 **Deterministic Wallets**: Self-contained wallet generation using ethers.js
- 🎲 **Prediction Markets**: Create and participate in prediction markets
- 💸 **ETH Transactions**: Place bets using real ETH on Base network
- 📊 **Market Management**: Track active markets, bets, and user balances
- 🔒 **Self-Contained**: No external wallet dependencies

## 🏗️ Architecture

### Core Components

1. **TwitterBot**: Monitors mentions and processes user commands
2. **WalletService**: Deterministic wallet generation from master seed phrase
3. **OllamaService**: Natural language processing for intent extraction
4. **DatabaseService**: MongoDB persistence for markets and user data
5. **BettingMarketService**: Business logic for prediction markets

### Wallet System

- **Master Wallet**: Single seed phrase controls all user wallets
- **Deterministic Generation**: Each user gets a unique wallet derived from their Twitter ID
- **Self-Contained**: No external wallet services required
- **Base Network**: All transactions on Base (Ethereum L2)

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- MongoDB instance
- Twitter Developer Account
- Ollama installed locally
- Base network ETH for transactions

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd twitter-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Generate master seed phrase**
   ```bash
   npx ts-node src/generate-seed.ts
   ```

4. **Configure the application**
   - Copy the generated seed phrase to `config.json`
   - Add your Twitter API credentials
   - Fund the master wallet with ETH

5. **Start the bot**
   ```bash
   npm run bot
   ```

## ⚙️ Configuration

Update `config.json` with your credentials:

```json
{
  "twitter": {
    "api_key": "your_twitter_api_key",
    "api_secret": "your_twitter_api_secret",
    "access_token": "your_twitter_access_token",
    "access_secret": "your_twitter_access_secret",
    "bot_user_id": "your_bot_user_id"
  },
  "wallet": {
    "master_seed_phrase": "your_generated_seed_phrase",
    "rpc_url": "https://mainnet.base.org",
    "chain_id": 8453
  },
  "ollama": {
    "base_url": "http://localhost:11434",
    "model": "llama3.2:latest"
  },
  "database": {
    "uri": "mongodb://localhost:27017/twitter-bot"
  }
}
```

## 🎯 Usage

### Bot Commands

Users can mention your bot with these commands:

- `@YourBot help` - Show available commands
- `@YourBot create market: Will Bitcoin reach $100k?` - Create prediction market
- `@YourBot bet 0.1 ETH on Yes for market 123` - Place bet
- `@YourBot what's my balance?` - Check wallet balance
- `@YourBot show markets` - List active markets

### Wallet Management

- **Automatic Creation**: Wallets are created automatically when users first interact
- **Deterministic**: Same user always gets the same wallet
- **Funding**: Master wallet can fund user wallets
- **Transactions**: Users can send ETH between wallets

## 🔒 Security

### Wallet Security
- **Master Seed**: Store securely, controls all user wallets
- **Deterministic Paths**: Each user gets unique derivation path
- **Private Keys**: In production, encrypt private keys in memory
- **Environment Variables**: Use env vars for sensitive data

### Best Practices
- Use environment variables for production
- Regularly backup master seed phrase
- Monitor wallet transactions
- Implement rate limiting
- Validate all user inputs

## 🏗️ Project Structure

```
src/
├── services/
│   ├── TwitterBot.ts          # Twitter integration
│   ├── WalletService.ts       # Deterministic wallet management
│   ├── OllamaService.ts       # LLM processing
│   ├── DatabaseService.ts     # Data persistence
│   └── BettingMarketService.ts # Prediction market logic
├── types/                     # TypeScript definitions
├── utils/                     # Utilities and helpers
├── config/                    # Configuration management
└── controllers/               # API controllers
```

## 🚀 Development

### Available Scripts

```bash
npm run bot        # Start the prediction market bot
npm run dev        # Start in development mode
npm run build      # Build for production
npm run test       # Run tests
```

### Testing

```bash
# Run all tests
npm run test

# Test individual services
npx ts-node src/test.ts
```

## 🔧 Troubleshooting

### Common Issues

1. **Wallet Generation Errors**
   - Verify master seed phrase is correct
   - Check Base network connectivity
   - Ensure master wallet has ETH

2. **Twitter API Errors**
   - Verify API credentials
   - Check rate limits
   - Ensure bot has proper permissions

3. **Ollama Connection Issues**
   - Ensure Ollama is running: `ollama serve`
   - Check model availability: `ollama list`
   - Verify OLLAMA_BASE_URL

4. **Database Issues**
   - Verify MongoDB connection
   - Check database permissions
   - Ensure collections exist

## 🔮 Future Enhancements

- **Smart Contracts**: On-chain prediction market contracts
- **Multi-Chain**: Support for multiple networks
- **Advanced Markets**: Complex betting options
- **Analytics**: Market performance tracking
- **API**: REST API for external integrations
- **Mobile App**: Native mobile interface

## 📄 License

MIT License - see LICENSE file for details.

## ⚠️ Disclaimer

This bot is for educational purposes. Ensure compliance with local regulations regarding betting and cryptocurrency transactions. The deterministic wallet system means the master seed phrase controls all user funds - use with caution in production.

---

**Built with ❤️ for the decentralized prediction market ecosystem** 