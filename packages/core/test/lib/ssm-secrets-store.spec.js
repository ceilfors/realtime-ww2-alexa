/* eslint-env mocha */
import {expect} from 'chai'
import sinon from 'sinon'
import AWS from 'aws-sdk-mock'
import SsmSecretsStore from '../../src/lib/ssm-secrets-store'

describe.only('ssm secrets store', function () {
  let ssm

  beforeEach(function () {
    ssm = { getParameters: sinon.stub() }
    ssm.getParameters.yields(null, {
      data: {
        Parameters: [],
        InvalidParameters: []
      }
    })
    AWS.mock('SSM', 'getParameters', ssm.getParameters)
  })

  afterEach(function () {
    AWS.restore('SSM')
  })

  context('when successfully retrieved SSM parameters', function () {
    it('should return a map of parameter', async function () {
      const parameterName = '/base/path/p1'
      const parameterValue = '/base/path/v1'
      ssm.getParameters.yields(null, {
        data: {
          Parameters: [
            { Name: parameterName,
              Type: 'SecureString',
              Value: parameterValue }
          ],
          InvalidParameters: []
        }
      })
      const subject = new SsmSecretsStore('/base/path')
      const secrets = await subject.getSecrets(['p1'])
      expect(secrets).to.not.be.undefined()
      expect(secrets).to.have.property(parameterName, parameterValue)
    })

    it('should call AWS.SSM with the correct parameters', async function () {
      const subject = new SsmSecretsStore('/base/path')
      await subject.getSecrets(['p1', 'p2', 'p3'])
      expect(ssm.getParameters).to.be.called.calledWithExactly(
        {
          Names: ['/base/path/p1', '/base/path/p2', '/base/path/p3'],
          WithDecryption: true
        },
        sinon.match.func
      )
    })

    xit('should return a map for multiple parameters')
  })

  context('when parameter name is not available', function () {
    it('should throw error if InvalidParameters is not empty')
  })
})
