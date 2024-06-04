const express = require('express');
const router = express.Router();
const url = require('url');
const {google} = require('googleapis');
const googleDebugger = require('debug')('app:google');
const config = require('config');
const db = require('../db/database');
const dbDebugger = require('debug')('app:db');
const helper = require('../helpers/helper');
const sheets_auth = require('../middleware/sheets_auth');
const domain = 'localhost:8000';

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets'
];
const oauth2Client = new google.auth.OAuth2(
  config.get('google.client_id'),
  config.get('google.client_secret'),
  `http://${domain}/google/oauth2callback`
);

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

  res.send({authorizationUrl: authorizationUrl});
});

router.get('/oauth2callback', async (req, res) => {
  // Handle the OAuth 2.0 server response
  let q = url.parse(req.url, true).query;
  const fellowID = req.session.user.id;
  const fellow = await db.getFellow(fellowID);
  if (q.error) { // An error response e.g. error=access_denied
    fellow['sheets_permissions'] = false;
    googleDebugger('Error:' + q.error);
  } 
  else { // Get access and refresh tokens (if access_type is offline)
    const { tokens } = await oauth2Client.getToken(q.code);
    oauth2Client.setCredentials(tokens);
    fellow['sheets_permissions'] = true;
    fellow['refresh_token'] = tokens.refresh_token;
    googleDebugger("refresh token has been saved.");
  }
  await db.updateFellow(fellow);
  req.session.user.sheets_permissions = fellow['sheets_permissions'];
  res.redirect('/users/account_setup');
});

router.post('/synchronizeDB', [sheets_auth], async (req, res) => {
  try { 
    const fellowID = req.session.user.id
    const fellow = await db.getFellow(fellowID);
    const refreshToken = fellow['refresh_token'];

    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });
  
    const sheets = google.sheets({version: 'v4', auth: oauth2Client});
    let response;
    response = await sheets.spreadsheets.values.get({
        spreadsheetId: fellow.sheet_id,
        range: 'Daily Data!A3:C300',
    });
  
    const range = response.data;
    if (!range || !range.values || range.values.length == 0) {
      googleDebugger('No students');
      res.send({error_message: 'Spreadsheet has not data.'});
    }

    // read students from db
    const periods = await db.getStudentsByPeriod();
    
    const seen = new Set();
    const studentsToAdd = [];
    const studentsToUpdate = [];
    const studentsToDelete = [];
    for (let i = 0; i < range.values.length; i += 3) {
      const period = range.values[i][0];
      const name = range.values[i][1];
      const tutor_name = range.values[i][2];
      const sheetRow = i + 3;
      if (!seen.has(name)) {
        seen.add(name);
        const expected_period = Number(period);
        const expected_tutor_name = tutor_name;
        const expected_sheets_row = sheetRow;
        const targetStudent = helper.getStudent(name, periods);

        if (isNaN(expected_period)) {
          // case 1: student needs to be deleted from db
          if (targetStudent) {
            const student = {
              'name': name,
              'period': expected_period,
            };
            studentsToDelete.push(student);
          }
        }
        else if (targetStudent) {
          // case 2: student info might need to be updated in db
          const sheets_row = targetStudent.sheets_row;
          const period = targetStudent.period;
          const tutor_name = targetStudent.tutor_name;
          if (expected_sheets_row !== sheets_row || 
              expected_period !== period ||
              (expected_tutor_name !== tutor_name)
            ) 
          {
              dbDebugger(`${name}: actual row = ${sheets_row}, expected row = ${expected_sheets_row}`);
              dbDebugger(`${name}: actual period = ${period}, expected period = ${expected_period}`);
              dbDebugger(`${name}: actual tutor = ${tutor_name}, expected tutor = ${expected_tutor_name}`);
              targetStudent['sheets_row'] = expected_sheets_row;
              targetStudent['period'] = expected_period;
              targetStudent['tutor_name'] = expected_tutor_name;
              studentsToUpdate.push(targetStudent);
          }
        }
        else {
          // case 3: student needs to be added it to db
          const new_student = {
            'name': name,
            'period': expected_period,
            'tutor_name': expected_tutor_name,
            'sheets_row': expected_sheets_row
          };
          studentsToAdd.push(new_student);
        }
      }
    }

    // insert rows
    const new_students = await db.insertStudents(studentsToAdd);
    // update rows
    const updated_students = await db.updateStudents(studentsToUpdate);
    // delete rows
    db.deleteStudents(studentsToDelete);
    const students = await db.getStudentsByPeriod();
    res.send({
      all_studets: students,
      deleted_students: studentsToDelete,
      updated_students: updated_students,
      new_students: new_students, 
    });
  } 
  catch (err) {
    googleDebugger(err.message);
    res.send({error_message: err.message});
  }
});

router.get('/columnsForDates', [sheets_auth], async (req, res) => {
  try {
    const fellowID = req.session.user.id
    const fellow = await db.getFellow(fellowID);
    const refreshToken = fellow['refresh_token'];

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

router.delete('/auth', async (req, res) => {
  try {
    const fellowID = req.session.user.id
    const fellow = await db.getFellow(fellowID);
    const refreshToken = fellow['refresh_token'];
    await oauth2Client.revokeToken(refreshToken);

    const user = req.session.user;
    googleDebugger(`Remove sheets permissions for user: ${user.id}`);
    user.sheets_permissions = false;
    user.refresh_token = null;
    await db.updateFellow(user);
    res.send({'sheets_permissions': user.sheets_permissions});
  }
  catch (err) {
    googleDebugger(err.message);
    res.send({error_message: err.message})
  }
});

module.exports.oauth2Client = oauth2Client;
module.exports.google = router;