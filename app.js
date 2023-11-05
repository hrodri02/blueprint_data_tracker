/**
 * Required External Modules
 */
const process = require('process');
const express = require('express');
const oauth2Client = require('./google');
const path = require('path');
const url = require('url');
const students = require('./routes/students');
const db = require('./db/database');
const dbDebugger = require('debug')('app:db');

 /**
 * App Variables
 */
const app = express();
const port = process.env.PORT || 8000;

// Access scopes for read-only Drive activity.
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets'
];

/**
 *  App Configuration
 */
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '.')));
app.use(express.json());
app.use('/students', students);

/**
 * Routes Definitions
 */
app.get('/auth', (req, res) => {
  // Generate a url that asks permissions for the Sheets activity scope
  const authorizationUrl = oauth2Client.generateAuthUrl({
    // 'online' (default) or 'offline' (gets refresh_token)
    access_type: 'offline',
    /** Pass in the scopes array defined above.
      * Alternatively, if only one scope is needed, you can pass a scope URL as a string */
    scope: SCOPES,
    // Enable incremental authorization. Recommended as a best practice.
    include_granted_scopes: true
  });
  res.writeHead(301, {"Location": authorizationUrl });
  res.send();
});

app.get('/oauth2callback', async (req, res) => {
  // Handle the OAuth 2.0 server response
  let q = url.parse(req.url, true).query;
  // console.log(req.url);

  if (q.error) { // An error response e.g. error=access_denied
    console.log('Error:' + q.error);
  } else { // Get access and refresh tokens (if access_type is offline)
    const { tokens } = await oauth2Client.getToken(q.code);
    oauth2Client.setCredentials(tokens);
  }

  res.send({message: 'authorized'});
});

/**
 * Server Activation
 */
app.listen(port, () => console.log(`Listening on port ${port}...`));

/**
 * Server Deactivation
 */
process.on('SIGINT', () => {
  // close the database connection
  db.close((err) => {
    if (err) {
      dbDebugger(err.message);
    }
    else {
      dbDebugger('DB closed.');
    }
    process.exit(1);
  });
});