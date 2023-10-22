/**
 * Required External Modules
 */
const express = require('express');
const { google } = require('googleapis');
const path = require('path');
const url = require('url');
const students = require('./student');

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
  'http://localhost:8000/oauth2callback'
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
app.set('views', './templates');
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, 'templates')));
app.use(express.static(path.join(__dirname, 'static')));
app.use(express.static(path.join(__dirname, '.')));
app.use(express.json());

/**
 * Routes Definitions
 */
app.get('/', (req, res) => {
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

  res.redirect('/students');
});

app.get('/students/rows', async (req, res) => {
  // Example of using Sheets API to list filenames in user's Drive.
  const sheets = google.sheets({version: 'v4', auth: oauth2Client});
  let response;
  try {
    response = await sheets.spreadsheets.values.get({
      spreadsheetId: '1jFT3SCoOuMwJnsRJxuD7D2Eq6hKgne6nEam1RdLlPmM',
      range: 'Daily Data!B3:B300',
    });
  }
  catch (err) {
    console.log(err);
    return;
  }

  const range = response.data;

  if (!range || !range.values || range.values.length == 0) {
    return;
  }

  // convert 2D array to 1D array
  let all_students = [];
  for (i in range.values) {
    all_students = all_students.concat(range.values[i]);
  }

  // set sheet row for each student
  const rows = []
  for (i in students) {
    for (j in students[i]) {
      const student = students[i][j];
      const name = student.last_name + ", " + student.first_name;
      const index = containsSubstring(all_students, name);
      rows.push(index + 3);
    }
  }

  res.send(rows);
});

function containsSubstring(array, str) {
  let i = 0;
  for (substr of array) {
    if (str.includes(substr)) {
      return i;
    }
    i++;
  }
  return -1;
}

app.get('/students', (req, res) => {
  res.render('index', {periods: periods, students: students});
});

app.post('/students/dailydata', (req, res) => {
  const period = req.body['period'];
  const ranges = req.body['ranges'];
  const values = req.body['values'];
  batchUpdateValues("1jFT3SCoOuMwJnsRJxuD7D2Eq6hKgne6nEam1RdLlPmM",
                      ranges,
                      values,
                      'RAW', 
                      (response) => {
                        res.send({period: period});
                      });
});

function batchUpdateValues(spreadsheetId, ranges, values, valueInputOption, callback) {
  const data = [];

  for (i in values) {
    data.push({
      range: "Daily Data!" + ranges[i],
      values: values[i],
    });
  }
  
  const body = {
    data: data,
    valueInputOption: valueInputOption,
  };
  const sheets = google.sheets({version: 'v4', auth: oauth2Client});
  try {
    sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: spreadsheetId,
      resource: body,
    }).then((response) => {
      const data = response.data;
      console.log(`${data.totalUpdatedCells} cells updated.`);
      if (callback) callback(response);
    });
  } catch (err) {
    console.log(err.message);
  }
}

/**
 * Server Activation
 */
app.listen(port, () => console.log(`Listening on port ${port}...`));