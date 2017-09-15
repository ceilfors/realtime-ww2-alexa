/* eslint-env mocha */
import RealtimeWw2AlexaDriver from './realtime-ww2-alexa-driver'
const chai = require('chai')
const expect = chai.expect

describe('acceptance', () => {
  let realtimeWw2 = new RealtimeWw2AlexaDriver('amzn1.ask.skill.8955b37b-4975-4462-a4d9-4aba0ad647f0')

  it('retrieves the latest news from twitter', () => {
    return realtimeWw2.getLatestNews().then(latestNews => {
      expect(latestNews.date).to.equal('19660901')
      expect(latestNews.time).to.equal('8:51 PM')
      expect(latestNews.content).to.equal('Nazi SS troops dressed as Poles are attacking German radio station in Gleiwitz, to provide false pretext for German attack on Poland')
    })
  })
})
