/* eslint-env mocha */
import SsmSecretsStore from '../../src/lib/ssm-secrets-store'
import {expect} from 'chai'

describe('ssm secrets store', function () {
  context('when successfully retrieved SSM parameters', function () {
    xit('should return a map of parameter', async function () {
      const subject = new SsmSecretsStore()
      const parameters = await subject.getParameters(['paramter1'])
      expect(parameters).to.equal(new Map(['paramter1', 'value1']))
    })

    xit('should return a map for multiple parameters')
  })

  context('when parameter name is not available', function () {
    it('should throw error if InvalidParameters is not empty')
  })
})
