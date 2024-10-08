const Joi = require('joi');
const {oauth2Client} = require('./google');
const express = require('express');
const router = express.Router();
const db = require('../db/database');
const googleDebugger = require('debug')('app:google');
const sessionDebugger = require('debug')('app:session');
const {google} = require('googleapis');
const auth = require('../middleware/auth');
const sheets_auth = require('../middleware/sheets_auth');
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets'
];

router.post('/', [auth], async (req, res) => {
  const student = req.body;
  const { error } = validateStudent(student);
  if (error) {
    return res.status(400).send({error_message: error.details[0].message});
  }

  const studentInDB = await db.insertStudentForFellow(student);
  res.send(studentInDB);
});

router.get('/', [auth], async (req, res) => {
  const students = await db.getStudentsByPeriod();
  res.send(students);
});

router.get('/fellow', [auth], async (req, res) => {
  const fellowID = req.session.user.id;
  const students = await db.getStudentsByPeriod(fellowID);
  sessionDebugger(students);
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

  // Update the student's information with the data from the request body
  Object.keys(req.body).forEach(key => {
    if (student.hasOwnProperty(key)) {
      student[key] = req.body[key];
    }
  });

  // validate student
  const { error } = validateStudent(student);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }
  // update student goal
  const studentInDB = await db.patchStudent(student);
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
    fellow_id: Joi.string().min(1).required(),
    goal: Joi.string().min(5).max(100),
    profile_image_url: Joi.string()
  });

  const result = schema.validate(student);
  return result;
}

router.post('/dailydata', [sheets_auth], async (req, res) => {
  const ranges = req.body['ranges'];
  const values = req.body['values'];

  // validate daily data
  for (value of values) {
    const { error } = validateDailyData(value);
    if (error) {
      return res.status(400).send(error);
    }
  }

  const dailydata = await batchUpdateValues(req.session.user.id,
                  ranges,
                  values,
                  'RAW');

  res.send(dailydata);
});

async function batchUpdateValues(fellowID, ranges, values, valueInputOption) {
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
    includeValuesInResponse: true
  };
  const sheets = google.sheets({version: 'v4', auth: oauth2Client});
  try {
    const fellow = await db.getFellow(fellowID);
    const refreshToken = fellow['refresh_token'];

    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });

    const response = await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: fellow['sheet_id'],
      resource: body,
    });
    googleDebugger(`${response.data.totalUpdatedCells} cells updated.`);
    return response.data.responses;
  } catch (err) {
    throw err;
  }
}

router.get('/:id/dailydata', [sheets_auth], async (req, res) => {
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
  const fellowID = req.session.user.id;
  const fellow = await db.getFellow(fellowID);
  const refreshToken = fellow['refresh_token'];

  oauth2Client.setCredentials({
    refresh_token: refreshToken
  });
  
  try {
    const sheets = google.sheets({version: 'v4', auth: oauth2Client});
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: fellow.sheet_id,
      range: `Daily Data!${start}${sheets_row}:${end}${sheets_row + 2}`,
    });

    const range = response.data;

    if (!range || !range.values || range.values.length == 0) {
      res.send([]);
    }
    res.send(range.values);
  }
  catch (error) {
    res.status(error.response.status).send(error.response.data);
  } 
});

router.patch('/:id/dailydata', [sheets_auth], async (req, res) => {
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
  
  const dailydata = await batchUpdateValues(req.session.user.id,
                  ranges,
                  values,
                  'RAW');
  res.send({dailydata});
});

router.post('/:id/notes', [auth], async (req, res) => {
  const student_id = req.params.id;
  const result = await db.getStudent(student_id);
  if (!result) {
    return res.status(404).send('Student with given ID not found.');
  }

  const { error } = validateNote(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  const student_note = req.body;
  await db.insertStudentNote(student_note, student_id);
  const notes = await db.getStudentNotes(student_id);
  res.send(notes);
});

router.get('/:id/notes', [auth], async (req, res) => {
  const student_id = req.params.id;
  const result = await db.getStudent(student_id);
  if (!result) {
    return res.status(404).send('Student with given ID not found.');
  }

  const notes = await db.getStudentNotes(student_id);
  res.send(notes);
});

router.patch('/:id/notes/:note_id', [auth], async (req, res) => {
  const student_id = req.params.id;
  const result = await db.getStudent(student_id);
  if (!result) {
    return res.status(404).send('Student with given ID not found.');
  }

  const note_id = req.params.note_id;
  const student_note = await db.getStudentNote(note_id);
  if (!student_note) {
    return res.status(404).send('Student note with given ID not found.');
  }

  // Update the note's information with the data from the request body
  Object.keys(req.body).forEach(key => {
    if (student_note.hasOwnProperty(key)) {
      student_note[key] = req.body[key];
    }
  });

  const { error } = validateNote(student_note);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  const updated_note = await db.updateStudentNote(student_note);
  res.send(updated_note);
});

router.delete('/:id/notes/:note_id', [auth], async (req, res) => {
  const student_id = req.params.id;
  const result = await db.getStudent(student_id);
  if (!result) {
    return res.status(404).send('Student with given ID not found.');
  }

  const note_id = req.params.note_id;
  const note = await db.getStudentNote(note_id);
  if (!note) {
    return res.status(404).send('Student note with given ID not found.');
  }

  await db.deleteStudentNote(note_id);
  res.send(note);
});

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

function validateNote(student_note) {
  const schema = Joi.object({
    id: Joi.number(),
    student_id: Joi.number(),
    note: Joi.string().min(5).max(1000),
    date: Joi.string().isoDate()
  });
  const result = schema.validate(student_note);
  return result;
}

module.exports = router;