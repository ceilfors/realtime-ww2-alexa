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

const convertToSsml = (event, includeDate = true) => {
  const datetime = moment(event.datetime)
  const dateSsml = includeDate ? `<s><say-as interpret-as="date">${datetime.format('YYYYMMDD')}</say-as></s>` : ''
  return '<p>' +
    dateSsml +
    `<s>${datetime.format('LT')}</s>` +
    `${event.content}</p>`
}

const sameDate = (dateTime1, dateTime2) => {
  const m1 = moment(dateTime1)
  const m2 = moment(dateTime2)
  return m1.isSame(m2, 'year') && m1.isSame(m2, 'month') && m1.isSame(m2, 'day')
}

const DURATION_LIMIT_MESSAGE = 'Sorry, you can only get the recent events from the last 1 to 24 hours'
const HELP_MESSAGE = 'You can say tell me the latest event, or, what is happening since the last 24 hours... What can I help you with?'
const HELP_REPROMPT = 'What can I help you with?'
const STOP_MESSAGE = 'Goodbye!'

const handlers = {
  'LaunchRequest': function () {
    this.emit('AMAZON.HelpIntent')
  },
  'GetLatestEventIntent': function () {
    return exports.createApp()
      .then(app => app.getLatestEvent())
      .then(latestEvent => {
        this.emit(':tell', convertToSsml(latestEvent))
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
      let speechOutput = recentEvents.length === 0
        ? `Sorry, there is nothing happening in the last ${duration} hour${duration > 1 ? 's' : ''}`
        : [`<p>Here are the events happening in the last ${duration} hour${duration > 1 ? 's' : ''}</p>`]
          .concat(recentEvents.map((event, i, arr) => {
            let includeDate = i > 0
            ? !sameDate(arr[i - 1].datetime, event.datetime)
            : true
            return convertToSsml(event, includeDate)
          })).join('')

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
