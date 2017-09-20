export default class CachedTwitterService {
  constructor (tweetRepository) {
    this.tweetRepository = tweetRepository
  }

  getLatestTweets () {
    return this.tweetRepository.getLatestTweets()
  }
}
