'use strict';

const _ = require('lodash');
const createError = require('http-errors');
const passport = require('passport');
const passportJWT = require('passport-jwt');

passport.use(
  new passportJWT.Strategy(
    {
      secretOrKey: process.env.JWT_SECRET || 'hello',
      jwtFromRequest: passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken()
    },
    function(payload, done) {
      return done(null, payload);
    }
  )
);

/* returns a simple authorization middleware that checks if a user has
 * the allowed role. Note that ADMIN > SUPERVISOR > TECHNICIAN,
 * so for example, if TECHNICIAN is allowed, then ADMIN and SUPERVISOR
 * are also allowed.
 */
function allow(role) {
  return (req, res, next) => {
    let allowed =
      (role === 'ADMIN' && isAdmin(req.user)) ||
      (role === 'SUPERVISOR' && isSupervisor(req.user)) ||
      (role === 'TECHNICIAN' && isTechnician(req.user));

    if (allowed) next();
    else next(createError(403, 'Access Denied'));
  };
}

function isAdmin(user) {
  return user.roles.includes('ADMIN');
}

function isSupervisor(user) {
  return user.roles.includes('SUPERVISOR') || isAdmin(user);
}

function isTechnician(user) {
  return (
    user.roles.includes('TECHNICIAN') || isSupervisor(user) || isAdmin(user)
  );
}

module.exports = {
  passport,
  allow,
  isAdmin,
  isSupervisor,
  isTechnician
};
