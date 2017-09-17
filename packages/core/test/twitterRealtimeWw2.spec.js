/* eslint-env mocha */
import RealtimeWw2AlexaDriver from '../src/twitterRealtimeWw2'
import nock from 'nock'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
const expect = chai.use(chaiAsPromised).expect

describe('twitter realtime ww2', () => {
  context('when successfully get latest news', () => {
    let subject

    beforeEach(() => {
      subject = new RealtimeWw2AlexaDriver({}, 'https://api.twitter.com/1.1', 'RealTimeWWII')
      nock('https://api.twitter.com/1.1')
        .get('/statuses/user_timeline.json')
        .query({
          tweet_mode: 'extended',
          screen_name: 'RealTimeWWII',
          count: 1
        })
        .reply(200, require('./user_timeline_extended.json'))
    })

    afterEach(() => {
      nock.cleanAll()
    })

    it('should return datetime in UTC ISO_8601 format', () => {
      return subject.getLatestNews().then(news => {
        expect(news.datetime).to.equal('2017-09-14T17:09:04Z')
      })
    })

    it('should return news content', () => {
      return subject.getLatestNews().then(news => {
        expect(news.content).to.equal('Soviet Union has so far remained neutral in war in Poland on its western border, following Nazi-Soviet nonaggression pact signed 3 weeks ago')
      })
    })
  })
})
