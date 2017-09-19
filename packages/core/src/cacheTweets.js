import Twitter from 'twitter'
import S3TweetRepository from './lib/s3TweetRepository'

const slscrypt = require('../node_modules/serverless-crypt/dists/slscrypt')
const tweetRepository = new S3TweetRepository(process.env.TWEET_CACHE_BUCKET_NAME)

const handler = (event, context, callback) => {
  return createTwitterClient(process.env.TWITTER_REST_BASE_URL)
    .then(client => {
      const params = {
        screen_name: 'RealTimeWWII',
        trim_user: true,
        exclude_replies: true,
        include_rts: false,
        count: 200,
        tweet_mode: 'extended'
      }
      return client.get('statuses/user_timeline', params)
    })
    .then(tweets => tweetRepository.saveLatestTweets(tweets))
    .catch(err => callback(err))
}

const createTwitterClient = (twitterRestBaseUrl) => {
  return slscrypt.get('twitter_consumer_key').then(consumerKey => {
    return slscrypt.get('twitter_consumer_secret').then(consumerSecret => {
      return slscrypt.get('twitter_access_token_key').then(accessTokenKey => {
        return slscrypt.get('twitter_access_token_secret').then(accessTokenSecret => {
          return new Twitter({
            consumer_key: consumerKey,
            consumer_secret: consumerSecret,
            access_token_key: accessTokenKey,
            access_token_secret: accessTokenSecret,
            rest_base: twitterRestBaseUrl
          })
        })
      })
    })
  })
}

export {handler}
