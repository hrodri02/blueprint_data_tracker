const fs = require('fs').promises;
const {google} = require('googleapis');
const express = require('express');
const Student = require('./student');
const router = express.Router();

const students = [
    // 1st period
    [
        new Student(0, "Joseph", "Logwood", 1),
        new Student(1, "Makaiden", "Vongphrachanh", 1),
        new Student(2, "Braylani", "Hammond", 1),
    ],
    // 2nd period
    [
        new Student(3, "Navie", "Davis", 2),
        new Student(4, "Prince", "Leggett", 2),
        new Student(5, "Jay'Lon", "Andrades", 2)
    ],
    // 3rd period
    [
        new Student(6, "Alexandra", "Covian Perez", 3),
        new Student(7, "Emeri", "Hewitt", 3),
        new Student(8, "Brian", "Cisneros", 3),
        new Student(9, "Himelda", "Ahilon-Pablo", 3),
    ],
    // 4th period
    [
        new Student(10, "David", "Hernandez", 4),
        new Student(11, "Juliana", "Ignacio Tinajero", 4),
        new Student(12, "Roselyn", "Sanchez-Flores", 4),
    ],
    // 6th period
    [
        new Student(13, "Luis", "Chang Chilel", 6),
        new Student(14, "Caleb", "Pablo", 6),
        new Student(15, "Alex", "Pablo Ramirez", 6),
        new Student(16, "Lawrence", "Ward", 6),
    ],
    // 7th period
    [
        new Student(17, "Arodi", "Granados Funes", 6),
        new Student(18, "John", "Martin-Garcia", 6),
        new Student(19, "Elmer", "Calmo Carrillo", 6),
        new Student(20, "Khloe", "Pierce", 6),
    ]
]

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  'http://localhost:8000/oauth2callback'
);

router.get('/', async (req, res) => {
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
        range: 'Daily Data!B3:B300',
      });
  
    const range = response.data;
  
    if (!range || !range.values || range.values.length == 0) {
      res.send('No students');
      return;
    }
  
    // convert 2D array to 1D array
    let all_students = [];
    for (i in range.values) {
      all_students = all_students.concat(range.values[i]);
    }
  
    // set sheet row for each student
    // const rows = []
    for (i in students) {
      for (j in students[i]) {
        const student = students[i][j];
        const name = student.last_name + ", " + student.first_name;
        const index = containsSubstring(all_students, name);
        student.row = index + 3;
        // rows.push(index + 3);
      }
    }

    res.send(students);
  } 
  catch (err) {
    res.send({error: err.message});
  } 
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

router.post('/dailydata', (req, res) => {
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

async function batchUpdateValues(spreadsheetId, ranges, values, valueInputOption, callback) {
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

module.exports = router;