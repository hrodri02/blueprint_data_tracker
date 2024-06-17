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

async function getStudentsByPeriod(fellowID = null) {
  return new Promise((resolve, reject) => {
      db.serialize(() => {
        // get the number of periods
        const getPeriodsSql = 'SELECT COUNT(DISTINCT period) as periods FROM students';
        let numPeriods = null;
        db.get(getPeriodsSql, [], (err, row) => {
          if (err) {
            reject(err.message);
          }
          else {
            numPeriods = row.periods;
          }
        });
        
        // get the students by period
        let getStudents = `SELECT students.*, fellows.tutor_name FROM students INNER JOIN fellows on students.fellow_id = fellows.id`;
        if (fellowID !== null) {
          getStudents += ` WHERE fellow_id = '${fellowID}'`;
        }
        db.all(getStudents, (err, rows) => {
          if (err) {
            reject(err.message);
          }
          else {
            dbDebugger('periods=', numPeriods);
            dbDebugger('rows');
            dbDebugger(rows);
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
  });
}

async function insertStudents(students) {
  const new_students = [];
  for (student of students) {
    const new_student = await insertStudent(student);
    if (new_student) {
      new_students.push(new_student);
    }
  }
  return new_students;
}

function insertStudent(student) {
  // insert one row into the students table
  const name = student['name'];
  const period = student['period'];
  const sheets_row = student['sheets_row'];
  const tutor_name = student['tutor_name'];
  const sql = 'SELECT * FROM fellows WHERE tutor_name = ?';

  return new Promise((resolve, reject) => {
    db.get(sql, [tutor_name], (err, row) => {
      if (err) {
        resolve(null);
        dbDebugger(err.message);
      }
      else {
        if (!row) {
          dbDebugger(`There is no fellow named ${tutor_name}`)
          resolve(null);
          return;
        }
        const fellow_id = row['id'];
        db.run(`INSERT INTO students(name, period, sheets_row, fellow_id) VALUES(?, ?, ?, ?)`, 
            [name, period, sheets_row, fellow_id], function(err) {
        if (err) {
          resolve(null);
          dbDebugger(err.message);
          return null;
        }
        else {
          const new_student = {
            'id': this.lastID,
            'name': name,
            'period': period,
            'sheets_row': sheets_row,
            'fellow_id': fellow_id,
          };
          resolve(new_student);
          dbDebugger(this.lastID);
        }
        });
      }
    });
  });
}

async function insertStudentsForFellow(students) {
  const new_students = [];
  for (student of students) {
    const new_student = await insertStudentForFellow(student);
    if (new_student) {
      new_students.push(new_student);
    }
  }
  return new_students;
}

function insertStudentForFellow(student) {
  // insert one row into the students table
  const name = student['name'];
  const period = student['period'];
  const sheets_row = student['sheets_row'];
  const fellow_id = student['fellow_id'];
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO students(name, period, sheets_row, fellow_id) VALUES(?, ?, ?, ?)`, 
        [name, period, sheets_row, fellow_id], function(err) {
    if (err) {
      resolve(null);
      dbDebugger(err.message);
      return null;
    }
    else {
      const new_student = {
        'id': this.lastID,
        'name': name,
        'period': period,
        'sheets_row': sheets_row,
        'fellow_id': fellow_id,
      };
      resolve(new_student);
      dbDebugger(this.lastID);
    }
    });
    
  });
}

async function insertStudentNote(student_note, student_id) {
  const note = student_note['note'];
  const date = student_note['date'];
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO student_notes(note, date, student_id) VALUES(?, ?, ?)`, 
        [note, date, student_id], function(err) {
      if (err) {
        dbDebugger(err.message);
        reject();
      }
      else {
        const new_note = {
          'id': this.lastID,
          'note': note,
          'date': date,
          'student_id': student_id,
        };
        dbDebugger(this.lastID);
        resolve(new_note);
      }
    });
  });
}

async function getStudentNotes(id) {
  const sql = 'SELECT * FROM student_notes WHERE student_id = ? ORDER BY date DESC';
  return new Promise((resolve, reject) => {
    db.all(sql, [id], function(err, rows) {
      if (err) {
        dbDebugger(err.message);
        reject();
      }
      else {
        dbDebugger(rows);
        resolve(rows);
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
  const updated_students = [];
  for (student of students) {
    const updated_student = await updateStudent(student);
    if (updated_student) {
      updated_students.push(updated_student);
    }
    else {
      dbDebugger(`error updating student: ${student['name']}`);
    }
  }
  return updated_students;
}

function updateStudent(student) {
  const id = student['id'];
  const name = student['name'];
  const period = student['period'];
  const sheets_row = student['sheets_row'];
  const tutor_name = student['tutor_name'];
  const sql = 'SELECT * FROM fellows WHERE tutor_name = ?';
  return new Promise((resolve, reject) => {
    db.get(sql, [tutor_name], (err, row) => {
      if (err) {
        dbDebugger(`updateStudentSync: ${err.message}`);
        resolve(null);
      }
      else {
        const fellow_id = row['id'];
        db.run(`UPDATE students SET name = ?, period = ?, sheets_row = ?, fellow_id = ? WHERE id = ?`, 
            [name, period, sheets_row, fellow_id, id], function(err) 
        {
          if (err) {
            dbDebugger(err.message);
            resolve(null);
          }
          else {
            const updated_student = {
              'id': id,
              'name': name,
              'period': period,
              'sheets_row': sheets_row,
              'fellow_id': fellow_id,
            };
            dbDebugger(`${name} updated`);
            resolve(updated_student);
          }
        });
      }
    });
  });
}

async function patchStudent(student) {
  return new Promise((resolve, reject) => {
    const id = student['id'];
    const fellow_id = student['fellow_id'];
    const name = student['name'];
    const period = student['period'];
    const sheets_row = student['sheets_row'];
    const goal = student['goal'];
    db.run(`UPDATE students SET fellow_id = ?, name = ?, period = ?, sheets_row = ?, goal = ? WHERE id = ?`, 
          [fellow_id, name, period, sheets_row, goal, id], function(err) {
      if (err) {
        reject(err.message);
      }
      else {
        dbDebugger(`student ${id} updated`);
        const updated_student = {
          'id': id,
          'name': name,
          'period': period,
          'sheets_row': sheets_row,
          'fellow_id': fellow_id,
          'goal': goal
        };
        resolve(updated_student);
      }
    });
  });
}

function deleteStudents(studentNames) {
  db.parallelize(() => {
    for (student of studentNames) {
      deleteStudent(student);
    }
  });
}

function deleteStudent(student) {
  db.run(`DELETE FROM students WHERE name = ?`, [student['name']], function(err) {
    if (err) {
      dbDebugger(err.message);
    }
    else {
      dbDebugger(`deleted ${student['name']} from DB.`)
    }
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
    const selectNewFellow = 'SELECT * FROM fellows WHERE id = ?';
    db.serialize(function() {
      db.run(sql, [id, email, name], (err) => {
        if (err) {
          dbDebugger(err.message);
          reject(err.message);
        }
      });
  
      db.get(selectNewFellow, [id], (err, row) => {
        if (err) {
          dbDebugger(err.message);
          reject(err.message);
        }
        else {
          dbDebugger(row);
          resolve(row);
        }
      });
    });
  });
}

async function updateFellow(fellow) {
  return new Promise((resolve, reject) => {
    const id = fellow['id'];
    const name = fellow['name'];
    const email = fellow['email'];
    const sheets_permissions = fellow['sheets_permissions'];
    const refresh_token = fellow['refresh_token'];
    const sheet_id = fellow['sheet_id'];
    const tutor_name = fellow['tutor_name'];
    db.run(`UPDATE fellows SET name = ?, email = ?, sheets_permissions = ?, refresh_token = ?, sheet_id = ?, tutor_name = ? WHERE id = ?`, 
          [name, email, sheets_permissions, refresh_token, sheet_id, tutor_name, id], function(err) {
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

async function insertTimersCollectionForUser(fellow_id, name) {
  return new Promise((resolve, reject) => {
    db.serialize(function() {
      const sql = 'INSERT INTO timers_collections(name, fellow_id) VALUES(?, ?)';
      const select_new_timers_collection = 'SELECT * FROM timers_collections ORDER BY id DESC LIMIT 1';
      db.run(sql, [name, fellow_id], function (err) {
        if (err) {
          dbDebugger(err.message);
          reject(err.message);
        }
      });

      db.get(select_new_timers_collection, [], (err, row) => {
        if (err) {
          dbDebugger(err.message);
          reject(err.message);
        }
        else {
          dbDebugger(row);
          resolve(row);
        }
      });
    });
  });
}

function insertTimer(timers_collections_id, timer) {
  const sql = 'INSERT INTO timers(name, minutes, text_color, background_color, order_id, timers_collections_id) VALUES(?, ?, ?, ?, ?, ?)';
  const select_new_timer = 'SELECT * FROM timers ORDER BY id DESC LIMIT 1';
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(sql, [timer.name, timer.minutes, timer.text_color, timer.background_color, timer.order_id, timers_collections_id], (err) => {
        if (err) {
          dbDebugger(err.message);
          reject(err.message);
        }
      });
  
      db.get(select_new_timer, [], (error, row) => {
        if (error) {
          dbDebugger(error.message);
          reject(error.message);
        }
        else {
          resolve(row);
        }
      });
    });
  });
}

function getTimersCollection(id) {
  const select_new_timers_collection = 'SELECT * FROM timers_collections WHERE id = ?';
  return new Promise((resolve, reject) => {
    db.get(select_new_timers_collection, [id], (err, row) => {
      if (err) {
        dbDebugger(err.message);
        reject(err.message);
      }
      else {
        dbDebugger(row);
        resolve(row);
      }
    });
  });
}

function getTimersCollectionsForFellow(fellow_id) {
  const sql = `SELECT timers.id, timers.name, timers.minutes, timers.order_id, timers.text_color, timers.background_color, timers_collections.id AS timers_collection_id, timers_collections.name AS timers_collection_name FROM timers_collections LEFT JOIN timers on timers_collections.id = timers.timers_collections_id WHERE fellow_id = '${fellow_id}'`;
  return new Promise((resolve, reject) => {
    db.all(sql, function(err, rows) {
      if (err) {
        dbDebugger(err.message);
        reject();
      }
      else {
        dbDebugger(rows);
        /*
        id_to_collection
        {
          id: {name: "", timers: []}
        }
        */
        const id_to_collection = {};
        for (row of rows) {
          const collection_id = row['timers_collection_id'];
          if (!(collection_id in id_to_collection)) {
            id_to_collection[collection_id] = {};
            id_to_collection[collection_id]['name'] = row['timers_collection_name'];
            id_to_collection[collection_id]['timers'] = [];
          }
          if (row.id) {
            const timer = {
              id: row.id,
              name: row.name,
              minutes: row.minutes,
              text_color: row.text_color,
              background_color: row.background_color,
              order_id: row.order_id
            };
            
            id_to_collection[collection_id]['timers'].push(timer);
          }
        }
        for (id of Object.keys(id_to_collection)) {
          id_to_collection[id]['timers'].sort((a, b) => a.order_id - b.order_id);
        }
        resolve(id_to_collection);
      }
    });
  });
}

function getTimer(id) {
  const select_timer = 'SELECT * FROM timers WHERE id = ?';
  return new Promise((resolve, reject) => {
    db.get(select_timer, [id], (err, row) => {
      if (err) {
        dbDebugger(err.message);
        reject(err.message);
      }
      else {
        dbDebugger(row);
        resolve(row);
      }
    });
  });
}

function deleteTimer(id) {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM timers WHERE id = ?`, [id], function(err) {
      if (err) {
        dbDebugger(err.message);
        reject(err.message);
      }
      else {
        dbDebugger(`deleted timer ${id} from DB.`);
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
module.exports.insertStudents = insertStudents;
module.exports.insertStudentsForFellow = insertStudentsForFellow;
module.exports.insertStudentNote = insertStudentNote;
module.exports.getStudentNotes = getStudentNotes;
module.exports.getStudent = getStudent;
module.exports.patchStudent = patchStudent;
module.exports.updateStudents = updateStudents;
module.exports.deleteStudents = deleteStudents;
module.exports.deleteStudent = deleteStudent;
module.exports.getFellow = getFellow;
module.exports.insertFellow = insertFellow;
module.exports.updateFellow = updateFellow;
module.exports.insertTimersCollectionForUser = insertTimersCollectionForUser;
module.exports.insertTimer = insertTimer;
module.exports.getTimersCollection = getTimersCollection;
module.exports.getTimersCollectionsForFellow = getTimersCollectionsForFellow;
module.exports.getTimer = getTimer;
module.exports.deleteTimer = deleteTimer;