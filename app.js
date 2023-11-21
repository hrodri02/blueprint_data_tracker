/**
 * Required External Modules
 */
const express = require('express');
const {google} = require('./routes/google');
const path = require('path');
const home = require('./routes/home');
const students = require('./routes/students');
const users = require('./routes/users');
const session = require('express-session');
const config = require('config');

 /**
 * App Variables
 */
const app = express();
const port = process.env.PORT || 8000;
const oneDay = 1000 * 60 * 60 * 24;

/**
 *  App Configuration
 */
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '.')));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.use(session({
  secret: config.get('session_secret'),
  saveUninitialized: false,
  cookie: { maxAge: oneDay },
  resave: false
}));

/**
 * Routes
 */
app.use('/', home);
app.use('/students', students);
app.use('/users', users);
app.use('/google', google);

/**
 * Server Activation
 */
app.listen(port, () => console.log(`Listening on port ${port}...`));

/**
 * Server Deactivation
 */