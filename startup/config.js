const express = require('express');
const path = require('path');
const session = require('express-session');
const config = require('config');
const mockAuth = require('../tests/middleware/mockAuth');

module.exports = function(app) {
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
    if (process.env.NODE_ENV === 'test') {
        app.use(mockAuth);
    }
}