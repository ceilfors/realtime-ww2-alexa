const Twitter = require('twitter')
const moment = require('moment')

export default class TwitterRealtimeWw2 {
  constructor (oAuth1, restBaseUrl, screenName) {
    this.client = new Twitter({
      consumer_key: oAuth1.consumerKey,
      consumer_secret: oAuth1.consumerSecret,
      access_token_key: oAuth1.accessTokenKey,
      access_token_secret: oAuth1.accessTokenSecret,
      rest_base: restBaseUrl
    })
    this.screenName = screenName
  }

  getLatestNews () {
    const params = {screen_name: this.screenName, count: 1, tweet_mode: 'extended'}
    return this.client.get('statuses/user_timeline', params)
      .then(tweets => {
        const firstTweet = tweets[0]
        const datetime = moment(firstTweet.created_at, 'dd MMM DD HH:mm:ss ZZ YYYY', 'en')
        return {
          datetime: datetime.utc().format(),
          content: firstTweet.full_text.replace(new RegExp('\\s*https://t.co.*$'), '')
        }
      })
  }
}
