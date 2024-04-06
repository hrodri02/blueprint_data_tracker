const process = require('process');
const dbDebugger = require('debug')('app:db');
const sqlite3 = require('sqlite3').verbose();

// open the database
const db = new sqlite3.Database('./db/data_tracker.db', (err) => {
    if (err) {
        dbDebugger(err.message);
    }
    else {
        dbDebugger('Connected to the data_tracker database.');
    }
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

async function getStudentsByPeriod(numPeriods, fellowID = null) {
    return new Promise((resolve, reject) => {
      dbDebugger(fellowID);
      let getStudents = `SELECT * FROM students`;
      if (fellowID !== null) {
        getStudents += ` WHERE fellow_id = '${fellowID}'`;
      }
      db.all(getStudents, (err, rows) => {
        if (err) {
          reject(err.message);
        }
        else {
          const students = [];
          for (let i = 0; i < numPeriods; i++) {
            students.push([]);
          }

          for (row of rows) {
            if (row.period < 5) {
              students[row.period - 1].push(row);
            }
            else {
              students[row.period - 2].push(row);
            }
          }
          resolve(students);
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

async function updateStudents(students) {
  db.parallelize(() => {
    for (student of students) {
      updateStudentSync(student);
    }
  });
}

function updateStudentSync(student) {
  const id = student['id'];
  const name = student['name'];
  const period = student['period'];
  const sheets_row = student['sheets_row'];
  const fellow_id = student['fellow_id'];
  db.run(`UPDATE students SET name = ?, period = ?, sheets_row = ?, fellow_id = ? WHERE id = ?`, 
      [name, period, sheets_row, fellow_id, id], function(err) 
  {
    if (err) {
      dbDebugger(err.message);
    }
    else {
      dbDebugger(`student ${id} updated`);
    }
  });
}

async function updateStudent(student) {
  return new Promise((resolve, reject) => {
    const id = student['id'];
    const name = student['name'];
    const period = student['period'];
    const sheets_row = student['sheets_row'];
    const goal = student['goal'];
    const fellow_id = student['fellow_id'];
    db.run(`UPDATE students SET name = ?, period = ?, sheets_row = ?, fellow_id = ?, goal = ? WHERE id = ?`, 
          [name, period, sheets_row, fellow_id, goal, id], function(err) {
      if (err) {
        reject(err.message);
      }
      else {
        dbDebugger(`student ${id} updated`);
        resolve();
      }
    });
  });
}

async function updateStudentGoal(student) {
  return new Promise((resolve, reject) => {
    const id = student['id'];
    const goal = student['goal'];
    db.run(`UPDATE students SET goal = ? WHERE id = ?`, 
          [goal, id], function(err) {
      if (err) {
        reject(err.message);
      }
      else {
        dbDebugger(`student ${id} updated`);
        resolve();
      }
    });
  });
}

async function deleteStudents(studentIDs) {
  db.parallelize(() => {
    for (id of studentIDs) {
      deleteStudent(id);
    }
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

async function getFellow(id) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM fellows WHERE id = ?';
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

async function insertFellow(id, email, name) {
    return new Promise((resolve, reject) => {
      const sql = 'INSERT INTO fellows(id, email, name) VALUES(?, ?, ?)';
      db.run(sql, [id, email, name], (err, row) => {
        if (err) {
          reject(err.message);
        }
        else {
          resolve(this.lastID);
        }
      });
    });
}

async function updateFellow(fellow) {
  return new Promise((resolve, reject) => {
    const id = fellow['id'];
    const name = fellow['name'];
    const email = fellow['email'];
    const sheets_permissions = fellow['sheets_permissions'];
    db.run(`UPDATE fellows SET name = ?, email = ?, sheets_permissions = ? WHERE id = ?`, 
          [name, email, sheets_permissions, id], function(err) {
      if (err) {
        reject(err.message);
      }
      else {
        dbDebugger(`fellow ${id} updated`);
        resolve();
      }
    });
  });
}

process.on('SIGINT', () => {
    // close the database connection
    db.close((err) => {
      if (err) {
        dbDebugger(err.message);
      }
      else {
        dbDebugger('DB closed.');
      }
      process.exit(1);
    });
});

module.exports.getPeriods = getPeriods;
module.exports.getStudentsByPeriod = getStudentsByPeriod;
module.exports.insertStudent = insertStudent;
module.exports.getStudent = getStudent;
module.exports.updateStudent = updateStudent;
module.exports.updateStudentGoal = updateStudentGoal;
module.exports.updateStudents = updateStudents;
module.exports.deleteStudents = deleteStudents;
module.exports.deleteStudent = deleteStudent;
module.exports.getFellow = getFellow;
module.exports.insertFellow = insertFellow;
module.exports.updateFellow = updateFellow;
