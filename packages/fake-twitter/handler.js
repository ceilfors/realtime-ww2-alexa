exports.handler = function (event, context, callback) {
  const response = {
    statusCode: 200,
    body: JSON.stringify(require('./user_timeline_extended.json'))
  }

  callback(null, response)
}
