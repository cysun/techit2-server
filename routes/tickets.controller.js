'use strict';

const _ = require('lodash');
const createError = require('http-errors');
const auth = require('../auth');
const logger = require('../logger').winston;
const router = require('express').Router();
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
  });
});

// Get a ticket
router.get('/:id', (req, res, next) => {
  Ticket.findById(req.params.id)
    .populate('createdBy')
    .populate('technicians')
    .exec((err, ticket) => {
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
    res.status(200).end();
    logger.info(`${req.user.username} deleted ticket ${req.params.id}`);
  });
});

// Assign a technician to a ticket
router.put('/:ticketId/technicians/:userId', (req, res, next) => {
  if (
    !auth.isSupervisor(req.user) &&
    !(req.user._id == req.params.userId && auth.isTechnician(req.user))
  )
    return next(createError(403, 'Access Denied'));

  Ticket.findByIdAndUpdate(
    req.params.ticketId,
    { $addToSet: { technicians: req.params.userId } },
    err => {
      if (err) return next(err);
      res.status(200).end();
      logger.info(
        `${req.user.username} assigned technician ${req.params.userId} to ${
          req.params.ticketId
        }`
      );
    }
  );
});

// Remove a technican from a ticket
router.delete('/:ticketId/technicians/:userId', (req, res, next) => {
  if (!auth.isSupervisor(req.user))
    return next(createError(403, 'Access Denied'));

  Ticket.findByIdAndUpdate(
    req.params.ticketId,
    { $pull: { technicians: req.params.userId } },
    err => {
      if (err) return next(err);
      res.status(200).end();
      logger.info(
        `${req.user.username} removed technician ${req.params.userId} from ${
          req.params.ticketId
        }`
      );
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
      date: Date.now
    }
  };
  Ticket.findByIdAndUpdate(
    req.params.id,
    { $push: { updates: update } },
    err => {
      if (err) return next(err);
      res.status(200).end();
      logger.info(
        `${req.user.username} posted an update to ticket ${req.params.id}`
      );
    }
  );
});

// Set the status or priority of a ticket
router.put(
  '/:id/:field(status|priority)/:value',
  auth.allow('SUPERVISOR'),
  (req, res, next) => {
    let update = {
      details: req.body.comments,
      technician: {
        id: req.user._id,
        username: req.user.username,
        date: Date.now
      }
    };
    if (!update.details) {
      update.details = `${req.user.firstName} ${req.user.lastName} set ${
        req.params.field
      } to ${req.params.value}`;
    }

    let update1 = {};
    update1[req.params.field] = req.params.value;
    let update2 = { updates: update };
    Ticket.findByIdAndUpdate(
      req.params.id,
      {
        $set: update1,
        $push: update2
      },
      err => {
        if (err) return next(err);
        res.status(200).end();
        logger.info(
          `${req.user.username} set ${req.params.field} of ticket ${
            req.params.id
          } to ${req.params.value}`
        );
      }
    );
  }
);

module.exports = router;
