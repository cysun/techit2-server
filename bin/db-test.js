/**
 * This is a Mongo Shell script. Run it with Mongo shell on command line:
 *     mongo db-test.js
 * or inside Mongo shell: load('mongodb-test.js')
 */
db = connect('localhost/techit2');

print('Connected to database: techit2');

// drop the collections if they already exist

db.tickets.drop();
db.users.drop();
db.sequences.drop();

// create sequences
db.sequences.insertMany([
  {
    _id: 'user-id-sequence',
    value: 1000
  },
  {
    _id: 'ticket-id-sequence',
    value: 1000
  }
]);

// create users (all hash are bcrypt('abcd'))

admin = {
  _id: 1,
  username: 'techit',
  hash: '$2a$10$v2/oF1tdBlXxejoMszKW3eNp/j6x8CxSBURUnVj006PYjYq3isJjO',
  roles: ['ADMIN'],
  local: true,
  enabled: true,
  firstName: 'Admin',
  lastName: 'System',
  email: 'techit@localhost.localdomain',
  phone: '323-343-1234'
};

supervisor1 = {
  _id: 2,
  username: 'jsmith1',
  hash: '$2a$10$9PJIPq9PMYHd9L8kb66/Nuu7DDQqq29eOsVF1F8SnPZ2UfD6KC/ly',
  roles: ['SUPERVISOR'],
  local: true,
  enabled: true,
  firstName: 'John',
  lastName: 'Smith',
  email: 'jsmith1@localhost.localdomain',
  phone: '323-343-2345'
};

supervisor2 = {
  _id: 3,
  username: 'jsmith2',
  hash: '$2a$10$9PJIPq9PMYHd9L8kb66/Nuu7DDQqq29eOsVF1F8SnPZ2UfD6KC/ly',
  roles: ['SUPERVISOR', 'TECHNICIAN'],
  local: true,
  enabled: true,
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jsmith2@localhost.localdomain',
  phone: '323-343-3456'
};

tech1 = {
  _id: 4,
  username: 'jjim',
  hash: '$2a$10$Q8G5BtMC.C5oonZzvBS.0usxJ2fpccf.I46pw3IGi.zorntvTSYbK',
  roles: ['TECHNICIAN'],
  local: true,
  enabled: true,
  firstName: 'Jimmy',
  lastName: 'Jim',
  email: 'jjim@localhost.localdomain',
  phone: '323-343-4567'
};

tech2 = {
  _id: 5,
  username: 'blee',
  hash: '$2a$10$d8lhouzPhxZ.nLCaqjh5gevTyA3tZDUMwuy2WAsWAm.i/ag/btcxe',
  roles: ['TECHNICIAN'],
  local: true,
  enabled: true,
  firstName: 'Bob',
  lastName: 'Lee',
  email: 'blee@localhost.localdomain',
  phone: '323-343-5678'
};

user = {
  _id: 6,
  username: 'jojo',
  hash: '$2a$10$Qn0U5T00Fkutb7UyBE9yg.aOBp2Z9OqN4SAWCSkdm4mrZmYIuYpq.',
  roles: [],
  local: true,
  enabled: true,
  firstName: 'Joseph',
  lastName: 'Joestar',
  email: 'jojo@localhost.localdomain',
  phone: '323-343-6789'
};

db.users.insertMany([admin, supervisor1, supervisor2, tech1, tech2, user]);

// create tickets

ticket1 = {
  _id: 1,
  createdBy: 6,
  createdForName: user.firstName + ' ' + user.lastName,
  createdForEmail: user.email,
  subject: 'Projector Malfunction',
  details: 'The projector is broken in room A220.',
  dateCreated: new Date(),
  priority: 'MEDIUM',
  status: 'OPEN',
  technicians: [],
  updates: []
};

ticket2 = {
  _id: 2,
  createdBy: 6,
  createdForName: user.firstName + ' ' + user.lastName,
  createdForEmail: user.email,
  subject: 'Senior Design 2018 Equipment Request',
  details: 'One of the EE senior design projects needs some equipment.',
  dateCreated: new Date(),
  priority: 'MEDIUM',
  status: 'OPEN',
  technicians: [],
  updates: []
};

ticket3 = {
  _id: 3,
  createdBy: 6,
  createdForName: user.firstName + ' ' + user.lastName,
  createdForEmail: user.email,
  subject: 'ME Lab Improvements',
  details: 'Update testing equipment in the ME lab.',
  dateCreated: new Date(),
  dateUpdated: new Date(),
  priority: 'MEDIUM',
  status: 'OPEN',
  technicians: [4],
  updates: [
    {
      _id: ObjectId(),
      summary: 'Ticket assigned to Jimmy Jim',
      technician: {
        id: 2,
        username: 'jsmith1',
        date: new Date()
      }
    },
    {
      _id: ObjectId(),
      details: 'Work order completed. Waiting approval by supervisor.',
      technician: {
        id: 4,
        username: 'jjim',
        date: new Date()
      }
    }
  ]
};

db.tickets.insertMany([ticket1, ticket2, ticket3]);
