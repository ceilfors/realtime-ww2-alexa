'use strict'

import TwitterRealtimeWw2 from './src/twitterRealtimeWw2'

const Alexa = require('alexa-sdk')
const moment = require('moment')
const slscrypt = require('./node_modules/serverless-crypt/dists/slscrypt')

const createApp = () => {
  return slscrypt.get('twitter_consumer_key').then(consumerKey => {
    return slscrypt.get('twitter_consumer_secret').then(consumerSecret => {
      return slscrypt.get('twitter_access_token_key').then(accessTokenKey => {
        return slscrypt.get('twitter_access_token_secret').then(accessTokenSecret => {
          return new TwitterRealtimeWw2({
            consumerKey, consumerSecret, accessTokenKey, accessTokenSecret
          }, process.env.TWITTER_REST_BASE_URL, 'RealTimeWWII')
        })
      })
    })
  })
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
