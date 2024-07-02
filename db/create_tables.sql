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
						goal TEXT NOT NULL DEFAULT('No Math goal.'),
						profile_image_url TEXT NOT NULL DEFAULT('https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Default_pfp.svg/1200px-Default_pfp.svg.png'),
					   FOREIGN KEY (fellow_id) REFERENCES fellows(id));
CREATE TABLE student_notes (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
							student_id INTEGER NOT NULL,
							note TEXT NOT NULL, 
							date TEXT NOT NULL,
							FOREIGN KEY (student_id) REFERENCES students(id));
CREATE TABLE timers (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
					timers_collections_id INTEGER NOT NULL,
					name TEXT NOT NULL DEFAULT(''),
					minutes INTEGER NOT NULL,
					text_color TEXT NOT NULL DEFAULT('#ccc'),
					background_color TEXT NOT NULL DEFAULT('black'),
					order_id INTEGER NOT NULL,
					FOREIGN KEY (timers_collections_id) REFERENCES timers_collections(id));
CREATE TABLE timers_collections (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
								 fellow_id INTEGER NOT NULL,
								 name TEXT NOT NULL,
								 FOREIGN KEY (fellow_id) REFERENCES fellows(id));