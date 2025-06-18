import { TwitterApi } from 'twitter-api-v2';
import { config } from './config/nconf';

async function getBotUserId() {
  try {
    console.log('🔍 Fetching Twitter Bot User ID...\n');

    // Initialize Twitter client
    const client = new TwitterApi({
      appKey: config.twitter.apiKey,
      appSecret: config.twitter.apiSecret,
      accessToken: config.twitter.accessToken,
      accessSecret: config.twitter.accessSecret,
    });

    // Get the authenticated user's information
    const me = await client.v2.me();
    
    console.log('✅ Bot Information:');
    console.log(`User ID: ${me.data.id}`);
    console.log(`Username: @${me.data.username}`);
    console.log(`Name: ${me.data.name}`);
    console.log(`Description: ${me.data.description || 'No description'}`);
    console.log(`Followers Count: ${me.data.public_metrics?.followers_count || 'N/A'}`);
    console.log(`Following Count: ${me.data.public_metrics?.following_count || 'N/A'}`);
    console.log(`Tweet Count: ${me.data.public_metrics?.tweet_count || 'N/A'}`);
    
    console.log('\n📋 Update your config.json with:');
    console.log(`"bot_user_id": "${me.data.id}"`);
    
    return me.data.id;
  } catch (error) {
    console.error('❌ Error fetching bot user ID:', error);
    throw error;
  }
}

// Run the function
getBotUserId()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed to get bot user ID');
    process.exit(1);
  }); 