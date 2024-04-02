const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const url = require('url');
const {google} = require('googleapis');
const googleDebugger = require('debug')('app:google');
const config = require('config');
const db = require('../db/database');
const dbDebugger = require('debug')('app:db');
const helper = require('../helpers/helper');
const domain = "blueprintschoolsnetwork.com";

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets'
];
const oauth2Client = new google.auth.OAuth2(
  config.get('google.client_id'),
  config.get('google.client_secret'),
  `https://${domain}/google/oauth2callback`
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

router.get('/auth', (req, res) => {
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

  res.redirect(authorizationUrl);
});

router.get('/oauth2callback', async (req, res) => {
  // Handle the OAuth 2.0 server response
  let q = url.parse(req.url, true).query;

  if (q.error) { // An error response e.g. error=access_denied
    googleDebugger('Error:' + q.error);
  } else { // Get access and refresh tokens (if access_type is offline)
    const { tokens } = await oauth2Client.getToken(q.code);
    oauth2Client.setCredentials(tokens);
  }

  res.redirect('/');
});

router.post('/synchronizeDB', async (req, res) => {
  try { 
    const data = await fs.readFile('refreshToken.txt');
    const refreshToken = data.toString();

    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });
  
    const sheets = google.sheets({version: 'v4', auth: oauth2Client});
    let response;
    response = await sheets.spreadsheets.values.get({
        spreadsheetId: '1jFT3SCoOuMwJnsRJxuD7D2Eq6hKgne6nEam1RdLlPmM',
        range: 'Daily Data!A3:B300',
    });
  
    const range = response.data;
    if (!range || !range.values || range.values.length == 0) {
        googleDebugger('No students');
        return;
    }
  
    // convert 2D array to dictionary
    /*
    {
      Ignacio Tinajero, Juliana: {
        sheets_row: 10,
        period: 4,
      }
    }
    */
    const studentToInfo = {};
    for (let i = 0; i < range.values.length; i += 3) {
      const period = range.values[i][0];
      const name = range.values[i][1];
      const sheetRow = i + 3;
      studentToInfo[name] = {};
      studentToInfo[name]['sheets_row'] = sheetRow;
      studentToInfo[name]['period'] = Number(period);
    }

    // read students from db
    const fellowID = req.session.user.id;
    const numPeriods = await db.getPeriods();
    const periods = await db.getStudentsForFellowByPeriod(fellowID, numPeriods);

    // compare sheet row of students in the db to actual sheet rows
    const studentsToUpdate = [];
    const studentsToDelete = [];
    for (period of periods) {
      for (student of period) {
        let name = student['name'];
        const sheets_row = student['sheets_row'];
        const period = student['period'];
        
        if (!(name in studentToInfo)) {
          const expected_name = helper.closestMatch(name, Object.keys(studentToInfo));
          student['name'] = expected_name;
          name = expected_name;
          studentsToUpdate.push(student);
        }

        const expected_period = studentToInfo[name]['period'];
        if (isNaN(expected_period)) {
          studentsToDelete.push(student['id']);
        }
        else {
          const expected_sheets_row = studentToInfo[name]['sheets_row'];
          if (expected_sheets_row !== sheets_row || expected_period !== period) 
          {
              dbDebugger(`${name}: actual row = ${sheets_row}, expected row = ${expected_sheets_row}`);
              dbDebugger(`${name}: actual period = ${period}, expected period = ${expected_period}`);
              student['sheets_row'] = expected_sheets_row;
              student['period'] = expected_period;
              studentsToUpdate.push(student);
          }
        }
      }
    }

    // update rows
    await db.updateStudents(studentsToUpdate);
    // delete rows
    await db.deleteStudents(studentsToDelete);
    const students = await db.getStudentsForFellowByPeriod(fellowID, numPeriods);
    res.send(students);
  } 
  catch (err) {
    googleDebugger(err.message);
    res.send({error: err.message});
  }
});

router.get('/columnsForDates', async (req, res) => {
  try { 
    const data = await fs.readFile('refreshToken.txt');
    const refreshToken = data.toString();

    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });
  
    const sheets = google.sheets({version: 'v4', auth: oauth2Client});
    let response;
    response = await sheets.spreadsheets.values.get({
        spreadsheetId: '1jFT3SCoOuMwJnsRJxuD7D2Eq6hKgne6nEam1RdLlPmM',
        range: 'Daily Data!F2:IU2',
    });
  
    const range = response.data;
  
    if (!range || !range.values || range.values.length == 0) {
        googleDebugger('No dates');
        return;
    }
    
    /*
      A: 65
      Z: 90
      AA:  91
      AZ: 116
      BA: 117
      BZ: 142

      i = 91 -> AA

      i = 117 -> BA
      num_chars = 117 - 65 + 1 = 53
      26 + 26 + 1 = 53
      offset_of_first = (53 - 1) // 26 = 2 - 1
      offset_of_second = (53 - 1) % 26 = 0
    */
    const dates = range.values[0];
    const dateToColumn = {};
    let i = 0;
    for (date of dates) {
      if (date === "") {
        i++;
        continue;
      }
      const code = i + 'F'.charCodeAt(0);
      const num_chars = code - 65 + 1;
      const offset_of_first = Math.floor((num_chars - 1) / 26);
      const offset_of_second = (num_chars - 1) % 26;
      let column_name = "";
      if (offset_of_first > 0) {
        column_name += String.fromCharCode(65 + offset_of_first - 1);
      }
      column_name += String.fromCharCode(65 + offset_of_second);
      dateToColumn[date] = column_name;
      i++;
    }
    res.send(dateToColumn);
  } 
  catch (err) {
      googleDebugger(err.message);
      res.send({error: err.message});
  }
});


module.exports.oauth2Client = oauth2Client;
module.exports.google = router;