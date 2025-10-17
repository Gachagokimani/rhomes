// init/init-mongo.js
// This script is executed by the official MongoDB entrypoint when the database is first initialized.

(function() {
  const username = process.env.MONGO_INITDB_ROOT_USERNAME || 'admin';
  const password = process.env.MONGO_INITDB_ROOT_PASSWORD || 'dualipamnati';
  const dbName = process.env.MONGO_INITDB_DATABASE || 'mongodb';

  print('Initializing MongoDB database and root user...');

  db = db.getSiblingDB('admin');
  db.createUser({
    user: username,
    pwd: password,
    roles: [ { role: 'root', db: 'admin' } ]
  });

  // Create the application database by switching to it and inserting a dummy doc
  const appDb = db.getSiblingDB(dbName);
  appDb.createCollection('init_collection');
  appDb.init_collection.insertOne({ initialized: true, at: new Date() });

  print('MongoDB initialization script finished.');
})();
