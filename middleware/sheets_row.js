const googleDebugger = require('debug')('app:google');
const dbDebugger = require('debug')('app:db');
const {google} = require('googleapis');
const {oauth2Client} = require('../routes/google');
const fs = require('fs').promises;
const db = require('../db/database');

module.exports = async function (req, res, next) {
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
            googleDebugger('No students');
            next();
        }
      
        // convert 2D array to dictionary
        const studentToSheetsRow = {};
        for (let i = 0; i < range.values.length; i += 3) {
        //   all_students = all_students.concat(range.values[i]);
          const name = range.values[i][0];
          const sheetRow = i + 3;
          studentToSheetsRow[name] = sheetRow;
        }
        
        // read students from db
        const fellowID = req.session.user.id;
        const rows = await db.getStudentsForFellow(fellowID);

        // compare sheet row of students in the db to actual sheet rows
        const studentsToUpdate = []
        for (row of rows) {
            const name = row['name'];
            const sheet_row = row['sheets_row'];
            const expected_sheets_row = studentToSheetsRow[name];
            if (expected_sheets_row !== sheet_row) {
                dbDebugger(`${name}: actual = ${sheet_row}, expected = ${expected_sheets_row}`);
                row['sheets_row'] = expected_sheets_row;
                studentsToUpdate.push(row);
            }
        }

        // update necessary sheets rows
        db.updateStudents(studentsToUpdate);

        next();
    } 
    catch (err) {
        googleDebugger(err.message);
        res.send({error: err.message});
    }
}