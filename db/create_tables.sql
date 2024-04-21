-- create tables
CREATE TABLE fellows (id TEXT PRIMARY KEY NOT NULL, 
                      name TEXT NOT NULL,
					  email TEXT NOT NULL,
					  sheets_permissions INTEGER NOT NULL);
CREATE TABLE students (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, 
					    fellow_id TEXT NOT NULL,
					    name TEXT NOT NULL, 
					    period INTEGER NOT NULL, 
					   sheets_row INTEGER NOT NULL,
					   FOREIGN KEY (fellow_id) REFERENCES fellows(id));