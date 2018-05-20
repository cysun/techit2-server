'use strict';

const mongoose = require('mongoose');

/* Use a single MongoDB document to create a unique integer id sequence. Having
 * an integer id is important for tickets because we want users to be able to
 * refer to a ticket by a number.
 * 
 * This approach is not recommended for a busy system (see a discussion at
 * https://www.mongodb.com/blog/post/generating-globally-unique-identifiers-for-use-with-mongodb),
 * but TechIT will be used only by TechOps and ECST lab coordinators so
 * contention will not be a problem.
 */
const sequenceSchema = new mongoose.Schema(
  {
    _id: String,
    value: {
      type: Number,
      default: 10000
    }
  },
  { collection: 'sequences' }
);

sequenceSchema.statics.nextUserId = function() {
  return this.findByIdAndUpdate('user-id-sequence', {
    $inc: { value: 1 }
  }).exec(); // return promise
};

sequenceSchema.statics.nextTicketId = function() {
  return this.findByIdAndUpdate('ticket-id-sequence', {
    $inc: { value: 1 }
  }).exec(); // return promise
};

module.exports = mongoose.model('Sequence', sequenceSchema);
