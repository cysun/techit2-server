'use strict';

const _ = require('lodash');
const createError = require('http-errors');
const router = require('express').Router();
const auth = require('../auth');
const logger = require('../logger').winston;
const email = require('../email');
const Ticket = require('../models/ticket.model');
const Sequence = require('../models/sequence.model');

// Get all tickets
router.get('/', auth.allow('TECHNICIAN'), (req, res, next) => {
  Ticket.find({}, (err, tickets) => {
    if (err) return next(err);
    res.json(tickets);
  });
});

// Create a ticket
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
    email.ticketCreated(ticket, req.user);
  });
});

router.get('/submitted', (req, res, next) => {
  Ticket.find({ createdBy: req.user._id }, (err, tickets) => {
    if (err) return next(err);
    res.json(tickets);
  });
});

router.get('/assigned', (req, res, next) => {
  Ticket.find({ technicians: req.user._id }, (err, tickets) => {
    if (err) return next(err);
    res.json(tickets);
  });
});

// Search tickets
router.get('/search', (req, res, next) => {
  let term = req.query.term || req.body.term;
  if (!term) return next(createError(400, 'Missing search term'));

  Ticket.find({ $text: { $search: term } }, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .exec((err, tickets) => {
      if (err) return next(err);
      res.json(tickets);
    });
});

// Get a ticket
router.get('/:id', (req, res, next) => {
  Ticket.findById(req.params.id)
    .populate('createdBy', '-hash')
    .populate('technicians', '-hash')
    .exec((err, ticket) => {
      if (err) return next(err);
      if (ticket == null) return next(createError(404, 'No ticket found'));
      if (req.user._id != ticket.createdBy._id && !auth.isTechnician(req.user))
        return next(createError(403, 'Access Denied'));
      res.json(ticket);
    });
});

// Delete a ticket
router.delete('/:id', auth.allow('ADMIN'), (req, res, next) => {
  Ticket.findByIdAndRemove(req.params.id, err => {
    if (err) return next(err);
    res.status(204).end();
    logger.info(`${req.user.username} deleted ticket ${req.params.id}`);
  });
});

// Assign technician(s) to a ticket
router.put('/:id/technicians', auth.allow('SUPERVISOR'), (req, res, next) => {
  let technicians = _.compact(req.body.technicians);
  let update = {
    summary:
      technicians.length > 0
        ? 'Assigned technician(s) to ticket'
        : 'Removed technician(s) from ticket',
    technician: {
      id: req.user._id,
      username: req.user.username,
      date: new Date()
    }
  };

  Ticket.findByIdAndUpdate(
    req.params.id,
    {
      $set: { technicians: technicians, dateUpdated: new Date() },
      $push: { updates: update }
    },
    (err, ticket) => {
      if (err) return next(err);
      res.status(204).end();
      logger.info(
        `${req.user.username} set technician(s) ${technicians} to ticket ${
          req.params.id
        }`
      );
      email.ticketUpdated(ticket, req.user, update);
    }
  );
});

// Add an update to a ticket
router.post('/:id/updates', auth.allow('TECHNICIAN'), (req, res, next) => {
  let update = {
    details: req.body.details,
    technician: {
      id: req.user._id,
      username: req.user.username,
      date: new Date()
    }
  };
  Ticket.findByIdAndUpdate(
    req.params.id,
    {
      $set: { dateUpdated: new Date() },
      $push: { updates: update }
    },
    (err, ticket) => {
      if (err) return next(err);
      res.status(204).end();
      logger.info(
        `${req.user.username} posted an update to ticket ${req.params.id}`
      );
      email.ticketUpdated(ticket, req.user, update);
    }
  );
});

// Set priority or status
router.put(
  '/:id/:field/:value',
  auth.allow('SUPERVISOR'),
  async (req, res, next) => {
    let field = req.params.field.toLowerCase();
    let value = req.params.value.toUpperCase();
    if (field != 'priority' && field != 'status')
      return next(createError(400, 'Invalid field'));

    try {
      let ticket = await Ticket.findById(req.params.id);
      if (ticket == null) return next(createError(404, 'Ticket not found'));
      let oldValue = ticket[field];
      if (oldValue == value) return next(createError(409, 'Value already set'));

      ticket[field] = value;
      let update = {
        summary: `Ticket ${field} set to ${value}`,
        technician: {
          id: req.user._id,
          username: req.user.username
        },
        date: new Date()
      };
      if (req.body.details) update.details = req.body.details;

      ticket.updates.push(update);
      ticket.dateUpdated = new Date();
      ticket = await ticket.save();
      res.status(204).end();
      logger.info(
        `${req.user.username} set ${field} of ticket ${
          req.params.id
        } to ${value}`
      );

      if (field == 'status') email.ticketUpdated(ticket, req.user, update);
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
