import { TwitterApi } from 'twitter-api-v2';
import { config } from './config/nconf';

async function viewMentions() {
  try {
    console.log('🔍 Fetching mentions for @testbot870359...\n');

    // Initialize Twitter client
    const client = new TwitterApi({
      appKey: config.twitter.apiKey,
      appSecret: config.twitter.apiSecret,
      accessToken: config.twitter.accessToken,
      accessSecret: config.twitter.accessSecret,
    });

    const botUserId = config.twitter.botUserId;

    // Get mentions timeline
    const mentions = await client.v2.userMentionTimeline(botUserId, {
      expansions: ['author_id', 'entities.mentions.username'],
      'user.fields': ['username', 'name'],
      'tweet.fields': ['created_at', 'text'],
      max_results: 10,
    });

    console.log(`📊 Found ${mentions.data?.data?.length || 0} mentions:\n`);

    if (mentions.data?.data && mentions.data.data.length > 0) {
      mentions.data.data.forEach((tweet, index) => {
        const user = mentions.includes?.users?.find(u => u.id === tweet.author_id);
        console.log(`--- Mention ${index + 1} ---`);
        console.log(`👤 User: @${user?.username || 'unknown'} (${user?.name || 'Unknown'})`);
        console.log(`🆔 User ID: ${tweet.author_id}`);
        console.log(`📅 Created: ${tweet.created_at}`);
        console.log(`💬 Tweet: ${tweet.text}`);
        console.log(`🔗 Tweet ID: ${tweet.id}`);
        console.log('');
      });
    } else {
      console.log('❌ No mentions found. Try mentioning @testbot870359 in a tweet!');
    }

    // Also show recent tweets by the bot
    console.log('🤖 Recent tweets by the bot:\n');
    const botTweets = await client.v2.userTimeline(botUserId, {
      'tweet.fields': ['created_at', 'text'],
      max_results: 5,
    });

    if (botTweets.data?.data && botTweets.data.data.length > 0) {
      botTweets.data.data.forEach((tweet, index) => {
        console.log(`--- Bot Tweet ${index + 1} ---`);
        console.log(`📅 Created: ${tweet.created_at}`);
        console.log(`💬 Tweet: ${tweet.text}`);
        console.log(`🔗 Tweet ID: ${tweet.id}`);
        console.log('');
      });
    } else {
      console.log('❌ No recent tweets by the bot found.');
    }

  } catch (error: any) {
    console.error('❌ Error fetching mentions:', error);
    if (error.code === 403) {
      console.log('\n💡 This might be due to API permissions. The bot can read mentions but may not be able to reply.');
    }
  }
}

// Run the function
viewMentions()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed to view mentions');
    process.exit(1);
  }); 