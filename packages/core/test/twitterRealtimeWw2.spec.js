/* eslint-env mocha */
import TwitterRealtimeWw2 from '../src/twitterRealtimeWw2'
import nock from 'nock'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import moment from 'moment'
const expect = chai.use(chaiAsPromised).expect

describe('twitter realtime ww2', () => {
  context('when successfully get latest news', () => {
    let subject

    beforeEach(() => {
      subject = new TwitterRealtimeWw2({}, 'https://api.twitter.com/1.1', 'RealTimeWWII')
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
        expect(moment(news.datetime, moment.ISO_8601, true).isValid()).to.equal(true)
        expect(moment.parseZone(news.datetime).utcOffset()).to.equal(0)
      })
    })

    it('should convert year to ww2 period', () => {
      return subject.getLatestNews().then(news => {
        const datetime = moment(news.datetime, moment.ISO_8601)
        expect(datetime.get('year')).to.equal(1939)
      })
    })

    it('should parse news content', () => {
      return subject.getLatestNews().then(news => {
        expect(news.content).to.equal('Soviet Union has so far remained neutral in war in Poland on its western border, following Nazi-Soviet nonaggression pact signed 3 weeks ago')
      })
    })
  })
})
