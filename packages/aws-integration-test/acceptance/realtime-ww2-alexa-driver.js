import S3TweetRepository from '@realtime-ww2-alexa/core/src/lib/s3-tweet-repository'
import Lambda from '../lib/lambda'
import Alexa from '../lib/alexa'
const alexaSkillLambdaName = 'realtime-ww2-dev-alexa-skill'
const tweetRepository = new S3TweetRepository('realtime-ww2-dev-tweet')
const cacheTweetsLambda = new Lambda('realtime-ww2-dev-cache-tweets')
const alexaSkillLambda = new Lambda(alexaSkillLambdaName)

const convertEventSsmlToObj = (ssml) => {
  const regex = '<p>(<s>(.*)</s>)?<s>(.*)</s><s>(.*)</s></p>'
  const result = new RegExp(regex).exec(ssml)
  if (result) {
    const dateIncluded = result[1] !== undefined
    const obj = {
      date: dateIncluded ? />(.*)</.exec(result[2])[1] : null,
      time: result[3],
      content: result[4]
    }
    return obj
  } else {
    throw new Error('Could not convert ssml to event object as it does not match the regex: ' + ssml)
  }
}

const populateEventDate = events => {
  let prevDate
  events.forEach(event => {
    if (event.date) {
      prevDate = event.date
    } else {
      event.date = prevDate
    }
  })
}

export default class RealtimeWw2AlexaDriver {
  constructor (alexaApplicationId) {
    this.alexa = new Alexa(alexaApplicationId, alexaSkillLambdaName)
  }

  async setup () {
    await tweetRepository.deleteLatestTweets()
    await cacheTweetsLambda.invoke()
  }

  async getLatestNews () {
    const response = await this.alexa.request('GetLatestIntent')
    return convertEventSsmlToObj(response)
  }

  async setClock (clock) {
    return alexaSkillLambda.updateEnvironment('CLOCK', clock)
  }

  async restoreClock () {
    return alexaSkillLambda.updateEnvironment('CLOCK', 'NOW')
  }

  async getRecentEvents (from) {
    const response = await this.alexa.request('GetRecentEventsIntent', {Duration: 24})
    const eventsSsml = response.replace(/p><p/g, 'p>;;;<p').split(';;;')
    const events = eventsSsml.map(eventSsml => convertEventSsmlToObj(eventSsml))
    populateEventDate(events)
    return events
  }
}
