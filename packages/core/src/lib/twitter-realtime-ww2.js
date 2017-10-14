import moment from 'moment'
import bunyan from 'bunyan'
const log = bunyan.createLogger({name: 'twitter-realtime-ww2'})

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

  async getLatestEvent () {
    log.info('Getting the latest event ...')
    const latestTweets = await this.twitterService.getLatestTweets()
    const firstTweet = latestTweets[0]
    return convertTweetToEvent(firstTweet)
  }

  async getRecentEvents (durationHour, clock) {
    if (durationHour < 1) {
      throw new MinDurationError()
    }
    if (durationHour > 24) {
      throw new MaxDurationError()
    }

    log.info({durationHour, clock}, 'Getting recent events ...')
    const latestTweets = await this.twitterService.getLatestTweets()
    const recentEvents = latestTweets
      .filter(tweet => {
        const now = moment(clock)
        const minimumDateTime = now.clone().subtract(durationHour, 'hours')
        const tweetDateTime = getCreatedDateTimeFromTweet(tweet)
        return tweetDateTime.diff(minimumDateTime) >= 0 && tweetDateTime.diff(now) <= 0
      })
      .map(convertTweetToEvent)
      .sort((t1, t2) => moment(t1.datetime).diff(moment(t2.datetime)))
    log.info({recentEvents}, 'Finished getting the recent events')
    return recentEvents
  }
}

export class MinDurationError extends Error {
  constructor (message) {
    super(message)
    this.name = MinDurationError.name
  }
}

export class MaxDurationError extends Error {
  constructor (message) {
    super(message)
    this.name = MaxDurationError.name
  }
}
