import moment from 'moment'

const getCreatedDateTimeFromTweet = (tweet) => moment(tweet.created_at, 'dd MMM DD HH:mm:ss ZZ YYYY', 'en')

const getEventDateTime = (tweet) => {
  const dateTime = getCreatedDateTimeFromTweet(tweet)
  dateTime.set('year', dateTime.get('year') - 78)
  return dateTime.utc().format()
}

const convertTweetToEvent = (tweet) => {
  return {
    datetime: getEventDateTime(tweet),
    content: tweet.full_text.replace(new RegExp('\\s*https://t.co.*$'), '')
  }
}

export default class TwitterRealtimeWw2 {
  constructor (twitterService) {
    this.twitterService = twitterService
  }

  async getLatestNews () {
    const latestTweets = await this.twitterService.getLatestTweets()
    const firstTweet = latestTweets[0]
    return convertTweetToEvent(firstTweet)
  }

  async getRecentEvents (durationHour, clock) {
    const latestTweets = await this.twitterService.getLatestTweets()
    return latestTweets
      .filter(tweet => {
        const now = moment(clock)
        const minimumDateTime = now.clone().subtract(durationHour, 'hours')
        const tweetDateTime = getCreatedDateTimeFromTweet(tweet)
        return tweetDateTime.diff(minimumDateTime) >= 0 && tweetDateTime.diff(now) <= 0
      })
      .map(convertTweetToEvent)
      .sort((t1, t2) => moment(t1.datetime).diff(moment(t2.datetime)))
  }
}
