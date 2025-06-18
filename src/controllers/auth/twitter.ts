import Cryptos from 'crypto';

import axios from 'axios';
const nconf = require('nconf');
import OAuth from 'oauth-1.0a';
import { Request, Response } from 'express';

import { Users } from '../../database/user';
import { verifyToken } from '../../utils';
import { BadRequestError, NotAuthorizedError, InternalServerError } from '../../controllers/errors';
import { AuthenticatedRequest } from '../../middlewares/authenticate';
import config from '../../config/nconf';

/**
 * Twitter login controller
 * @param req - The request object
 * @param res - The response object
 * @returns The redirect URL for the Twitter login page
 */
interface TwitterConfig {
  consumerKey: string;
  consumerSecret: string;
  callbackUrl: string;
}

interface TwitterUser {
  id: string;
  username: string;
  created_at?: string;
  profile_image_url?: string;
  public_metrics?: {
    followers_count?: number;
    tweet_count?: number;
  };
}

// Twitter API credentials
const twitterConfig: TwitterConfig = {
  consumerKey: config.twitter.apiKey,
  consumerSecret: config.twitter.apiSecret,
  callbackUrl: nconf.get('TWITTER_CALLBACK_URL') || 'http://localhost:3000/auth/twitter/callback',
};

// OAuth 1.0a Setup
const oauth = new OAuth({
  consumer: {
    key: twitterConfig.consumerKey,
    secret: twitterConfig.consumerSecret,
  },
  signature_method: 'HMAC-SHA1',
  hash_function(baseString: string, key: string) {
    return Cryptos.createHmac('sha1', key).update(baseString).digest('base64');
  },
});

// Step 1: Request Twitter OAuth Request Token
export const requestTwitterToken = async (req: Request, res: Response) => {
  const requestTokenURL = 'https://api.twitter.com/oauth/request_token';
  const jwtToken = req.query.token as string;

  if (!jwtToken) {
    throw new BadRequestError('No JWT token provided');
  }

  const authHeader = oauth.toHeader(oauth.authorize({ url: requestTokenURL, method: 'POST' }));

  try {
    const response = await axios.post(requestTokenURL, null, {
      headers: {
        ...authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const params = new URLSearchParams(response.data);
    const oauthToken = params.get('oauth_token');
    
    // Store the JWT token in a temporary way (you might want to use Redis or similar for production)
    // For now, we'll pass it as a state parameter
    res.redirect(`https://api.twitter.com/oauth/authenticate?oauth_token=${oauthToken}&state=${jwtToken}`);
  } catch (error) {
    throw new InternalServerError('Failed to request Twitter token', error);
  }
};

// Step 2: Handle Twitter OAuth Callback
export const handleTwitterCallback = async (req: Request, res: Response) => {
  const { oauth_token, oauth_verifier, state } = req.query;
  const accessTokenURL = 'https://api.twitter.com/oauth/access_token';

  if (typeof oauth_token !== 'string' || typeof oauth_verifier !== 'string') {
    throw new BadRequestError('Invalid OAuth parameters');
  }

  const jwtToken = state as string;
  if (!jwtToken) {
    throw new BadRequestError('No JWT token provided');
  }

  const authHeader = oauth.toHeader(oauth.authorize({ url: accessTokenURL, method: 'POST' }));

  try {
    const response = await axios.post(
      accessTokenURL,
      new URLSearchParams({ oauth_token, oauth_verifier }).toString(),
      {
        headers: {
          ...authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const params = new URLSearchParams(response.data);

    const userId = params.get('user_id');
    const screenName = params.get('screen_name');

    // Verify JWT token
    const decoded = verifyToken(jwtToken, nconf.get('SECRET_KEY')) as { userId: string };

    // Update user in database
    const user = await Users.findOne({ _id: decoded.userId });
    if (!user) {
      throw new NotAuthorizedError('User not found');
    }
    user.twitterId = userId || '';
    user.twitterScreenName = screenName || '';
    user.twitterVerified = true;

    await user.save();

    return res.redirect(`${nconf.get('FRONTEND_URL') || 'http://localhost:3000'}/auth/twitter/callback`);
  } catch (error) {
    throw new InternalServerError('Failed to handle Twitter callback', error);
  }
};

// Step 3: Fetch User Profile (Optional)
export const fetchUserProfile = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw new NotAuthorizedError('Not authenticated');
  }

  // For now, we'll use the bot's credentials to fetch user profile
  // In a real implementation, you'd store user access tokens
  const url = 'https://api.twitter.com/2/users/me';

  const authHeader = oauth.toHeader(
    oauth.authorize({ url, method: 'GET' }, { 
      key: config.twitter.accessToken, 
      secret: config.twitter.accessSecret 
    })
  );

  try {
    const response = await axios.get(url, {
      headers: { ...authHeader },
    });

    res.json(response.data);
  } catch (error) {
    throw new InternalServerError('Failed to fetch user profile', error);
  }
};

// Logout
export const logout = (req: Request, res: Response) => {
  res.send('Logged out');
};
