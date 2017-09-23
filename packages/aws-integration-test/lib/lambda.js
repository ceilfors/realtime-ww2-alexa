import AWS from 'aws-sdk'

export default class Lambda {
  constructor (functionName) {
    this.functionName = functionName
  }

  invoke (payload) {
    const lambda = new AWS.Lambda()
    const params = {
      FunctionName: this.functionName
    }
    if (payload) {
      params.Payload = JSON.stringify(payload)
    }
    return lambda.invoke(params).promise().then(response => {
      if (response.FunctionError) {
        throw new Error(response.Payload)
      } else {
        return response
      }
    })
  }
}
