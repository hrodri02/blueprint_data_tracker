const express = require('express');
const path = require('path');
const app = express();
app.set('views', './templates');
app.set('view engine', 'pug');


app.use(express.static(path.join(__dirname, 'templates')));
app.use(express.static(path.join(__dirname, 'static')));
app.use(express.static(path.join(__dirname, '.')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'static/index.html'));
});

app.get('/student', (req, res) => {
    res.render('student', { title: 'Hey', message: 'Hi!' })
  })

app.listen(8000, () => console.log('Listening on port 8000...'));