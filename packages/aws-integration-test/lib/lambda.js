import AWS from 'aws-sdk'

export default class Lambda {
  constructor (functionName) {
    this.functionName = functionName
  }

  invoke () {
    const lambda = new AWS.Lambda()
    const params = {
      FunctionName: this.functionName
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
