/* eslint-env mocha */
import {expect} from 'chai'
import S3TweetRepository from '@realtime-ww2-alexa/core/src/lib/s3-tweet-repository'
import Lambda from '../lib/lambda'
const cacheTweetsLambda = new Lambda('realtime-ww2-dev-cache-tweets')
const tweetRepository = new S3TweetRepository('realtime-ww2-dev-tweet')

describe('cacheTweets', function () {
  this.timeout(5000)

  before(() => {
    return tweetRepository.deleteLatestTweets()
  })

  it('caches tweets in s3 bucket', async function () {
    await cacheTweetsLambda.invoke()
    const tweets = await tweetRepository.getLatestTweets()
    const firstTweet = tweets[0]
    expect(firstTweet.full_text).to.equal('Soviet Union has so far remained neutral in war in Poland on its western border, following Nazi-Soviet nonaggression pact signed 3 weeks ago https://t.co/BqLYzxUa9G')
    expect(firstTweet.created_at).to.equal('Thu Sep 14 17:09:04 +0000 2017')

    expect(tweets.length).to.equal(20)
  })
})
