import moment from 'moment'
import bunyan from 'bunyan'

const log = bunyan.createLogger({name: 'twitter-realtime-ww2'})

class MinDurationError extends Error {
  constructor (message) {
    super(message)
    this.name = MinDurationError.name
  }
}

class MaxDurationError extends Error {
  constructor (message) {
    super(message)
    this.name = MaxDurationError.name
  }
}

const validateDurationHour = durationHour => {
  if (durationHour < 1) {
    throw new MinDurationError()
  }
  if (durationHour > 24) {
    throw new MaxDurationError()
  }
}

const getCreatedDateTimeFromTweet = (tweet) => moment(tweet.created_at, 'dd MMM DD HH:mm:ss ZZ YYYY', 'en')

const getEventDateTime = (tweet) => {
  const dateTime = getCreatedDateTimeFromTweet(tweet)
  dateTime.set('year', dateTime.get('year') - 78)
  return dateTime.utc().format()
}

const convertTweetToEvent = tweet => ({
  datetime: getEventDateTime(tweet),
  content: tweet.full_text.replace(new RegExp('\\s*https://t.co.*$'), '')
})

const dateTimeDiff = (d1, d2) => moment(d1).diff(moment(d2))

const eventDateTimeDiff = (e1, e2) => dateTimeDiff(e1.datetime, e2.datetime)

const isBetweenDateRange = (date, min, max) => date.diff(min) >= 0 && date.diff(max) <= 0

const isTweetWithinDuration = (clock, durationHour) => tweet => {
  const now = moment(clock)
  const minimumDateTime = now.clone().subtract(durationHour, 'hours')
  const tweetDateTime = getCreatedDateTimeFromTweet(tweet)
  return isBetweenDateRange(tweetDateTime, minimumDateTime, now)
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
    validateDurationHour(durationHour)
    log.info({durationHour, clock}, 'Getting recent events ...')
    const latestTweets = await this.twitterService.getLatestTweets()
    const recentEvents = latestTweets
      .filter(isTweetWithinDuration(clock, durationHour))
      .map(convertTweetToEvent)
      .sort(eventDateTimeDiff)
    log.info({recentEvents}, 'Finished getting the recent events')
    return recentEvents
  }
}

export {MinDurationError, MaxDurationError}
