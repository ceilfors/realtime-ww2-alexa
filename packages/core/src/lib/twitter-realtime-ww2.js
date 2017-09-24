import moment from 'moment'

export default class TwitterRealtimeWw2 {
  constructor (twitterService) {
    this.twitterService = twitterService
  }

  async getLatestNews () {
    const latestTweets = await this.twitterService.getLatestTweets()
    const firstTweet = latestTweets[0]
    return {
      datetime: this._parseTweetDatetime(firstTweet),
      content: firstTweet.full_text.replace(new RegExp('\\s*https://t.co.*$'), '')
    }
  }

  async getRecentEvents (durationHour, clock) {
    const latestTweets = await this.twitterService.getLatestTweets()
    return latestTweets
      .filter(tweet => {
        const now = moment(clock)
        const minimumDateTime = now.clone().subtract(durationHour, 'hours')
        const tweetDateTime = moment(tweet.created_at, 'dd MMM DD HH:mm:ss ZZ YYYY', 'en')
        return tweetDateTime.diff(minimumDateTime) >= 0 && tweetDateTime.diff(now) <= 0
      })
      .map(tweet => ({
        datetime: this._parseTweetDatetime(tweet),
        content: tweet.full_text.replace(new RegExp('\\s*https://t.co.*$'), '')
      }))
      .sort((t1, t2) => moment(t1.datetime).diff(moment(t2.datetime)))
  }

  _parseTweetDatetime (tweet) {
    const datetime = moment(tweet.created_at, 'dd MMM DD HH:mm:ss ZZ YYYY', 'en')
    datetime.set('year', datetime.get('year') - 78)
    return datetime.utc().format()
  }
}
