/* eslint-env mocha */
import TwitterRealtimeWw2 from '../src/twitter-realtime-ww2'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import moment from 'moment'
const expect = chai.use(chaiAsPromised).expect

describe('twitter realtime ww2', function () {
  context('when successfully get latest news', function () {
    let subject

    beforeEach(function () {
      let twitterService = {getLatestTweets: () => Promise.resolve(require('./user_timeline_extended.json'))}
      subject = new TwitterRealtimeWw2(twitterService)
    })

    it('should return datetime in UTC ISO_8601 format', function () {
      return subject.getLatestNews().then(news => {
        expect(moment(news.datetime, moment.ISO_8601, true).isValid()).to.equal(true)
        expect(moment.parseZone(news.datetime).utcOffset()).to.equal(0)
      })
    })

    it('should convert year to ww2 period', function () {
      return subject.getLatestNews().then(news => {
        const datetime = moment(news.datetime, moment.ISO_8601)
        expect(datetime.get('year')).to.equal(1939)
      })
    })

    it('should parse news content', function () {
      return subject.getLatestNews().then(news => {
        expect(news.content).to.equal('Soviet Union has so far remained neutral in war in Poland on its western border, following Nazi-Soviet nonaggression pact signed 3 weeks ago')
      })
    })
  })
})
