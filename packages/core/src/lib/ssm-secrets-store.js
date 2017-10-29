import AWS from 'aws-sdk'

export default class SsmSecretsStore {
  constructor (basePath = '') {
    if (basePath && !basePath.endsWith('/')) {
      basePath += '/'
    }
    this.basePath = basePath
  }

  async getSecrets (secretNames) {
    const ssm = new AWS.SSM()

    const ssmRequestParams = {
      Names: secretNames.map(n => `${this.basePath}${n}`),
      WithDecryption: true
    }
    const response = await ssm.getParameters(ssmRequestParams).promise()
    if (response.InvalidParameters.length !== 0) {
      throw new Error(`Secret were not available for: ${response.InvalidParameters}`)
    }
    return Object.assign({},
      ...response.Parameters
        .map(p => ({[p.Name.replace(this.basePath, '')]: p.Value})))
  }
}
