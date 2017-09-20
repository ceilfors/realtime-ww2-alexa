/* eslint-env mocha */
import AWS from 'aws-sdk'
import {expect} from 'chai'
import S3TweetRepository from '@realtime-ww2-alexa/core/src/lib/s3-tweet-repository'
const tweetRepository = new S3TweetRepository('realtime-ww2-dev-tweet')

const invokeCacheTweets = () => {
  const lambda = new AWS.Lambda()
  const params = {
    FunctionName: 'realtime-ww2-dev-cache-tweets'
  }
  return lambda.invoke(params).promise().then(response => {
    if (response.FunctionError) {
      throw new Error(response.Payload)
    } else {
      return response
    }
  })
}

describe('cacheTweets', () => {
  before(() => {
    return tweetRepository.deleteLatestTweets()
  })

  it('caches tweets in s3 bucket', () => {
    return invokeCacheTweets().then(_ => {
      return tweetRepository.getLatestTweets().then(tweets => {
        const firstTweet = tweets[0]
        expect(firstTweet.full_text).to.equal('Soviet Union has so far remained neutral in war in Poland on its western border, following Nazi-Soviet nonaggression pact signed 3 weeks ago https://t.co/BqLYzxUa9G')
        expect(firstTweet.created_at).to.equal('Thu Sep 14 17:09:04 +0000 2017')

        expect(tweets.length).to.equal(20)
      })
    })
  }).timeout(5000)
})
