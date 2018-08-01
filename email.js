'use strict';

const _ = require('lodash');
const nodemailer = require('nodemailer');
const Email = require('email-templates');
const logger = require('./logger').winston;
const User = require('./models/user.model');
const Ticket = require('./models/ticket.model');

const appUrl = process.env.APP_URL || 'http://localhost:3000';

const transport = nodemailer.createTransport({
  host: 'localhost',
  port: 25,
  secure: false,
  ignoreTLS: true
});

const email = new Email({
  message: {
    from: process.env.APP_EMAIL || 'techit@localhost.localdomain',
    to: process.env.APP_EMAIL || 'techit@localhost.localdomain'
  },
  send: true,
  preview: false,
  transport: transport,
  views: {
    options: {
      extension: 'hbs'
    }
  }
});

async function getTicket(ticketId) {
  return await Ticket.findById(ticketId)
    .populate('createdBy')
    .populate('technicians')
    .exec();
}

async function getRecipients(ticket, user) {
  let supervisors = await User.find({ roles: 'SUPERVISOR' }).exec();
  let recipients = _.concat(
    supervisors.map(supervisor => supervisor.email),
    ticket.technicians.map(technician => technician.email),
    ticket.createdBy.email
  );
  return _.pull(recipients, user.email);
}

async function ticketCreated(ticket, user) {
  try {
    let supervisors = await User.find({ roles: 'SUPERVISOR' }).exec();
    let recipients = supervisors.map(supervisor => supervisor.email);
    let result = await email.send({
      template: 'ticket-created',
      message: {
        bcc: recipients
      },
      locals: {
        appUrl,
        ticket,
        user,
        shortDate: new Date().toLocaleDateString()
      }
    });
    logger.info(`TicketCreated email sent to ${recipients}`);
  } catch (err) {
    logger.error('Failed to send TicketCreated email');
    logger.error(err);
  }
}

async function ticketUpdated(ticket, user, update) {
  try {
    let recipients = await getRecipients(await getTicket(ticket._id), user);
    let result = await email.send({
      template: 'ticket-updated',
      message: {
        bcc: recipients
      },
      locals: {
        appUrl,
        ticket,
        user,
        update,
        shortDate: new Date().toLocaleDateString()
      }
    });
    logger.info(`TicketUpdated email sent to ${recipients}`);
  } catch (err) {
    logger.error('Failed to send TicketUpdated email');
    logger.error(err);
  }
}

module.exports = {
  ticketCreated,
  ticketUpdated
};
