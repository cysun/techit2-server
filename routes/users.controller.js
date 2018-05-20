'use strict';

const router = require('express').Router();
const auth = require('../auth');
const User = require('../models/user.model');

router.get('/', auth.allow('ADMIN'), (req, res, next) => {
  User.find({}, '-hash', (err, users) => {
    if (err) return next(err);
    res.json(users);
  });
});

module.exports = router;
