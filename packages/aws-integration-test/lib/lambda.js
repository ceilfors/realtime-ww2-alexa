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

  async updateEnvironment (name, value) {
    const env = await this._getEnvironments()
    env.Variables[name] = value
    const lambda = new AWS.Lambda()
    const params = {
      FunctionName: this.functionName,
      Environment: env
    }
    await lambda.updateFunctionConfiguration(params).promise()
  }

  _getEnvironments () {
    const lambda = new AWS.Lambda()
    const params = {
      FunctionName: this.functionName
    }
    return lambda.getFunctionConfiguration(params).promise()
      .then(response => response.Environment)
  }
}
