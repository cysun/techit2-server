'use strict';

const _ = require('lodash');
const router = require('express').Router();
const Ticket = require('../models/ticket.model');
const Sequence = require('../models/sequence.model');
const logger = require('../logger').winston;

router.post('/', async (req, res, next) => {
  let ticket = _.omit(req.body, [
    'dateCreated',
    'dateAssigned',
    'dateUpdated',
    'dateClosed',
    'priority',
    'status',
    'technicians',
    'updates'
  ]); // exclude things that should not be set by user
  ticket._id = (await Sequence.nextTicketId()).value;
  ticket.createdBy = req.user;
  new Ticket(ticket).save((err, ticket) => {
    if (err) return next(err);
    res.json(ticket);
    logger.info(`${req.user.username} created ticket ${ticket._id}`);
  });
});

module.exports = router;
