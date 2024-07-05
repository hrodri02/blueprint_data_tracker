require('express-async-errors');
const winston = require('winston');
winston.add(new winston.transports.File({filename: './logs/logfile.log', handleRejections: false, handleExceptions: false}));
winston.exceptions.handle(new winston.transports.File({ filename: './logs/uncaughtExceptions.log' }));
winston.rejections.handle(new winston.transports.File({ filename: './logs/uncaughtRejections.log' }));

module.exports = function (err, req, res, next) {
    winston.error(err.message, err);
    res.status(500).send('Internal server error.');
}