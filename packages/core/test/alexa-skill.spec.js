/* eslint-env mocha */
import moment from 'moment'
import intercept from 'intercept-stdout'
import alexaSkill from '../src/alexa-skill'
import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
chai.use(sinonChai)
const expect = chai.expect

describe('alexa skill', function () {
  let alexaSdk, duration

  beforeEach('Prepare Alexa SDK', function () {
    duration = {value: 10}
    alexaSdk = {
      emit: sinon.stub(),
      event: { request: { intent: { slots: { Duration: duration } } } }
    }
  })

  context('when SessionEndedRequest is requested', function () {
    let capturedLog, unhookIntercept
    beforeEach(function () {
      capturedLog = ''
      unhookIntercept = intercept(function (txt) {
        capturedLog += txt
      })
    })

    afterEach(function () {
      unhookIntercept()
    })

    it('should be able to respond the intent', function () {
      expect(alexaSkill.handlers).to.contain.all.keys('SessionEndedRequest')
    })

    it('should log session details when SessionEndedRequest is requested', function () {
      alexaSdk.event.request.reason = 'USER_INITIATED'
      alexaSkill.handlers.SessionEndedRequest.apply(alexaSdk)

      let sessionDetails = JSON.parse(capturedLog)
      expect(sessionDetails).to.contain.all.keys('reason')
      expect(sessionDetails.reason).to.equal('USER_INITIATED')
    })
  })

  xit('should respond to Unhandled intent', function () {
    expect(alexaSkill.handlers).to.contain.all.keys('Unhandled')
  })

  context('when GetLatestEventIntent is requested', function () {
    let subject, app

    beforeEach(function () {
      subject = alexaSkill.handlers.GetLatestEventIntent
      app = { getLatestEvent: sinon.stub() }
      alexaSkill.createApp = () => Promise.resolve(app)
    })

    it('should tell the latest event', async function () {
      app.getLatestEvent.returns({ datetime: moment('1939-09-14'), content: 'content' })
      await subject.apply(alexaSdk)

      expect(alexaSdk.emit).to.have.been.calledWithExactly(':tell',
        '<p><s><say-as interpret-as="date">19390914</say-as></s><s>12:00 AM</s>content</p>')
    })
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
        `<p>Here are the events happening in the last 10 hours</p>` +
        `<p><s><say-as interpret-as="date">19390914</say-as></s><s>12:00 AM</s>content</p>`)
    })

    it('should be able to tell two events with different date', async function () {
      app.getRecentEvents.returns([
        { datetime: moment('1939-09-14'), content: 'content 1' },
        { datetime: moment('1939-09-15'), content: 'content 2' }
      ])
      await subject.apply(alexaSdk)

      expect(alexaSdk.emit).to.have.been.calledWithExactly(':tell',
        `<p>Here are the events happening in the last 10 hours</p>` +
        `<p><s><say-as interpret-as="date">19390914</say-as></s><s>12:00 AM</s>content 1</p>` +
        `<p><s><say-as interpret-as="date">19390915</say-as></s><s>12:00 AM</s>content 2</p>`)
    })

    it('should not repeat the date if there are two events happening on the same date', async function () {
      app.getRecentEvents.returns([
        { datetime: moment('1939-09-14T00:00:00'), content: 'content 1' },
        { datetime: moment('1939-09-14T01:00:00'), content: 'content 2' },
        { datetime: moment('1939-09-14T02:00:00'), content: 'content 3' },
        { datetime: moment('1939-09-15T00:00:00'), content: 'content 4' }
      ])
      await subject.apply(alexaSdk)

      expect(alexaSdk.emit).to.have.been.calledWithExactly(':tell',
        `<p>Here are the events happening in the last 10 hours</p>` +
        `<p><s><say-as interpret-as="date">19390914</say-as></s><s>12:00 AM</s>content 1</p>` +
        `<p><s>1:00 AM</s>content 2</p>` +
        `<p><s>2:00 AM</s>content 3</p>` +
        `<p><s><say-as interpret-as="date">19390915</say-as></s><s>12:00 AM</s>content 4</p>`)
    })
  })
})
