/* eslint-env mocha */
import AWS from 'aws-sdk'
import {expect} from 'chai'

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

const getTweets = () => {
  const s3 = new AWS.S3()
  const params = {
    Bucket: 'realtime-ww2-dev-tweet',
    Key: 'latest_tweets.json'
  }
  return s3.getObject(params).promise().then(data => JSON.parse(data.Body))
}

const deleteTweets = () => {
  const s3 = new AWS.S3()
  const params = {
    Bucket: 'realtime-ww2-dev-tweet',
    Key: 'latest_tweets.json'
  }
  return s3.deleteObject(params).promise()
}

describe('cacheTweets', () => {
  before(() => {
    return deleteTweets()
  })

  it('caches tweets in s3 bucket', () => {
    return invokeCacheTweets().then(_ => {
      return getTweets().then(tweets => {
        const firstTweet = tweets[0]
        expect(firstTweet.full_text).to.equal('Soviet Union has so far remained neutral in war in Poland on its western border, following Nazi-Soviet nonaggression pact signed 3 weeks ago https://t.co/BqLYzxUa9G')
        expect(firstTweet.created_at).to.equal('Thu Sep 14 17:09:04 +0000 2017')

        expect(tweets.length).to.equal(20)
      })
    })
  })
})
