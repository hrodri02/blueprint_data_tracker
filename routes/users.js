const {OAuth2Client} = require('google-auth-library');
const express = require('express');
const router = express.Router();
const config = require('config');
const db = require('../db/database');
const dbDebugger = require('debug')('app:db');
const sessionDebugger = require('debug')('app:session');
const googleDebugger = require('debug')('app:google');
const Joi = require('joi');
const {google} = require('googleapis');
const {oauth2Client} = require('./google');
const path = require('path');

router.post('/signup', async (req, res) => {
    const client = new OAuth2Client();
    const token = req.body['credential'];

    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: config.get('google.client_id'),
      });
      const payload = ticket.getPayload();
      const googleUserID = payload['sub'];
      const email = payload['email'];
      const name = payload['name'];
      // check if user is in DB
      let user = await db.getFellow(googleUserID);
      // store new users in DB
      if (user == null) {
        user = await db.insertFellow(googleUserID, email, name);
      }
      
      req.session.user = user;
      res.redirect('/');
    }
    catch (err) {
      dbDebugger(err.message);
      res.status(400).send({error: err.message});
    }
});

router.get('/signout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      sessionDebugger(err.message);
    }
    res.end();
  });
});

router.get('/me', (req, res) => {
  const user = req.session.user;
  res.send(user);
});

router.patch('/me', async (req, res) => {
  const user = await db.getFellow(req.session.user.id);
  // Update the user's information with the data from the request body
  Object.keys(req.body).forEach(key => {
    if (user.hasOwnProperty(key)) {
      user[key] = req.body[key];
    }
  });
  // if the request was sent from the root, then the sheet url and tutor name are required
  const context = req.headers['x-context'];
  if (context === '/') {
    if (!req.body.url) {
      return res.status(400).send({ error_message: 'url is required.' });
    }

    if (!user.tutor_name) {
      return res.status(400).send({ error_message: 'tutor_name is required.' });
    }

    if (isValidURL(req.body.url)) {
      const sheet_id = getSheetIDFromURL(req.body.url);
      user['sheet_id'] = sheet_id;
    }
    else {
      return res.status(400).send({error_message: 'Invalid URL'});
    }
  }

  user['sheets_permissions'] = user.sheets_permissions === 1;

  const { error } = validateFellow(user);
  if (error) {
    sessionDebugger(error.details[0].message);
    return res.status(400).send({error_message: error.details[0].message});
  }

  await db.updateFellow(user);
  req.session.user = user;
  const userInDB = await db.getFellow(user.id);
  res.send(userInDB);
});

router.post('/me/students', async (req, res) => {
  try {
    const user_id = req.session.user.id;
    const user = await db.getFellow(user_id);
    oauth2Client.setCredentials({
      refresh_token: user.refresh_token
    });

    const sheets = google.sheets({version: 'v4', auth: oauth2Client});
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: user.sheet_id,
        range: 'Daily Data!A3:C300',
    });

    const range = response.data;
    if (!range || !range.values || range.values.length == 0) {
      googleDebugger('No students');
      res.send({error_message: 'Spreadsheet has not data.'});
    }

    // get all of the students in the DB
    const students_in_db = await db.getStudentsByPeriod();
    const student_names = new Set();
    for (period of students_in_db) {
      for (student of period) {
        student_names.add(student.name);
      }
    }

    // get all of the students in the spreadsheet
    const all_students = [];
    for (let i = 0; i < range.values.length; i += 3) {
      const period = range.values[i][0];
      const name = range.values[i][1];
      const tutor_name = range.values[i][2];
      if (isNaN(period) || tutor_name !== user.tutor_name) {
        continue;
      }

      const new_student = {
        'name': name,
        'period': period,
        'fellow_id': user.id,
        'sheets_row': i + 3
      };
      all_students.push(new_student);
    }

    // Add the students that are not in the DB
    const new_students = [];
    for (student of all_students) {
      if (!student_names.has(student.name)) {
        new_students.push(student);
      }
    }

    await db.insertStudentsForFellow(new_students);
    res.redirect('/');
  }
  catch (err) {
    googleDebugger(err.message);
    res.send({error_message: err.message});
  }
});

function isValidURL(url) {
  try {
    new URL(url);
    const parts = url.split('/');
    if (parts.length < 6)
      return false;
    return true;
  }
  catch (err) {
    return false;
  }
}

function getSheetIDFromURL(url) {
  return url.split('/')[5];
}

function validateFellow(fellow) {
  const schema = Joi.object({
    id: Joi.string().required(),
    name: Joi.string().min(3).required(),
    email: Joi.string().min(3).required(),
    tutor_name: Joi.string().min(2).max(100),
    sheets_permissions: Joi.boolean().allow(null),
    refresh_token: Joi.string().allow(null),
    sheet_id: Joi.string().min(30)
  });

  const result = schema.validate(fellow);
  return result;
}

module.exports = router;