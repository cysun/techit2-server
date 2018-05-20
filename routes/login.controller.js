'use strict';

const router = require('express').Router();
const createError = require('http-errors');
const logger = require('../logger').winston;
const User = require('../models/user.model');

const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET || 'hello';
const jwtExpire = process.env.JWT_EXPIRE || '7d';

/* username and password are sent in either as post request parameter or a json
 * object inside request body.
 */
router.post('/', (req, res, next) => {
  let username = req.query.username || req.body.username;
  let password = req.query.password || req.body.password;
  if (!username || !password)
    return next(createError(400, 'Missing username/password'));

  User.findOne({ username }, (err, user) => {
    if (err) return next(err);
    if (!user) return next(createError(404, 'User not found'));
    user
      .comparePassword(password)
      .then(match => {
        if (match) {
          res.json({
            token: jwt.sign(user.excludeFields(), jwtSecret, {
              expiresIn: jwtExpire
            })
          });
          logger.info(`${username} login successful`);
        } else {
          next(createError(401, 'Login failed'));
          logger.info(`${username} login failed`);
        }
      })
      .catch(err => next(err));
  });
});

module.exports = router;
