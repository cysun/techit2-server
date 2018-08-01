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
  let adminToken = '';
  let newTicketId = -1;

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
        newTicketId = body._id;
        done();
      }
    );
  });

  it('Set ticket status', function(done){
    api.put(
      {
        url: '/tickets/1/status/CLOSED',
        headers: {
          Authorization: 'Bearer ' + adminToken
        }
      },
      function(err, res, body) {
        expect(res.statusCode).toBe(204);
        done();
      }
    );
  });

  afterAll(function(done) {
    if (newTicketId < 0) return done();
    api.delete(
      {
        url: '/tickets/' + newTicketId,
        headers: {
          Authorization: 'Bearer ' + adminToken
        }
      },
      function(err, res, body) {
        if (res.statusCode != 200) console.log(res.statusCode);
        done();
      }
    );
  });
});
