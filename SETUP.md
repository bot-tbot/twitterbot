# WagmieB Twitter Bot Setup

This is a simple Twitter bot that responds to mentions of "@WagmieB" with betting market functionality.

## Quick Setup

1. **Update config.json** with your Twitter API credentials:
   ```json
   {
     "twitter": {
       "api_key": "your_twitter_consumer_key",
       "api_secret": "your_twitter_consumer_secret", 
       "access_token": "your_twitter_access_token",
       "access_secret": "your_twitter_access_secret",
       "bot_user_id": "your_bot_user_id"
     }
   }
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the simple bot**:
   ```bash
   npm run simple-bot
   ```

## Getting Twitter API Credentials

1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app or use your existing app
3. Get the following credentials:
   - Consumer Key (API Key)
   - Consumer Secret (API Secret)
   - Access Token
   - Access Token Secret
   - Bot User ID (your bot's Twitter user ID)

## Bot Commands

Users can mention "@WagmieB" with these commands:

- `@WagmieB help` - Show available commands
- `@WagmieB create market: Will Bitcoin reach $100k?` - Create betting market (coming soon)
- `@WagmieB bet 0.1 ETH on Yes for market 123` - Place bet (coming soon)
- `@WagmieB what's my balance?` - Check wallet balance (coming soon)
- `@WagmieB show markets` - List active markets (coming soon)

## Current Status

The bot currently responds with "coming soon" messages for betting functionality. The core Twitter integration is working and ready for the betting features to be added.

## Troubleshooting

- Make sure all Twitter API credentials are correct in `config.json`
- Check that your bot has the necessary permissions (read/write access)
- Ensure the bot user ID is correct
- Check the logs for any error messages

## Next Steps

Once the basic Twitter bot is working, we can add:
1. Ollama integration for natural language processing
2. Privy wallet integration for ETH transactions
3. Database storage for betting markets
4. Full betting market functionality 