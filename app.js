/**
 * Required External Modules
 */
const fs = require('fs').promises;
const process = require('process');
const express = require('express');
const {google} = require('googleapis');
const path = require('path');
const url = require('url');
const students = require('./routes/students');

 /**
 * App Variables
 */
const app = express();
const port = process.env.PORT || 8000;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  'http://localhost:8000/oauth2callback'
);

oauth2Client.on('tokens', (tokens) => {
  if (tokens.refresh_token) {
    // TODO: - store refresh token in a database
    try { 
      fs.writeFile('refreshToken.txt', tokens.refresh_token); 
      console.log("File has been saved.");
    } catch (error) { 
      console.error(err); 
    } 
  }
  // console.log(tokens.access_token);
});

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