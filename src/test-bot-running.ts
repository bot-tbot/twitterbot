import { TwitterApi } from 'twitter-api-v2';
import { config } from './config/nconf';

async function testBotRunning() {
  try {
    console.log('🤖 Testing if bot is running and can access Twitter API...\n');

    // Initialize Twitter client
    const client = new TwitterApi({
      appKey: config.twitter.apiKey,
      appSecret: config.twitter.apiSecret,
      accessToken: config.twitter.accessToken,
      accessSecret: config.twitter.accessSecret,
    });

    // Test 1: Get bot info
    console.log('📋 Getting bot info...');
    const me = await client.v2.me();
    console.log(`✅ Bot is accessible: @${me.data.username} (${me.data.id})`);

    // Test 2: Check recent mentions
    console.log('\n🔍 Checking recent mentions...');
    const mentions = await client.v2.userMentionTimeline(me.data.id, {
      max_results: 5,
      'tweet.fields': ['created_at', 'text']
    });

    console.log(`✅ Found ${mentions.data?.data?.length || 0} recent mentions`);
    
    if (mentions.data?.data && mentions.data.data.length > 0) {
      console.log('\n📝 Recent mentions:');
      mentions.data.data.forEach((tweet, index) => {
        console.log(`${index + 1}. ${tweet.text.substring(0, 50)}...`);
      });
    } else {
      console.log('📝 No recent mentions found');
    }

    // Test 3: Check if we can post (without actually posting)
    console.log('\n✍️ Testing write permissions...');
    try {
      // This will test if we have write permissions without actually posting
      const testTweet = await client.v2.tweet('🤖 Bot test tweet - this should fail if permissions are wrong');
      console.log('❌ Unexpected: Tweet was posted successfully (this means permissions are working)');
      console.log(`Tweet ID: ${testTweet.data.id}`);
    } catch (error: any) {
      if (error.code === 403) {
        console.log('❌ Write permissions not configured - need to update Twitter app permissions');
        console.log('💡 Go to Twitter Developer Portal and set app permissions to "Read and Write"');
      } else {
        console.log(`✅ Write permissions test completed (error: ${error.message})`);
      }
    }

    console.log('\n🎉 Bot API access test completed!');
    console.log('\n💡 To see the bot in action:');
    console.log('1. Mention @testbot870359 in a tweet');
    console.log('2. Check the bot logs for processing');
    console.log('3. Run: npx ts-node src/view-mentions.ts to see mentions');

  } catch (error) {
    console.error('❌ Error testing bot:', error);
  }
}

testBotRunning()
  .then(() => {
    console.log('\n✅ Test complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }); 