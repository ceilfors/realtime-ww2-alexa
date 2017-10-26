import AWS from 'aws-sdk'

export default class SsmSecretsStore {
  constructor (basePath) {
    this.basePath = basePath
  }

  async getSecrets (secretNames) {
    const ssm = new AWS.SSM()

    const ssmRequestParams = {
      Names: secretNames.map(n => `${this.basePath}/${n}`),
      WithDecryption: true
    }
    const response = await ssm.getParameters(ssmRequestParams).promise()
    return Object.assign({},
      ...response.data.Parameters.map(p => ({[p.Name]: p.Value})))
  }
}
