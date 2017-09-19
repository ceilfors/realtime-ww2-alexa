const AWS = require('aws-sdk')

const createAlexaPayload = (alexaApplicationId) => {
  return JSON.stringify({
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
  })
}

export default class RealtimeWw2AlexaDriver {
  constructor (alexaApplicationId) {
    this.alexaApplicationId = alexaApplicationId
  }

  getLatestNews () {
    const lambda = new AWS.Lambda()
    const params = {
      FunctionName: 'realtime-ww2-dev-alexa-skill',
      Payload: createAlexaPayload(this.alexaApplicationId)
    }
    return lambda.invoke(params).promise().then(response => {
      if (response.FunctionError) {
        throw new Error(response.Payload)
      } else {
        const regex = '<speak>\\s*<s>(.*)</s><s>(.*)</s><s>(.*)</s>\\s*</speak>'
        const ssml = JSON.parse(response.Payload).response.outputSpeech.ssml
        const result = new RegExp(regex).exec(ssml)
        return {
          date: />(.*)</.exec(result[1])[1],
          time: result[2],
          content: result[3]
        }
      }
    })
  }
}
