/* eslint-env mocha */
import RealtimeWw2AlexaDriver from './realtime-ww2-alexa-driver'
import {expect} from 'chai'

describe('acceptance', () => {
  let realtimeWw2 = new RealtimeWw2AlexaDriver('amzn1.ask.skill.8955b37b-4975-4462-a4d9-4aba0ad647f0')

  it('retrieves the latest news from twitter', () => {
    return realtimeWw2.getLatestNews().then(latestNews => {
      expect(latestNews.content).to.equal('Soviet Union has so far remained neutral in war in Poland on its western border, following Nazi-Soviet nonaggression pact signed 3 weeks ago')
      expect(latestNews.date).to.equal('19390914')
      expect(latestNews.time).to.equal('5:09 PM')
    })
  })
})
