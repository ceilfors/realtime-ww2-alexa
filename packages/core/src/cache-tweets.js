import Twitter from 'twitter'
import S3TweetRepository from './lib/s3-tweet-repository'
import slscrypt from '../../../node_modules/serverless-crypt/dists/slscrypt'
import bunyan from 'bunyan'
const log = bunyan.createLogger({name: 'cached-twitter-service'})

const tweetRepository = new S3TweetRepository(process.env.TWEET_CACHE_BUCKET_NAME)
const twitterRestBaseUrl = process.env.TWITTER_REST_BASE_URL

const params = {
  screen_name: 'RealTimeWWII',
  trim_user: true,
  exclude_replies: true,
  include_rts: false,
  count: 200,
  tweet_mode: 'extended'
}

const getTweetsStat = tweets => {
  const totalTweets = tweets.length
  const firstTweet = tweets[0] || {id: 'n/a'}
  const lastTweet = tweets[tweets.length - 1] || {id: 'n/a'}

  return {
    totalTweets,
    firstTweet: { id: firstTweet.id, created_at: firstTweet.created_at },
    lastTweet: { id: lastTweet.id, created_at: lastTweet.created_at }
  }
}

const handler = async (event, context, callback) => {
  try {
    const client = await createTwitterClient(twitterRestBaseUrl)
    log.info({twitterRestBaseUrl, params}, 'Hitting Twitter API to get statuses/user_timeline.json resource ...')
    const tweets = await client.get('statuses/user_timeline', params)
    const tweetsStat = getTweetsStat(tweets)
    if (tweetsStat.totalTweets === 0) {
      log.warn('0 tweets were returned from Twitter')
    }
    log.info(tweetsStat, 'Saving tweets to tweetRepository ...')
    await tweetRepository.saveLatestTweets(tweets)
  } catch (err) {
    callback(err)
  }
}

const createTwitterClient = async (twitterRestBaseUrl) => {
  return new Twitter({
    consumer_key: await slscrypt.get('twitter_consumer_key'),
    consumer_secret: await slscrypt.get('twitter_consumer_secret'),
    access_token_key: await slscrypt.get('twitter_access_token_key'),
    access_token_secret: await slscrypt.get('twitter_access_token_secret'),
    rest_base: twitterRestBaseUrl
  })
}

export {handler}
