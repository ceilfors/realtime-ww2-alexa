import Twitter from 'twitter'
import S3TweetRepository from './lib/s3-tweet-repository'
import SsmSecretsStore from './lib/ssm-secrets-store'
import bunyan from 'bunyan'
const log = bunyan.createLogger({name: 'cached-twitter-service'})

const tweetRepository = new S3TweetRepository(process.env.TWEET_CACHE_BUCKET_NAME)
const secretsStore = new SsmSecretsStore(process.env.TWITTER_SECRETS_PATH)
const twitterRestBaseUrl = process.env.TWITTER_REST_BASE_URL

const params = {
  user_id: process.env.TWITTER_USER_ID,
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
    log.error(err)
    callback(err)
  }
}

const createTwitterClient = async (twitterRestBaseUrl) => {
  const secrets = await secretsStore.getSecrets([
    'consumer-key',
    'consumer-secret',
    'access-token-key',
    'access-token-secret'
  ])
  return new Twitter({
    consumer_key: secrets['consumer-key'],
    consumer_secret: secrets['consumer-secret'],
    access_token_key: secrets['access-token-key'],
    access_token_secret: secrets['access-token-secret'],
    rest_base: twitterRestBaseUrl
  })
}

export {handler}
