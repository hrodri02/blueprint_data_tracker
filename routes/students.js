const Joi = require('joi');
const fs = require('fs').promises;
const {oauth2Client} = require('./google');
const express = require('express');
const router = express.Router();
const db = require('../db/database');
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
    return res.status(400).send({error_message: error.details[0].message});
  }

  const id = await db.insertStudent(student);
  const studentInDB = await db.getStudent(id);
  res.send(studentInDB);
});

router.get('/', [auth], async (req, res) => {
  const numPeriods = await db.getPeriods();
  const students = await db.getStudentsByPeriod(numPeriods);
  res.send(students);
});

router.get('/fellow', [auth], async (req, res) => {
  const numPeriods = await db.getPeriods();
  const fellowID = req.session.user.id;
  const students = await db.getStudentsByPeriod(numPeriods, fellowID);
  res.send(students);
});

router.put('/:id', async (req, res) => {
  const id = req.params.id;
  const result = await db.getStudent(id);
  if (!result) {
    return res.status(404).send('Student with given ID not found.');
  }

  const { error } = validateStudent(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  const student = req.body;
  await db.updateStudent(student);
  const studentInDB = await db.getStudent(id);
  res.send(studentInDB);
});

router.patch('/:id', async (req, res) => {
  // get student from db
  const id = req.params.id;
  const student = await db.getStudent(id);
  if (!student) {
    return res.status(404).send('Student with given ID not found.');
  }
  // validate student goal
  const body = req.body;
  const { error } = validateStudentGoal(body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }
  // update student goal
  body['id'] = id;
  await db.updateStudentGoal(body);
  const studentInDB = await db.getStudent(id);
  res.send(studentInDB);
});

router.delete('/:id', async (req, res) => {
  const id = req.params.id;
  const result = await db.getStudent(id);
  if (!result) {
    return res.status(404).send('Student with given ID not found.');
  }

  await db.deleteStudent(id);
  res.send(result);  
});

function validateStudent(student) {
  const schema = Joi.object({
    id: Joi.number(),
    name: Joi.string().min(3).required(),
    period: Joi.number().min(0).max(7).required(),
    sheets_row: Joi.number().min(1).max(300).required(),
    fellow_id: Joi.string().min(1).required()
  });

  const result = schema.validate(student);
  return result;
}

router.post('/dailydata', async (req, res) => {
  const period = req.body['period'];
  const ranges = req.body['ranges'];
  const values = req.body['values'];

  // validate daily data
  for (value of values) {
    const { error } = validateDailyData(value);
    if (error) {
      return res.status(400).send(error);
    }
  }

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

router.get('/:id/dailydata', async (req, res) => {
  try {
    // get student with id
    const student = await db.getStudent(req.params.id);
    if (!student) {
      return res.status(404).send('Student with given ID not found.');
    }

    // get sheets row for student
    const sheets_row = student['sheets_row'];
    // use google api to read daily data
    const start = req.query.start;
    const end = req.query.end;
    const data = await fs.readFile('refreshToken.txt');
    const refreshToken = data.toString();

    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });
  
    const sheets = google.sheets({version: 'v4', auth: oauth2Client});
    let response;
    response = await sheets.spreadsheets.values.get({
      spreadsheetId: '1jFT3SCoOuMwJnsRJxuD7D2Eq6hKgne6nEam1RdLlPmM',
      range: `Daily Data!${start}${sheets_row}:${end}${sheets_row + 2}`,
    });
  
    const range = response.data;
  
    if (!range || !range.values || range.values.length == 0) {
      res.send([]);
    }
    res.send(range.values);
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

router.patch('/:id/dailydata', async (req, res) => {
  try {
    // get student with id
    const student = await db.getStudent(req.params.id);
    if (!student) {
      return res.status(404).send('Student with given ID not found.');
    }

    // validate daily data
    const values = req.body['values'];
    for (value of values) {
      const { error } = validateDailyData(value);
      if (error) {
        return res.status(400).send(error);
      }
    }

    // update student daily data
    const columns = req.body['columns'];
    const row = student['sheets_row'];
    const ranges = [];
    for (col of columns) {
      const range = `${col}${row}:${col}${row + 2}`;
      ranges.push(range);
    }
    
    
    await batchUpdateValues("1jFT3SCoOuMwJnsRJxuD7D2Eq6hKgne6nEam1RdLlPmM",
                    ranges,
                    values,
                    'RAW');
    res.send({dailyData: values});
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

function validateStudentGoal(goal) {
  const schema = Joi.object({
    goal: Joi.string().max(100),
  });
  const result = schema.validate(goal);
  return result;
}

function validateDailyData(dailyData) {
  const attendance = Joi.array().items(Joi.string().valid('Present', 'Absent', 'Tardy', 'Left Early', 'No Session', 'No School'));
  const etGrade = Joi.array().items(Joi.number().min(0).max(4));
  const letterGrades = Joi.array().items(Joi.string().max(6).pattern(/^[gradesGRADES]+$/));

  const result = {'value': dailyData};
  const errors = {};

  const attendanceResult = attendance.validate(dailyData[0]);
  if (attendanceResult.error) {
      result['error'] = {}
      result['error']['attendance'] = attendanceResult.error.details[0].message;
  }
  const etGradeResult = etGrade.validate(dailyData[1]);
  if (etGradeResult.error) {
      errors['Exit Ticket Grade'] = etGradeResult.error.details[0].message;
      if (!('error' in result)) {
          result['error'] = {}
      }
      result['error']['Exit Ticket Grade'] = etGradeResult.error.details[0].message;
  }
  const letterGradesResult = letterGrades.validate(dailyData[2]);
  if (letterGradesResult.error) {
      errors['Letter Grades'] = letterGradesResult.error.details[0].message;
      if (!('error' in result)) {
          result['error'] = {}
      }
      result['error']['Letter Grades'] = letterGradesResult.error.details[0].message;
  }

  return result;
}

module.exports = router;