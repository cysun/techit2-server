'use strict';

require('dotenv').config();
const request = require('request');

const port = process.env.PORT || 3000;
const api = request.defaults({
  baseUrl: 'http://localhost:' + port + '/api',
  json: true
});

describe('Users API Tests:', function() {
  let adminToken = '';
  let userToken = '';

  beforeAll(function(done) {
    api.post(
      {
        url: '/login',
        form: {
          username: 'techit',
          password: 'abcd'
        }
      },
      function(err, res, body) {
        adminToken = body.token;
        done();
      }
    );
  });

  beforeAll(function(done) {
    api.post(
      {
        url: '/login',
        form: {
          username: 'jojo',
          password: 'abcd'
        }
      },
      function(err, res, body) {
        userToken = body.token;
        done();
      }
    );
  });

  it('Get all users as ADMIN', function(done) {
    api.get(
      {
        url: '/users',
        headers: {
          Authorization: 'Bearer ' + adminToken
        }
      },
      function(err, res, body) {
        expect(res.statusCode).toBe(200);
        expect(body.length).toBeGreaterThanOrEqual(6);
        done();
      }
    );
  });

  it('Get all users as USER', function(done) {
    api.get(
      {
        url: '/users',
        headers: {
          Authorization: 'Bearer ' + userToken
        }
      },
      function(err, res, body) {
        expect(res.statusCode).toBe(403);
        expect(body.message).toBe('Access Denied');
        done();
      }
    );
  });
});
