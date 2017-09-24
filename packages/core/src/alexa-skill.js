'use strict'

import TwitterRealtimeWw2 from './lib/twitter-realtime-ww2'
import CachedTwitterService from './lib/cached-twitter-service'
import S3TweetRepository from './lib/s3-tweet-repository'
import Alexa from 'alexa-sdk'
import moment from 'moment'

const createApp = async () => {
  return new TwitterRealtimeWw2(
    new CachedTwitterService(
      new S3TweetRepository(process.env.TWEET_CACHE_BUCKET_NAME))
  )
}

const DURATION_LIMIT_MESSAGE = 'Sorry, you can only get the recent events from the last 1 to 24 hours'
const HELP_MESSAGE = 'You can say tell me the latest news, or, you can say exit... What can I help you with?'
const HELP_REPROMPT = 'What can I help you with?'
const STOP_MESSAGE = 'Goodbye!'

const handlers = {
  'LaunchRequest': function () {
    this.emit('GetLatestIntent')
  },
  'GetLatestIntent': function () {
    return exports.createApp()
      .then(app => app.getLatestNews())
      .then(latestNews => {
        const datetime = moment(latestNews.datetime)
        const speechOutput = `<p><s><say-as interpret-as="date">${datetime.format('YYYYMMDD')}</say-as></s>` +
            `<s>${datetime.format('LT')}</s>` +
            `<s>${latestNews.content}</s></p>`
        this.emit(':tell', speechOutput)
      })
      .catch(err => {
        console.error(err)
        this.emit(':tell', 'Please try again later')
      })
  },
  'GetRecentEventsIntent': async function () {
    try {
      const app = await exports.createApp()
      const duration = this.event.request.intent.slots.Duration.value
      if (duration < 1 || duration > 24) {
        this.emit(':tell', DURATION_LIMIT_MESSAGE)
        return
      }

      const clock = process.env.CLOCK === 'NOW' ? moment() : moment(process.env.CLOCK)
      const recentEvents = await app.getRecentEvents(duration, clock.utc().format())
      let speechOutput
      if (recentEvents.length === 0) {
        speechOutput = `Sorry, there is nothing happening in the last ${duration} hour${duration > 1 ? 's' : ''}`
      } else {
        speechOutput = recentEvents.map(event => {
          const datetime = moment(event.datetime)
          return `<p><s><say-as interpret-as="date">${datetime.format('YYYYMMDD')}</say-as></s>` +
            `<s>${datetime.format('LT')}</s>` +
            `<s>${event.content}</s></p>`
        }).join('')
      }
      this.emit(':tell', speechOutput)
    } catch (err) {
      console.error(err)
      this.emit(':tell', 'Please try again later')
    }
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

exports.createApp = createApp
exports.handlers = handlers
