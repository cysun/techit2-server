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
router.put('/:id/technicians/:userId', async (req, res, next) => {
  if (
    !auth.isSupervisor(req.user) &&
    !(req.user._id == req.params.userId && auth.isTechnician(req.user))
  )
    return next(createError(403, 'Access Denied'));

  try {
    let ticket = await Ticket.findById(req.params.id);
    if (ticket.technicians.includes(parseInt(req.params.userId)))
      return next(createError(409, 'Technician already assigned'));

    let oldStatus = ticket.status;
    if (oldStatus == 'OPEN') ticket.status = 'ASSIGNED';
    ticket.technicians.push(req.params.userId);
    ticket = await ticket.save();
    res.status(200).end();
    logger.info(
      `${req.user.username} assigned technician ${
        req.params.userId
      } to ticket ${req.params.id}`
    );

    if (oldStatus != ticket.status)
      email.statusChanged(ticket, oldStatus, req.user);
  } catch (err) {
    return next(err);
  }
});

// Remove a technican from a ticket
router.delete('/:id/technicians/:userId', async (req, res, next) => {
  if (!auth.isSupervisor(req.user))
    return next(createError(403, 'Access Denied'));

  try {
    let ticket = await Ticket.findById(req.params.id);
    if (!ticket.technicians.includes(parseInt(req.params.userId)))
      return next(createError(404, 'Technician not found'));

    ticket.technicians.pull(req.params.userId);
    let oldStatus = ticket.status;
    if (ticket.technicians.length == 0 && oldStatus == 'ASSIGNED')
      ticket.status = 'OPEN';
    ticket = await ticket.save();
    res.status(200).end();
    logger.info(
      `${req.user.username} removed technician ${
        req.params.userId
      } from ticket ${req.params.id}`
    );

    if (oldStatus != ticket.status)
      email.statusChanged(ticket, oldStatus, req.user);
  } catch (err) {
    return next(err);
  }
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
      email.updateAdded(req.params.id, update, req.user);
    }
  );
});

// Set the status of a ticket
router.put(
  '/:id/status/:status',
  auth.allow('SUPERVISOR'),
  async (req, res, next) => {
    try {
      let ticket = await Ticket.findById(req.params.id);
      if (ticket == null) return next(createError(404, 'Ticket not found'));
      if (ticket.status == req.params.status)
        return next(createError(409, 'Status already set'));

      let oldStatus = ticket.status;
      ticket.status = req.params.status;
      let update = {
        details: req.body.comments,
        technician: {
          id: req.user._id,
          username: req.user.username,
          date: Date.now()
        }
      };
      if (!update.details)
        update.details = `Set status to ${req.params.status}`;

      ticket.updates.push(update);
      ticket = await ticket.save();
      res.status(200).end();
      logger.info(
        `${req.user.username} set status of ticket ${req.params.id} to ${
          req.params.status
        }`
      );
      email.statusChanged(ticket, oldStatus, req.user);
    } catch (err) {
      return next(err);
    }
  }
);

// Set the priority of a ticket
router.put(
  '/:id/priority/:priority',
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
    if (!update.details)
      update.details = `Set priority to ${req.params.priority}`;

    Ticket.findByIdAndUpdate(
      req.params.id,
      {
        $set: { priority: req.params.priority },
        $push: { updates: update }
      },
      err => {
        if (err) return next(err);
        res.status(200).end();
        logger.info(
          `${req.user.username} set priority of ticket ${req.params.id} to ${
            req.params.priority
          }`
        );
      }
    );
  }
);

module.exports = router;
