'use strict';

const _ = require('lodash');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;

let userSchema = new mongoose.Schema(
  {
    _id: Number,
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    hash: {
      type: String,
      default: ''
    },
    roles: [{ type: String, enum: ['ADMIN', 'SUPERVISOR', 'TECHNICIAN'] }],
    local: {
      type: Boolean,
      default: true
    },
    enabled: {
      type: Boolean,
      default: true
    },
    firstName: String,
    lastName: String,
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    phone: String,
    department: String
  },
  { collection: 'users' }
);

userSchema.methods.hashPassword = function(password) {
  return bcrypt.hash(password, saltRounds); // return promise
};

userSchema.methods.comparePassword = function(password) {
  return bcrypt.compare(password, this.hash); // return promise
};

userSchema.methods.excludeFields = function() {
  return _.omit(this.toObject(), ['hash']);
};

module.exports = mongoose.model('User', userSchema);
