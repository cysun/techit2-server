'use strict';

require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const readlineSync = require('readline-sync');
const bcrypt = require('bcrypt');
const saltRounds = 10;

/* Get admin user information */

var admin = {
  _id: 1000,
  roles: ['ADMIN'],
  local: true,
  enabled: true,
  firstName: 'Admin',
  lastName: 'System'
};

admin.username = readlineSync.question('admin username [techit]: ', {
  defaultInput: 'techit'
});

admin.email = admin.username + '@localhost.localdomain';

var password = readlineSync.question('admin password [abcd]: ', {
  defaultInput: 'abcd',
  hideEchoBack: true
});
admin.hash = bcrypt.hashSync(password, saltRounds);

/* Initialize database */

async function dbinit() {
  let dbUrl = process.env.DB_URL;
  let dbName = dbUrl.substring(dbUrl.lastIndexOf('/') + 1);
  const client = await MongoClient.connect(dbUrl);

  let db = client.db(dbName);
  let result = await db.collection('sequences').insertMany([
    {
      _id: 'user-id-sequence',
      value: 10000
    },
    {
      _id: 'ticket-id-sequence',
      value: 10000
    }
  ]);
  console.log(`${result.insertedCount} sequence(s) created.`);

  result = await db.collection('users').insertMany([admin]);
  console.log(`${result.insertedCount} user(s) inserted.`);

  await client.close();
}

dbinit();
