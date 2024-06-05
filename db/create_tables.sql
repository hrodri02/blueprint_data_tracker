-- create tables
CREATE TABLE fellows (id TEXT PRIMARY KEY NOT NULL, 
                      name TEXT NOT NULL,
					  email TEXT NOT NULL,
					  sheets_permissions INTEGER,
					  refresh_token TEXT,
					  tutor_name TEXT,
					  sheet_id TEXT);
CREATE TABLE students (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, 
					    fellow_id TEXT NOT NULL,
					    name TEXT NOT NULL, 
					    period INTEGER NOT NULL, 
					   sheets_row INTEGER NOT NULL,
					   FOREIGN KEY (fellow_id) REFERENCES fellows(id));
CREATE TABLE student_notes (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
							student_id INTEGER NOT NULL,
							note TEXT NOT NULL, 
							date TEXT NOT NULL,
							FOREIGN KEY (student_id) REFERENCES students(id));