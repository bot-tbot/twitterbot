const nconf = require('nconf');
import * as path from 'path';

// Configure nconf to load configuration from multiple sources
nconf
  // Load environment variables first (highest priority)
  .env()
  // Load config.json file
  .file({
    file: path.join(__dirname, '../../config.json')
  })
  // Set defaults
  .defaults({
    twitter: {
      api_key: '',
      api_secret: '',
      access_token: '',
      access_secret: '',
      bot_user_id: ''
    },
    wallet: {
      master_seed_phrase: '',
      rpc_url: 'wss://base-sepolia-rpc.publicnode.comg',
      chain_id: 84532
    },
    ollama: {
      base_url: 'http://localhost:11434',
      model: 'llama3.2:latest'
    },
    database: {
      uri: 'mongodb://localhost:27017/twitter-bot'
    },
    server: {
      port: 3000,
      node_env: 'development'
    },
    logging: {
      level: 'info'
    }
  });

// Helper functions to get configuration values
export const config = {
  // Twitter configuration
  get twitter() {
    return {
      apiKey: nconf.get('twitter:api_key') || nconf.get('TWITTER_API_KEY') || nconf.get('TWITTER_CONSUMER_KEY'),
      apiSecret: nconf.get('twitter:api_secret') || nconf.get('TWITTER_API_SECRET') || nconf.get('TWITTER_CONSUMER_SECRET'),
      accessToken: nconf.get('twitter:access_token') || nconf.get('TWITTER_ACCESS_TOKEN'),
      accessSecret: nconf.get('twitter:access_secret') || nconf.get('TWITTER_ACCESS_SECRET'),
      botUserId: nconf.get('twitter:bot_user_id') || nconf.get('TWITTER_BOT_USER_ID')
    };
  },

  // Wallet configuration
  get wallet() {
    return {
      masterSeedPhrase: nconf.get('wallet:master_seed_phrase') || nconf.get('WALLET_MASTER_SEED_PHRASE'),
      rpcUrl: nconf.get('wallet:rpc_url') || nconf.get('WALLET_RPC_URL'),
      chainId: nconf.get('wallet:chain_id') || nconf.get('WALLET_CHAIN_ID')
    };
  },

  // Ollama configuration
  get ollama() {
    return {
      baseUrl: nconf.get('ollama:base_url') || nconf.get('OLLAMA_BASE_URL') || 'http://localhost:11434',
      model: nconf.get('ollama:model') || nconf.get('OLLAMA_MODEL') || 'llama3.2:latest'
    };
  },

  // Database configuration
  get database() {
    return {
      uri: nconf.get('database:uri') || nconf.get('DATABASE_URI') || 'mongodb://localhost:27017/twitter-bot'
    };
  },

  // Server configuration
  get server() {
    return {
      port: nconf.get('server:port') || nconf.get('PORT') || 3000,
      nodeEnv: nconf.get('server:node_env') || nconf.get('NODE_ENV') || 'development'
    };
  },

  // Logging configuration
  get logging() {
    return {
      level: nconf.get('logging:level') || nconf.get('LOG_LEVEL') || 'info'
    };
  },

  // Get all configuration
  get all() {
    return nconf.get();
  },

  // Set a configuration value
  set(key: string, value: any) {
    nconf.set(key, value);
  },

  // Save configuration to file
  save(callback?: (err: Error | null) => void) {
    nconf.save(callback);
  }
};

// Validate required configuration
export function validateConfig() {
  const required = [
    'twitter:api_key',
    'twitter:api_secret', 
    'twitter:access_token',
    'twitter:access_secret',
    'twitter:bot_user_id',
    'wallet:master_seed_phrase'
  ];

  const missing = required.filter(key => {
    const value = nconf.get(key);
    return !value || value === '';
  });

  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }
}

export default config;
