'use strict';

const _ = require('lodash');
const createError = require('http-errors');
const auth = require('../auth');
const logger = require('../logger').winston;
const router = require('express').Router();
const User = require('../models/user.model');
const Sequence = require('../models/sequence.model');

// Get all users
router.get('/', auth.allow('ADMIN'), (req, res, next) => {
  User.find({}, '-hash', (err, users) => {
    if (err) return next(err);
    res.json(users);
  });
});

// Get all technicians
router.get('/technicians', (req, res, next) => {
  User.find({ roles: 'TECHNICIAN' }, '-hash', (err, users) => {
    if (err) return next(err);
    res.json(users);
  });
});

// Create a user
router.post('/', auth.allow('ADMIN'), async (req, res, next) => {
  let user = req.body;
  if (!user.username || !user.email || (user.local && !user.password))
    return next(createError(400, 'Missing required field(s)'));

  user._id = (await Sequence.nextUserId()).value;
  user.hash = user.local ? await User.hashPassword(user.password) : '';
  new User(user).save((err, user) => {
    if (err) return next(err);
    res.json(user);
    logger.info(`${req.user.username} created user ${user._id}`);
  });
});

// Get a user
router.get('/:id', (req, res, next) => {
  if (req.user._id != req.params.id && !auth.isAdmin(req.user))
    return next(createError(403, 'Access Denied'));

  User.findById(req.params.id, (err, user) => {
    if (err) return next(err);
    res.json(user);
  });
});

// Edit a user
router.patch('/:id', async (req, res, next) => {
  if (req.user._id != req.params.id && !auth.isAdmin(req.user))
    return next(createError(403, 'Access Denied'));

  let update;
  if (auth.isAdmin(req.user)) update = _.omit(req.body, '_id');
  else
    update = _.pick(req.body, [
      'firstName',
      'lastName',
      'email',
      'phone',
      'department'
    ]);

  if (req.body.password)
    update.hash = await User.hashPassword(req.body.password);

  User.findByIdAndUpdate(req.params.id, update, { new: true }, (err, user) => {
    if (err) return next(err);
    res.json(user);
    logger.info(`${req.user.username} edited user ${req.params.id}`);
  });
});

module.exports = router;
