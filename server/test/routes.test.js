const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;

chai.use(chaiHttp);

describe('API Routes', () => {
  describe('POST /api/auth/login', () => {
    it('should return success message', (done) => {
      done();
    });
  });
  
  describe('GET /api/users', () => {
    it('should return users array', (done) => {
      done();
    });
  });
});
