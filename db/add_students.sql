-- create tables
CREATE TABLE fellows (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, 
                      name TEXT NOT NULL);
CREATE TABLE students (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, 
					    fellow_id INTEGER NOT NULL,
					    name TEXT NOT NULL, 
					    period INTEGER NOT NULL, 
					   sheets_row INTEGER NOT NULL,
					   FOREIGN KEY (fellow_id) REFERENCES fellows(id));
-- add fellows
INSERT INTO fellows (name) VALUES ('Mr. Heri');
INSERT INTO fellows (name) VALUES ('Mr. Bray');
-- first period
INSERT INTO students (name, period, sheets_row, fellow_id) VALUES ('Logwood, Joseph', 1, 18, 1);
INSERT INTO students (name, period, sheets_row, fellow_id) VALUES ('Vongphrachanh, Makaiden', 1, 21, 1);
INSERT INTO students (name, period, sheets_row, fellow_id) VALUES ('Hammond, Braylani', 1, 15, 1);
INSERT INTO students (name, period, sheets_row, fellow_id) VALUES ("Burton, So'Laya", 1, 3, 2);
-- second period
INSERT INTO students (name, period, sheets_row, fellow_id) VALUES ('Davis, Navie', 2, 51, 1);
INSERT INTO students (name, period, sheets_row, fellow_id) VALUES ('Leggett, Prince', 2, 54, 1);
INSERT INTO students (name, period, sheets_row, fellow_id) VALUES ("Andrades, Jay'Lon", 2, 48, 1);
-- third period
INSERT INTO students (name, period, sheets_row, fellow_id) VALUES ('Covian Perez, Alexandra', 3, 96, 1);
INSERT INTO students (name, period, sheets_row, fellow_id) VALUES ('Hewitt, Emeri', 3, 93, 1);
INSERT INTO students (name, period, sheets_row, fellow_id) VALUES ("Cisneros, Brian", 3, 87, 1);
INSERT INTO students (name, period, sheets_row, fellow_id) VALUES ("Ahilon-Pablo, Himelda", 3, 84, 1);
-- fourth period
INSERT INTO students (name, period, sheets_row, fellow_id) VALUES ('Hernandez, David', 4, 114, 1);
INSERT INTO students (name, period, sheets_row, fellow_id) VALUES ('Ignacio Tinajero, Juliana', 4, 117, 1);
INSERT INTO students (name, period, sheets_row, fellow_id) VALUES ("Sanchez-Flores, Roselyn", 4, 120, 1);
-- sixth period
INSERT INTO students (name, period, sheets_row, fellow_id) VALUES ('Chang Chilel, Luis', 6, 144, 1);
INSERT INTO students (name, period, sheets_row, fellow_id) VALUES ('Pablo, Caleb', 6, 150, 1);
INSERT INTO students (name, period, sheets_row, fellow_id) VALUES ("Pablo Ramirez, Alex", 6, 147, 1);
INSERT INTO students (name, period, sheets_row, fellow_id) VALUES ('Ward, Lawrence', 6, 153, 1);
-- seventh period
INSERT INTO students (name, period, sheets_row, fellow_id) VALUES ('Granados Funes, Arodi', 7, 183, 1);
INSERT INTO students (name, period, sheets_row, fellow_id) VALUES ('Martin-Garcia, John', 7, 186, 1);
INSERT INTO students (name, period, sheets_row, fellow_id) VALUES ("Calmo Carrillo, Elmer", 7, 180, 1);
INSERT INTO students (name, period, sheets_row, fellow_id) VALUES ('Pierce, Khloe', 7, 189, 1);