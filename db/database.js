const dbDebugger = require('debug')('app:db');
const sqlite3 = require('sqlite3').verbose();

// open the database
const db = new sqlite3.Database('./db/data_tracker.db', (err) => {
    if (err) {
        dbDebugger(err.message);
    }
    else {
        dbDebugger('Connected to the data_tracker database.');
    }
});

module.exports = db;