import AWS from 'aws-sdk'

export default class S3TweetRepository {
  constructor (bucketName) {
    this.bucketName = bucketName
    this.objectKey = 'latest_tweets.json'
    this.s3 = new AWS.S3()
  }

  saveLatestTweets (tweets) {
    const params = Object.assign(this._baseParams(), {
      Body: JSON.stringify(tweets),
      ContentType: 'application/json'
    })
    return this.s3.putObject(params).promise()
  }

  getLatestTweets () {
    return this.s3.getObject(this._baseParams()).promise().then(data => JSON.parse(data.Body))
  }

  deleteLatestTweets () {
    return this.s3.deleteObject(this._baseParams()).promise()
  }

  _baseParams () {
    return {
      Bucket: this.bucketName,
      Key: this.objectKey
    }
  }
}
