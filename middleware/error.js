const winston = require('winston');
winston.add(new winston.transports.File({filename: './logs/logfile.log'}));

module.exports = function (err, req, res, next) {
    winston.error(err.message, err);
    res.status(500).send('Internal server error.');
}