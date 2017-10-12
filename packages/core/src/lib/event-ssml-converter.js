import moment from 'moment'

const sameDate = (dateTime1, dateTime2) => {
  const m1 = moment(dateTime1)
  const m2 = moment(dateTime2)
  return m1.isSame(m2, 'year') && m1.isSame(m2, 'month') && m1.isSame(m2, 'day')
}

const convertSingle = (event, includeDate = true) => {
  const datetime = moment(event.datetime)
  const dateSsml = includeDate ? `<s><say-as interpret-as="date">${datetime.format('YYYYMMDD')}</say-as></s>` : ''
  return '<p>' +
    dateSsml +
    `<s>${datetime.format('LT')}</s>` +
    `${event.content}</p>`
}

export default class EventSsmlConverter {
  convert (events) {
    return events.map((event, i, arr) => {
      let includeDate = i > 0
        ? !sameDate(arr[i - 1].datetime, event.datetime)
        : true
      return convertSingle(event, includeDate)
    }).join('')
  }
}
