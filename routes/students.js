const Joi = require('joi');
const fs = require('fs').promises;
const {oauth2Client} = require('./google');
const express = require('express');
const router = express.Router();
const db = require('../db/database');
const dbDebugger = require('debug')('app:db');
const googleDebugger = require('debug')('app:google');
const {google} = require('googleapis');
const auth = require('../middleware/auth');
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets'
];

router.post('/', async (req, res) => {
  const student = req.body;
  const { error } = validateStudent(student);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  const id = await insertStudent(student);
  const studentInDB = await getStudent(id);
  res.send(studentInDB);
});

router.get('/', auth, async (req, res) => {
  // TODO: sheet_row will be outdated when new students are added to the spreadsheet
  const students = [];
  const periods = await getPeriods();
  for (let i = 0; i < periods; i++) {
    students.push([]);
  }
  const fellowID = req.session.user.id;
  const rows = await getStudentsForFellow(fellowID);
  for (row of rows) {
    if (row.period < 5) {
      students[row.period - 1].push(row);
    }
    else {
      students[row.period - 2].push(row);
    }
  }
  res.send(students);
});

router.put('/:id', async (req, res) => {
  const id = req.params.id;
  const result = await getStudent(id);
  if (!result) {
    return res.status(404).send('Student with given ID not found.');
  }

  const { error } = validateStudent(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  const student = req.body;
  await updateStudent(student);
  const studentInDB = await getStudent(id);
  res.send(studentInDB);
});

router.delete('/:id', async (req, res) => {
  const id = req.params.id;
  const result = await getStudent(id);
  if (!result) {
    return res.status(404).send('Student with given ID not found.');
  }

  await deleteStudent(id);
  res.send(result);  
});

async function getPeriods() {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT COUNT(DISTINCT period) as periods FROM students';
    db.get(sql, [], (err, row) => {
      if (err) {
        reject(err.message);
      }
      else {
        resolve(row.periods);
      }
    });
  });
}

async function getStudentsForFellow(fellowID) {
  return new Promise((resolve, reject) => {
    const getStudents = 'SELECT * FROM students WHERE fellow_id = ?';
    db.all(getStudents, [fellowID], (err, rows) => {
      if (err) {
        reject(err.message);
      }
      else {
        resolve(rows);
      }
    });
  });
}

async function insertStudent(student) {
  return new Promise((resolve, reject) =>{
    // insert one row into the students table
    const name = student['name'];
    const period = student['period'];
    const sheets_row = student['sheets_row'];
    const fellow_id = student['fellow_id'];
    db.run(`INSERT INTO students(name, period, sheets_row, fellow_id) VALUES(?, ?, ?, ?)`, 
          [name, period, sheets_row, fellow_id], function(err) {
      if (err) {
        dbDebugger(err.message);
        reject(err.message);
      }
      else {
        resolve(this.lastID);
      }
    });
  });
}

async function getStudent(id) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM students WHERE id = ?';
    db.get(sql, [id], (err, row) => {
      if (err) {
        reject(err.message);
      }
      else {
        resolve(row);
      }
    });
  });
}

async function updateStudent(student) {
  return new Promise((resolve, reject) => {
    const id = student['id'];
    const name = student['name'];
    const period = student['period'];
    const sheets_row = student['sheets_row'];
    const fellow_id = student['fellow_id'];
    db.run(`UPDATE students SET name = ?, period = ?, sheets_row = ?, fellow_id = ? WHERE id = ?`, 
          [name, period, sheets_row, fellow_id, id], function(err) {
      if (err) {
        reject(err.message);
      }
      else {
        resolve();
      }
    });
  });
}

async function deleteStudent(id) {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM students WHERE id = ?`, [id], function(err) {
      if (err) {
        reject(err.message);
      }
      else {
        resolve();
      }
    });
  });
}

function validateStudent(student) {
  const schema = Joi.object({
    id: Joi.number(),
    name: Joi.string().min(3).required(),
    period: Joi.number().min(0).max(7).required(),
    sheets_row: Joi.number().min(1).max(300).required(),
    fellow_id: Joi.number().min(1).max(4).required()
  });

  const result = schema.validate(student);
  return result;
}

router.post('/dailydata', async (req, res) => {
  const period = req.body['period'];
  const ranges = req.body['ranges'];
  const values = req.body['values'];
  try {
    await batchUpdateValues("1jFT3SCoOuMwJnsRJxuD7D2Eq6hKgne6nEam1RdLlPmM",
                    ranges,
                    values,
                    'RAW');
    res.send({period: period});
  }
  catch (err) {
    const authorizationUrl = oauth2Client.generateAuthUrl({
      // 'online' (default) or 'offline' (gets refresh_token)
      access_type: 'offline',
     /** Pass in the scopes array defined above.
        * Alternatively, if only one scope is needed, you can pass a scope URL as a string */
      scope: SCOPES,
      // Enable incremental authorization. Recommended as a best practice.
      include_granted_scopes: true
    });
    googleDebugger(err.message);
    res.status(401).send({authorizationUrl: authorizationUrl});
  }
});

async function batchUpdateValues(spreadsheetId, ranges, values, valueInputOption) {
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
    const data = await fs.readFile('refreshToken.txt'); 
    const refreshToken = data.toString();

    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });

    const response = await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: spreadsheetId,
      resource: body,
    });
    googleDebugger(`${response.data.totalUpdatedCells} cells updated.`);
    return response;
  } catch (err) {
    throw err;
  }
}

module.exports = router;