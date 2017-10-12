import TwitterRealtimeWw2 from './lib/twitter-realtime-ww2'
import CachedTwitterService from './lib/cached-twitter-service'
import S3TweetRepository from './lib/s3-tweet-repository'
import EventSsmlConverter from './lib/event-ssml-converter'
import Alexa from 'alexa-sdk'
import moment from 'moment'
import bunyan from 'bunyan'
const log = bunyan.createLogger({name: 'alexa-skill'})
const ssmlConverter = new EventSsmlConverter()

const createApp = async () => {
  return new TwitterRealtimeWw2(
    new CachedTwitterService(
      new S3TweetRepository(process.env.TWEET_CACHE_BUCKET_NAME))
  )
}

const wrapErrorHandler = handlers => {
  return Object.keys(handlers).reduce((acc, key) => {
    acc[key] = new Proxy(handlers[key], {
      apply: async (target, thisArg, argumentsList) => {
        try {
          log.info({request: thisArg.event.request, session: thisArg.event.session}, 'Handling incoming request ...')
          await target.apply(thisArg, argumentsList)
          log.info('Finished handling request.')
        } catch (err) {
          log.error(err)
          thisArg.callback(err)
        }
      }
    })
    return acc
  }, {})
}

const DURATION_LIMIT_MESSAGE = 'Sorry, you can only get the recent events from the last 1 to 24 hours'
const HELP_MESSAGE = 'You can say, what is happening since the last 24 hours, or, tell me the latest event.'
const HELP_REPROMPT = 'What can I help you with?'
const STOP_MESSAGE = 'Goodbye!'

const handlers = wrapErrorHandler({
  'LaunchRequest': function () {
    this.emit('GetRecentEventsIntent', 24)
  },
  'GetLatestEventIntent': async function () {
    const app = await exports.createApp()
    let latestEvent = await app.getLatestEvent()
    this.emit(':tell', ssmlConverter.convert([latestEvent]))
  },
  'GetRecentEventsIntent': async function (d) {
    const duration = d || this.event.request.intent.slots.Duration.value
    if (duration < 1 || duration > 24) {
      log.error({duration}, 'Unsupported duration')
      this.emit(':tell', DURATION_LIMIT_MESSAGE)
      return
    }

    const app = await exports.createApp()
    const clock = process.env.CLOCK === 'NOW' ? moment() : moment(process.env.CLOCK)
    const recentEvents = await app.getRecentEvents(duration, clock.utc().format())
    let speechOutput = recentEvents.length === 0
        ? `Sorry, there is nothing happening in the last ${duration} hour${duration > 1 ? 's' : ''}`
        : [`<p>Here are the events happening in the last ${duration} hour${duration > 1 ? 's' : ''}</p>`]
          .concat(ssmlConverter.convert(recentEvents)).join('')

    this.emit(':tell', speechOutput)
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
  },
  'SessionEndedRequest': function () {
    log.info(this.event.request, 'session ended')
  }
})

exports.handler = function (event, context, callback) {
  const alexa = Alexa.handler(event, context, callback)
  alexa.appId = process.env.ALEXA_SKILL_ID
  alexa.registerHandlers(handlers)
  alexa.execute()
}

exports.createApp = createApp
exports.handlers = handlers
