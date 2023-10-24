/**
 * Required External Modules
 */
const express = require('express');
const { google } = require('googleapis');
const path = require('path');
const url = require('url');
const students = require('./routes/students');

 /**
 * App Variables
 */
const app = express();
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const port = process.env.PORT || 8000;

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  'http://localhost:8000/students'
);

// Access scopes for read-only Drive activity.
const scopes = [
  'https://www.googleapis.com/auth/spreadsheets'
];

// Generate a url that asks permissions for the Sheets activity scope
const authorizationUrl = oauth2Client.generateAuthUrl({
  // 'online' (default) or 'offline' (gets refresh_token)
  access_type: 'offline',
  /** Pass in the scopes array defined above.
    * Alternatively, if only one scope is needed, you can pass a scope URL as a string */
  scope: 'https://www.googleapis.com/auth/spreadsheets',
  // Enable incremental authorization. Recommended as a best practice.
  include_granted_scopes: true
});

/* Global variable that stores user credential in this code example.
 * ACTION ITEM for developers:
 *   Store user's refresh token in your data store if
 *   incorporating this code into your real app.
 *   For more information on handling refresh tokens,
 *   see https://github.com/googleapis/google-api-nodejs-client#handling-refresh-tokens
 */
let userCredential = null;

const periods = ["First", "Second", "Third", "Fourth", "Sixth", "Seventh"];

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
app.get('/', (req, res) => {
  res.writeHead(301, {"Location": authorizationUrl });
  console.log(authorizationUrl);
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
    const access_token = tokens['access_token'];
    oauth2Client.setCredentials(
      {
        access_token: access_token
      }
    );

    /** Save credential to the global variable in case access token was refreshed.
      * ACTION ITEM: In a production app, you likely want to save the refresh token
      *              in a secure persistent database instead. */
    userCredential = tokens;
  }

  res.send('done');
});

/**
 * Server Activation
 */
app.listen(port, () => console.log(`Listening on port ${port}...`));