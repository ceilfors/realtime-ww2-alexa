import Lambda from './lambda'

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

const getContent = (alexaResponse) => alexaResponse.replace(/^<speak>\s*/, '').replace(/\s*<\/speak>$/, '')

export default class Alexa {
  constructor (alexaApplicationId, functionName) {
    this.alexaApplicationId = alexaApplicationId
    this.alexaSkillLambda = new Lambda(functionName)
  }

  async request (intent, slots) {
    const payload = createAlexaPayload(this.alexaApplicationId, intent, slots)
    const response = await this.alexaSkillLambda.invoke(payload)
    return getContent(JSON.parse(response.Payload).response.outputSpeech.ssml)
  }
}
