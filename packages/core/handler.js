'use strict'

import TwitterRealtimeWw2 from './src/twitter-realtime-ww2'
import CachedTwitterService from './src/lib/cached-twitter-service'
import S3TweetRepository from './src/lib/s3-tweet-repository'

const Alexa = require('alexa-sdk')
const moment = require('moment')

const createApp = () => {
  return Promise.resolve(new TwitterRealtimeWw2(
    new CachedTwitterService(
      new S3TweetRepository(process.env.TWEET_CACHE_BUCKET_NAME))
  ))
}

const HELP_MESSAGE = 'You can say tell me the latest news, or, you can say exit... What can I help you with?'
const HELP_REPROMPT = 'What can I help you with?'
const STOP_MESSAGE = 'Goodbye!'

const handlers = {
  'LaunchRequest': function () {
    this.emit('GetLatestIntent')
  },
  'GetLatestIntent': function () {
    return createApp()
      .then(app => app.getLatestNews())
      .then(latestNews => {
        const datetime = moment(latestNews.datetime)
        const speechOutput = `<s><say-as interpret-as="date">${datetime.format('YYYYMMDD')}</say-as></s>` +
            `<s>${datetime.format('LT')}</s>` +
            `<s>${latestNews.content}</s>`
        this.emit(':tell', speechOutput)
      })
      .catch(err => {
        console.error(err)
        this.emit(':tell', 'Please try again later')
      })
  },
  'AMAZON.HelpIntent': function () {
    this.response.speak(HELP_MESSAGE).listen(HELP_REPROMPT)
    this.emit(':responseReady')
  },
  'AMAZON.CancelIntent': function () {
    this.emit(':tell', STOP_MESSAGE)
  },
  'AMAZON.StopIntent': function () {
    this.emit(':tell', STOP_MESSAGE)
  }
}

exports.handler = function (event, context, callback) {
  const alexa = Alexa.handler(event, context, callback)
  alexa.appId = 'amzn1.ask.skill.8955b37b-4975-4462-a4d9-4aba0ad647f0'
  alexa.registerHandlers(handlers)
  alexa.execute()
}
