'use strict';

const _ = require('lodash');
const nodemailer = require('nodemailer');
const Email = require('email-templates');
const logger = require('./logger').winston;
const User = require('./models/user.model');
const Ticket = require('./models/ticket.model');

const appUrl = process.env.APP_URL || 'http://localhost:3000';

const transport = nodemailer.createTransport({
  host: process.env.SMTP_SERVER || 'localhost',
  port: 25,
  secure: false,
  auth: {
    user: process.env.SMTP_USERNAME || 'cysun@localhost.localdomain',
    pass: process.env.SMTP_PASSWORD || 'abcd'
  }
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
      user
    }
  });
  logger.info(`Ticket-Created email sent to ${recipients}`);
}

async function statusChanged(ticket, oldStatus, user) {
  let recipients = await getRecipients(await getTicket(ticket._id), user);
  let result = await email.send({
    template: 'status-changed',
    message: {
      bcc: recipients
    },
    locals: {
      appUrl,
      ticket,
      oldStatus,
      user
    }
  });
  logger.info(`Status-Changed email sent to ${recipients}`);
}

async function updateAdded(ticketId, update, user) {
  let ticket = await getTicket(ticketId);
  let recipients = await getRecipients(ticket, user);
  let result = await email.send({
    template: 'update-added',
    message: {
      bcc: recipients
    },
    locals: {
      appUrl,
      ticket,
      update,
      user
    }
  });
  logger.info(`Update-Added email sent to ${recipients}`);
}

module.exports = {
  ticketCreated,
  statusChanged,
  updateAdded
};
