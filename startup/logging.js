require('express-async-errors');
const winston = require('winston');

module.exports = function() {
    const rejectionLogger = winston.createLogger({
        level: 'error',
        transports: [
          new winston.transports.File({ filename: './logs/unhandledRejections.log', handleRejections: true, handleExceptions: false })
        ],
    });
    
    process.on('unhandledRejection', (ex) => {
        rejectionLogger.error(ex.message, ex);
    });
    
    const exceptionLogger = winston.createLogger({
        level: 'error',
        transports: [
          new winston.transports.Console({ colorize: true, prettyPrint: true }),
          new winston.transports.File({ filename: './logs/uncaughtExceptions.log', handleExceptions: true })
        ],
    });
    
    process.on('uncaughtException', (ex) => {
        exceptionLogger.error(ex.message, ex);
    });    
}