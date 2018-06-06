'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let ticketSchema = new Schema(
  {
    _id: Number,
    createdBy: {
      type: Number,
      ref: 'User',
      required: true
    },
    createdForName: {
      type: String,
      required: true
    },
    createdForEmail: {
      type: String,
      required: true
    },
    createdForPhone: String,
    createdForDepartment: String,
    subject: {
      type: String,
      required: true
    },
    details: String,
    location: String,
    dateCreated: {
      type: Date,
      default: Date.now
    },
    dateAssigned: Date,
    dateUpdated: Date,
    dateClosed: Date,
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM'
    },
    status: {
      type: String,
      enum: ['OPEN', 'ASSIGNED', 'ONHOLD', 'COMPLETED', 'CLOSED'],
      default: 'OPEN'
    },
    technicians: [
      {
        type: Number,
        ref: 'User'
      }
    ],
    updates: [
      {
        details: String,
        technician: {
          id: Number,
          username: String
        },
        date: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  { collection: 'tickets' }
);

ticketSchema.index(
  {
    subject: 'text',
    details: 'text',
    'updates.details': 'text'
  },
  {
    weights: {
      subject: 10,
      details: 5,
      'updates.details': 1
    },
    name: 'TicketTextIndex'
  }
);

module.exports = mongoose.model('Ticket', ticketSchema);
