// Twitter Types
export interface TwitterMention {
  id: string;
  text: string;
  author_id: string;
  entities?: {
    mentions?: Array<{
      start: number;
      end: number;
      username: string;
    }>;
  };
}

export interface TwitterUser {
  id: string;
  username: string;
  name: string;
}

export interface ProcessedTweet {
  text: string;
  authorId: string;
  tweetId: string;
  mentions: Array<{
    username: string;
    userId?: string;
    isBot: boolean;
  }>;
}

// Wallet Types
export interface WalletInfo {
  userId: string;
  address: string;
  privateKey: string;
  path: string;
  createdAt: Date;
  balance: string;
}

// Ollama Types
export interface OllamaRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;
  };
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_duration?: number;
  eval_duration?: number;
}

// Betting Market Types
export interface BettingMarket {
  id: string;
  title: string;
  description: string;
  options: string[];
  endDate: Date;
  createdBy: string;
  totalPool: number;
  participants: string[];
  status: 'active' | 'closed' | 'resolved';
  winningOption?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BettingIntent {
  action: 'create_market' | 'place_bet' | 'check_balance' | 'help';
  params: {
    title?: string;
    description?: string;
    options?: string[];
    endDate?: string;
    amount?: number;
    option?: string;
    marketId?: string;
  };
}

// Database Types
export interface UserWallet {
  userId: string;
  walletId: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Bet {
  id: string;
  marketId: string;
  userId: string;
  option: string;
  amount: number;
  createdAt: Date;
} 