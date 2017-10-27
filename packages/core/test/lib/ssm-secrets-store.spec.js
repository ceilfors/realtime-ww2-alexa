/* eslint-env mocha */
import chai, {expect} from 'chai'
import sinon from 'sinon'
import AWS from 'aws-sdk-mock'
import SsmSecretsStore from '../../src/lib/ssm-secrets-store'

chai.use(function (_chai, utils) {
  const Assertion = chai.Assertion

  Assertion.addMethod('calledWithNames', function (names) {
    const stub = this._obj
    const namesArgs = stub.getCall(0).args[0].Names
    new Assertion(namesArgs).to.deep.equal(names)
  })

  Assertion.addChainableMethod('async', () => {}, function () {
    utils.flag(this, 'async', true)
  })

  Assertion.overwriteMethod('throw', function (_super) {
    return async function (message) {
      if (utils.flag(this, 'async')) {
        const asyncFunc = this._obj

        try {
          await asyncFunc()
        } catch (err) {
          new Assertion(err.message, 'Async error message').to.contain(message)
          return
        }
        throw new Error('Should have thrown an error')
      } else {
        _super.apply(this, arguments)
      }
    }
  })
})

const ssmGetParametersStub = () => {
  const getParameters = sinon.stub()
  getParameters.yieldParams = (params, invalidParams = []) => {
    getParameters.yields(null, {
      data: {
        Parameters: Object.keys(params).map(k => ({
          Name: k,
          Type: 'SecureString',
          Value: params[k]
        })),
        InvalidParameters: invalidParams
      }
    })
  }
  return getParameters
}

describe.only('SsmSecretsStore#getSecrets', function () {
  let ssm, subject

  beforeEach(function () {
    subject = new SsmSecretsStore('/base/path/')
  })

  beforeEach(function () {
    ssm = { getParameters: ssmGetParametersStub() }
    ssm.getParameters.yieldParams({})
    AWS.mock('SSM', 'getParameters', ssm.getParameters)
  })

  afterEach(function () {
    AWS.restore('SSM')
  })

  context('when successful', function () {
    it('should return an object for a single parameter', async function () {
      const parameterName = '/base/path/p1'
      ssm.getParameters.yieldParams({[parameterName]: 'v1'})
      const secrets = await subject.getSecrets(['p1'])
      expect(secrets).to.not.be.undefined()
      expect(secrets).to.have.property(parameterName, 'v1')
    })

    it('should return an object for multiple parameters', async function () {
      ssm.getParameters.yieldParams({
        '/base/path/p1': 'v1',
        '/base/path/p3': 'v3'
      })
      const secrets = await subject.getSecrets(['p1', 'p3'])
      expect(secrets).to.have.property('/base/path/p1', 'v1')
      expect(secrets).to.have.property('/base/path/p3', 'v3')
    })

    it('should call SSM with the basic required parameters', async function () {
      await subject.getSecrets(['p1'])
      expect(ssm.getParameters).to.be.called.calledWithExactly(
        {
          Names: ['/base/path/p1'],
          WithDecryption: true
        },
        sinon.match.func
      )
    })

    it('should call SSM with multiple names', async function () {
      await subject.getSecrets(['p1', 'p2', 'p3'])
      expect(ssm.getParameters).to.be.calledWithNames(['/base/path/p1', '/base/path/p2', '/base/path/p3'])
    })

    it('should call SSM without having double forward slash when constructing path', async function () {
      await subject.getSecrets(['p1'])
      expect(ssm.getParameters).to.be.calledWithNames(['/base/path/p1'])
    })

    it('should call SSM without adding slash if base path is not specified', async function () {
      const subject = new SsmSecretsStore('')
      await subject.getSecrets(['p1'])
      expect(ssm.getParameters).to.be.calledWithNames(['p1'])
    })
  })

  context('when parameter name is not available', function () {
    it('should throw error if InvalidParameters is not empty', async function () {
      ssm.getParameters.yieldParams({}, ['/base/path/p1'])
      await expect(async () => subject.getSecrets(['p1'])).to.async.throw('/base/path/p1')
    })

    it('should throw error with multiple InvalidParameters information', async function () {
      ssm.getParameters.yieldParams({}, ['p1', 'p2', 'p3'])
      await expect(async () => subject.getSecrets(['p1'])).to.async.throw('p1,p2,p3')
    })
  })
})
