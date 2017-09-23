import S3TweetRepository from '@realtime-ww2-alexa/core/src/lib/s3-tweet-repository'
import Lambda from '../lib/lambda'
const tweetRepository = new S3TweetRepository('realtime-ww2-dev-tweet')
const cacheTweetsLambda = new Lambda('realtime-ww2-dev-cache-tweets')
const alexaSkillLambda = new Lambda('realtime-ww2-dev-alexa-skill')

const createAlexaPayload = (alexaApplicationId) => {
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
        'name': 'GetLatestIntent',
        'slots': {}
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

export default class RealtimeWw2AlexaDriver {
  constructor (alexaApplicationId) {
    this.alexaApplicationId = alexaApplicationId
  }

  setup () {
    return tweetRepository.deleteLatestTweets().then(_ => cacheTweetsLambda.invoke())
  }

  async getLatestNews () {
    const response = await alexaSkillLambda.invoke(createAlexaPayload(this.alexaApplicationId))

    const regex = '<speak>\\s*<s>(.*)</s><s>(.*)</s><s>(.*)</s>\\s*</speak>'
    const ssml = JSON.parse(response.Payload).response.outputSpeech.ssml
    const result = new RegExp(regex).exec(ssml)
    return {
      date: />(.*)</.exec(result[1])[1],
      time: result[2],
      content: result[3]
    }
  }
}
