'use strict';

require('dotenv').config();
const request = require('request');

const port = process.env.PORT || 3000;
const api = request.defaults({
  baseUrl: 'http://localhost:' + port + '/api',
  json: true
});

describe('Login API Tests:', function() {
  it('Login with correct credentials', function(done) {
    api.post(
      {
        url: '/login',
        form: {
          username: 'techit',
          password: 'abcd'
        }
      },
      function(err, res, body) {
        expect(res.statusCode).toBe(200);
        expect(body.token).toBeDefined();
        done();
      }
    );
  });

  it('Login with wrong credentials', function(done) {
    api.post(
      {
        url: '/login',
        form: {
          username: 'techit',
          password: 'abcde'
        }
      },
      function(err, res, body) {
        expect(res.statusCode).toBe(401);
        done();
      }
    );
  });
});
