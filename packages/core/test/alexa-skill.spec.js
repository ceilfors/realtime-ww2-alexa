/* eslint-env mocha */
import moment from 'moment'
import alexaSkill from '../src/alexa-skill'
import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
chai.use(sinonChai)
const expect = chai.expect

describe.only('alexa skill', function () {
  let alexaSdk, duration

  beforeEach('Prepare Alexa SDK', function () {
    duration = {value: 10}
    alexaSdk = {
      emit: sinon.stub(),
      event: { request: { intent: { slots: { Duration: duration } } } }
    }
  })

  context('when GetRecentEventsIntent is requested', function () {
    let subject, app

    beforeEach(function () {
      subject = alexaSkill.handlers.GetRecentEventsIntent
      app = { getRecentEvents: sinon.stub() }
      alexaSkill.createApp = () => app

      app.getRecentEvents.returns([])
    })

    it('should inform the user that there is no events in singular form', async function () {
      duration.value = 1
      await subject.apply(alexaSdk)

      expect(alexaSdk.emit).to.have.been.calledWithExactly(':tell',
        `Sorry, there is nothing happening in the last ${duration.value} hour`)
    })

    it('should inform the user that there is no events in plural form', async function () {
      duration.value = 10
      await subject.apply(alexaSdk)

      expect(alexaSdk.emit).to.have.been.calledWithExactly(':tell',
        `Sorry, there is nothing happening in the last ${duration.value} hours`)
    })

    it('should inform the user the duration that can be used when the input is below the minimum allowed', async function () {
      duration.value = 0
      await subject.apply(alexaSdk)

      expect(alexaSdk.emit).to.have.been.calledWithExactly(':tell',
        'Sorry, you can only get the recent events from the last 1 to 24 hours')
    })

    it('should inform the user the duration that can be used when the input is below the maximum allowed', async function () {
      duration.value = 25
      await subject.apply(alexaSdk)

      expect(alexaSdk.emit).to.have.been.calledWithExactly(':tell',
        'Sorry, you can only get the recent events from the last 1 to 24 hours')
    })

    it('should be able tell one event', async function () {
      app.getRecentEvents.returns([
        { datetime: moment('1939-09-14'), content: 'content' }
      ])
      await subject.apply(alexaSdk)

      expect(alexaSdk.emit).to.have.been.calledWithExactly(':tell',
        `<p><s><say-as interpret-as="date">19390914</say-as></s><s>12:00 AM</s><s>content</s></p>`)
    })

    it('should be able to tell two events with different date', async function () {
      app.getRecentEvents.returns([
        { datetime: moment('1939-09-14'), content: 'content 1' },
        { datetime: moment('1939-09-15'), content: 'content 2' }
      ])
      await subject.apply(alexaSdk)

      expect(alexaSdk.emit).to.have.been.calledWithExactly(':tell',
        `<p><s><say-as interpret-as="date">19390914</say-as></s><s>12:00 AM</s><s>content 1</s></p>` +
        `<p><s><say-as interpret-as="date">19390915</say-as></s><s>12:00 AM</s><s>content 2</s></p>`)
    })
  })
})
