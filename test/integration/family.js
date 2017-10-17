import mochaPlugin from 'serverless-mocha-plugin';

const { expect } = mochaPlugin.chai;
const wrapped = mochaPlugin.getWrapper('getFamily', '/src/handlers/family', 'get');

describe('getFamily', () => {
  before((done) => {
    done();
  });

  it('implement tests here', () =>
    wrapped.run({}).then((response) => {
      expect(response).to.not.be.empty;
    }));
});
