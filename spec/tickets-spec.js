'use strict';

require('dotenv').config();
const request = require('request');

const port = process.env.PORT || 3000;
const api = request.defaults({
  baseUrl: 'http://localhost:' + port + '/api',
  json: true
});

describe('Tickets API Tests:', function() {
  let userToken = '';

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

  it('Create a new ticket', function(done) {
    let ticket = {
      createdForName: 'Joseph Joestar',
      createdForEmail: 'jojo@localhost.localdomain',
      subject: 'Test Ticket',
      details: 'this is a test ticket'
    };
    api.post(
      {
        url: '/tickets',
        headers: {
          Authorization: 'Bearer ' + userToken
        },
        body: ticket
      },
      function(err, res, body) {
        expect(res.statusCode).toBe(200);
        expect(body._id).toBeDefined();
        expect(body.status).toBe('OPEN');
        expect(body.priority).toBe('MEDIUM');
        done();
      }
    );
  });
});
