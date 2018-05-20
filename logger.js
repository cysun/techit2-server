/* We'll use PM2 which will redirect console log to a file and handle log file
 * rotation and such.
 */
'use strict';

const winston = require('winston');
const morgan = require('morgan');
const split = require('split');
const env = process.env.NODE_ENV || 'development';

winston.level = process.env.LOG_LEVEL || 'info';
winston.infoStream = split().on('data', function(message) {
  winston.info(message);
}); // see https://github.com/expressjs/morgan/issues/70

module.exports = {
  winston,
  morgan: morgan(env == 'development' ? 'dev' : 'combined', {
    stream: winston.infoStream
  })
};
