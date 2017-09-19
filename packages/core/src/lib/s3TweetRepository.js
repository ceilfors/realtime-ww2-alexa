import AWS from 'aws-sdk'

export default class S3TweetRepository {
  constructor (bucketName) {
    this.bucketName = bucketName
  }

  saveLatestTweets (tweets) {
    const s3 = new AWS.S3()
    const params = {
      Body: JSON.stringify(tweets),
      Bucket: this.bucketName,
      Key: 'latest_tweets.json',
      ContentType: 'application/json'
    }
    return s3.putObject(params).promise()
  }
}
