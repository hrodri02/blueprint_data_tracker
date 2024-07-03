const path = require('path');
const session = require('express-session');
const config = require('config');

module.exports = function(app, express) {
    const oneDay = 1000 * 60 * 60 * 24;
    app.use(express.static(path.join(__dirname, '../public')));
    app.use(express.static(path.join(__dirname, '../')));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true })); 
    app.use(session({
        secret: config.get('session_secret'),
        saveUninitialized: false,
        cookie: { maxAge: oneDay },
        resave: false
    }));
}