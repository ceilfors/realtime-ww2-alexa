/* eslint-env mocha */
import RealtimeWw2AlexaDriver from './realtime-ww2-alexa-driver'
import {expect} from 'chai'

describe('acceptance', function () {
  this.timeout(5000)
  let realtimeWw2 = new RealtimeWw2AlexaDriver('amzn1.ask.skill.8955b37b-4975-4462-a4d9-4aba0ad647f0')

  before(async function () {
    await realtimeWw2.setup()
    await realtimeWw2.setClock('2017-09-14T17:15:00Z')
  })

  after(async function () {
    await realtimeWw2.restoreClock()
  })

  it('retrieves the latest event from twitter', async function () {
    const latestEvent = await realtimeWw2.getLatestEvent()
    expect(latestEvent).to.deep.equal({
      content: 'Soviet Union has so far remained neutral in war in Poland on its western border, following Nazi-Soviet nonaggression pact signed 3 weeks ago',
      date: '19390914',
      time: '5:09 PM'
    })
  })

  it('retrieves the events from the last 24 hours', async function () {
    const recentEvents = await realtimeWw2.getRecentEvents(24)
    expect(recentEvents).to.deep.equal([
      {
        content: "\"It is felt that Mussolini was up to no good with his scheme for holding a peace conference and spoiling what has become everybody's war.\"",
        date: '19390913',
        time: '5:17 PM'
      },
      {
        content: 'French Prime Minister Édouard Daladier has formed a war cabinet. He is personally responsible for foreign affairs, war, &amp; national defence.',
        date: '19390914',
        time: '1:18 PM'
      },
      {
        content: 'German troops have broken Polish defences on the Narew river. They are advancing across the plains north of Warsaw, encircling the capital.',
        date: '19390914',
        time: '1:49 PM'
      },
      {
        content: 'Retreating Polish troops have blown up bridges to slow Germans, but Wehrmacht combat engineers throw up pontoons to keep blitzkreig rolling:',
        date: '19390914',
        time: '1:53 PM'
      },
      {
        content: 'The Soviet newspaper Pravda has launched an anti-Polish campaign, with articles alleging Polish mistreatment of ethnic minorities.',
        date: '19390914',
        time: '5:05 PM'
      },
      {
        content: 'Soviet Union has so far remained neutral in war in Poland on its western border, following Nazi-Soviet nonaggression pact signed 3 weeks ago',
        date: '19390914',
        time: '5:09 PM'
      }
    ])
  })
})
