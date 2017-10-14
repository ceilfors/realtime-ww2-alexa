/* eslint-env mocha */
import TwitterRealtimeWw2 from '../../src/lib/twitter-realtime-ww2'
import {expect} from 'chai'
import moment from 'moment'

const TEST_CLOCK = '2017-09-14T17:52:00Z'

describe('twitter realtime ww2', function () {
  context('when successfully get latest event', function () {
    let subject

    beforeEach(function () {
      let twitterService = {getLatestTweets: () => Promise.resolve(require('./user_timeline_extended.json'))}
      subject = new TwitterRealtimeWw2(twitterService)
    })

    it('should return datetime in UTC ISO_8601 format', async function () {
      const event = await subject.getLatestEvent()
      expect(moment(event.datetime, moment.ISO_8601, true).isValid()).to.equal(true)
      expect(moment.parseZone(event.datetime).utcOffset()).to.equal(0)
    })

    it('should convert year to ww2 period', async function () {
      const event = await subject.getLatestEvent()
      const datetime = moment(event.datetime, moment.ISO_8601)
      expect(datetime.get('year')).to.equal(1939)
    })

    it('should parse event content', async function () {
      const event = await subject.getLatestEvent()
      expect(event.content).to.equal('Soviet Union has so far remained neutral in war in Poland on its western border, following Nazi-Soviet nonaggression pact signed 3 weeks ago')
    })
  })

  context('when sucessfully get recent events', function () {
    let subject

    beforeEach(function () {
      let twitterService = {getLatestTweets: () => Promise.resolve(require('./user_timeline_extended.json'))}
      subject = new TwitterRealtimeWw2(twitterService)
    })

    it('should return events within the specified duration, sorted chronologically', async function () {
      const events = await subject.getRecentEvents(4, TEST_CLOCK)
      expect(events.length).to.equal(3)
      expect(events[0].datetime).to.equal('1939-09-14T13:53:37Z')
      expect(events[1].datetime).to.equal('1939-09-14T17:05:41Z')
      expect(events[2].datetime).to.equal('1939-09-14T17:09:04Z')
    })

    it('should return empty array if there is no event found', async function () {
      const events = await subject.getRecentEvents(3, '2017-09-18T00:00:00Z')
      expect(events.length).to.equal(0)
    })
  })

  context('when unsuccessfully get recent events', function () {
    let subject

    beforeEach(function () {
      let twitterService = {getLatestTweets: () => Promise.resolve(require('./user_timeline_extended.json'))}
      subject = new TwitterRealtimeWw2(twitterService)
    })

    it('throws error if the duration is below 1', async function () {
      try {
        await subject.getRecentEvents(0, TEST_CLOCK)
        throw new Error('Error was not thrown')
      } catch (err) {
        expect(err).to.have.property('name', 'MinDurationError')
      }
    })

    it('throws error if the duration is above 24', async function () {
      try {
        await subject.getRecentEvents(25, TEST_CLOCK)
        throw new Error('Error was not thrown')
      } catch (err) {
        expect(err).to.have.property('name', 'MaxDurationError')
      }
    })
  })
})
