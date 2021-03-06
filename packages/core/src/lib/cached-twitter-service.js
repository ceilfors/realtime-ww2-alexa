import bunyan from 'bunyan'
const log = bunyan.createLogger({name: 'cached-twitter-service'})

export default class CachedTwitterService {
  constructor (tweetRepository) {
    this.tweetRepository = tweetRepository
  }

  async getLatestTweets () {
    log.info('Retrieving the latest tweets from tweetRepository ...')
    const latestTweets = await this.tweetRepository.getLatestTweets()
    log.info({totalTweets: latestTweets.length}, 'Latest tweets successfully retrieved.')
    return latestTweets
  }
}
