'use strict';

const router = require('express').Router();
const createError = require('http-errors');
const logger = require('../logger').winston;
const User = require('../models/user.model');

const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET || 'hello';
const jwtExpire = process.env.JWT_EXPIRE || '7d';

const ActiveDirectory = require('activedirectory');
const domain = 'ad.calstatela.edu';
const ad = new ActiveDirectory({
  url: 'ldap://' + domain,
  baseDN: 'dc=ad,dc=calstatela,dc=edu'
});
const adAuthenticate = Promise.promisify(ad.authenticate, {
  context: ad
});

/* username and password are sent in either as post request parameter or a json
 * object inside request body.
 */
router.post('/', async (req, res, next) => {
  let username = req.query.username || req.body.username;
  let password = req.query.password || req.body.password;
  if (!username || !password)
    return next(createError(400, 'Missing username/password'));

  try {
    let user = await User.findOne({ username });
    if (!user) return next(createError(404, 'User not found'));

    let authenticated = user.local
      ? await user.comparePassword(password)
      : await adAuthenticate(username + '@' + domain, password);

    if (authenticated) {
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
  } catch (err) {
    if (err.name === 'InvalidCredentialsError') {
      next(createError(401, 'Login failed'));
      logger.info(`${username} AD login failed`);
    } else return next(err);
  }
});

module.exports = router;
