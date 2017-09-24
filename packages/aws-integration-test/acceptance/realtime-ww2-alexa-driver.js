import S3TweetRepository from '@realtime-ww2-alexa/core/src/lib/s3-tweet-repository'
import Lambda from '../lib/lambda'
const tweetRepository = new S3TweetRepository('realtime-ww2-dev-tweet')
const cacheTweetsLambda = new Lambda('realtime-ww2-dev-cache-tweets')
const alexaSkillLambda = new Lambda('realtime-ww2-dev-alexa-skill')

const formatSlots = (slots) => {
  return Object.keys(slots)
    .reduce((acc, c) => Object.assign(acc, {[c]: {name: c, value: slots[c]}}), {})
}

const createAlexaPayload = (alexaApplicationId, intentName, slots = {}) => {
  return {
    'session': {
      'new': true,
      'sessionId': 'amzn1.echo-api.session.[unique-value-here]',
      'attributes': {},
      'user': {
        'userId': 'amzn1.ask.account.[unique-value-here]'
      },
      'application': {
        'applicationId': alexaApplicationId
      }
    },
    'version': '1.0',
    'request': {
      'locale': 'en-GB',
      'timestamp': '2017-09-14T22:03:45Z',
      'type': 'IntentRequest',
      'intent': {
        'name': intentName,
        'slots': formatSlots(slots)
      },
      'requestId': 'amzn1.echo-api.request.[unique-value-here]'
    },
    'context': {
      'AudioPlayer': {
        'playerActivity': 'IDLE'
      },
      'System': {
        'device': {
          'supportedInterfaces': {
            'AudioPlayer': {}
          }
        },
        'application': {
          'applicationId': alexaApplicationId
        },
        'user': {
          'userId': 'amzn1.ask.account.[unique-value-here]'
        }
      }
    }
  }
}

const convertEventSsmlToObj = (ssml) => {
  const regex = '<p><s>(.*)</s><s>(.*)</s><s>(.*)</s></p>'
  const result = new RegExp(regex).exec(ssml)
  if (result) {
    return {
      date: />(.*)</.exec(result[1])[1],
      time: result[2],
      content: result[3]
    }
  } else {
    throw new Error('Could not convert ssml to event object as it does not match the regex: ' + ssml)
  }
}

const getSpeech = (alexaResponse) => {
  const ssml = JSON.parse(alexaResponse.Payload).response.outputSpeech.ssml
  return ssml.replace(/^<speak>\s*/, '').replace(/\s*<\/speak>$/, '')
}

export default class RealtimeWw2AlexaDriver {
  constructor (alexaApplicationId) {
    this.alexaApplicationId = alexaApplicationId
  }

  async setup () {
    await tweetRepository.deleteLatestTweets()
    await cacheTweetsLambda.invoke()
  }

  async getLatestNews () {
    const payload = createAlexaPayload(this.alexaApplicationId, 'GetLatestIntent')
    const response = await alexaSkillLambda.invoke(payload)
    return convertEventSsmlToObj(getSpeech(response))
  }

  async setClock (clock) {
    return alexaSkillLambda.updateEnvironment('CLOCK', clock)
  }

  async restoreClock () {
    return alexaSkillLambda.updateEnvironment('CLOCK', 'NOW')
  }

  async getRecentEvents (from) {
    const payload = createAlexaPayload(this.alexaApplicationId, 'GetRecentEventsIntent', {Duration: 24})
    const response = await alexaSkillLambda.invoke(payload)
    const speech = getSpeech(response)
    const eventsSsml = speech.replace(/p><p/g, 'p>;;;<p').split(';;;')
    return eventsSsml.map(eventSsml => convertEventSsmlToObj(eventSsml))
  }
}
