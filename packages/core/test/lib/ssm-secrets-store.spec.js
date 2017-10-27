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
    it('should return an object for a single parameter', async function () {
      const parameterName = '/base/path/p1'
      ssm.getParameters.yields(null, {
        data: {
          Parameters: [
            { Name: parameterName,
              Type: 'SecureString',
              Value: 'v1' }
          ],
          InvalidParameters: []
        }
      })
      const subject = new SsmSecretsStore('/base/path')
      const secrets = await subject.getSecrets(['p1'])
      expect(secrets).to.not.be.undefined()
      expect(secrets).to.have.property(parameterName, 'v1')
    })

    it('should return an object for multiple parameters', async function () {
      ssm.getParameters.yields(null, {
        data: {
          Parameters: [
            { Name: '/base/path/p1',
              Type: 'SecureString',
              Value: 'v1' },
            { Name: '/base/path/p2',
              Type: 'SecureString',
              Value: 'v2' },
            { Name: '/base/path/p3',
              Type: 'SecureString',
              Value: 'v3' }
          ],
          InvalidParameters: []
        }
      })
      const subject = new SsmSecretsStore('/base/path')
      const secrets = await subject.getSecrets(['p1', 'p3'])
      expect(secrets).to.have.property('/base/path/p1', 'v1')
      expect(secrets).to.have.property('/base/path/p3', 'v3')
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

    it('should not have double forward slash when constructing path', async function () {
      const subject = new SsmSecretsStore('/base/path/')
      await subject.getSecrets(['p1'])
      expect(ssm.getParameters).to.be.called.calledWithExactly(
        {
          Names: ['/base/path/p1'],
          WithDecryption: true
        },
        sinon.match.func
      )
    })

    it('should not add slash if base path is not specified', async function () {
      const subject = new SsmSecretsStore('')
      await subject.getSecrets(['p1'])
      expect(ssm.getParameters).to.be.called.calledWithExactly(
        {
          Names: ['p1'],
          WithDecryption: true
        },
        sinon.match.func
      )
    })
  })

  context('when parameter name is not available', function () {
    it('should throw error if InvalidParameters is not empty')
  })
})
