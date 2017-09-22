const moment = require('moment')

export default class TwitterRealtimeWw2 {
  constructor (twitterService) {
    this.twitterService = twitterService
  }

  getLatestNews () {
    return this.twitterService.getLatestTweets()
      .then(tweets => {
        const firstTweet = tweets[0]
        return {
          datetime: this._parseTweetDatetime(firstTweet),
          content: firstTweet.full_text.replace(new RegExp('\\s*https://t.co.*$'), '')
        }
      })
  }

  _parseTweetDatetime (tweet) {
    const datetime = moment(tweet.created_at, 'dd MMM DD HH:mm:ss ZZ YYYY', 'en')
    datetime.set('year', datetime.get('year') - 78)
    return datetime.utc().format()
  }
}
