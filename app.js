const express = require('express');
const path = require('path');
const students = require('./student');
const app = express();
app.set('views', './templates');
app.set('view engine', 'pug');

const periods = ["First", "Second", "Third", "Fourth", "Sixth", "Seventh"];

app.use(express.static(path.join(__dirname, 'templates')));
app.use(express.static(path.join(__dirname, 'static')));
app.use(express.static(path.join(__dirname, '.')));

app.get('/', (req, res) => {
  res.render('index', {periods: periods, students: students});
});

app.get('/student', (req, res) => {
  res.send('student');
});

app.listen(8000, () => console.log('Listening on port 8000...'));