var winston = require('winston');
const ERROR = "error";
const WARN = "warn";
const INFO = "info";
const DEBUG = "debug";
const VERBOSE = "verbose";
const SILLY = "silly";

require('winston-daily-rotate-file');
winston.emitErrs = true;

/**
* Log to files
* Level: ERROR <- WARN <- INFO <- DEBUG <- VERBOSE <- SILLY
* Set level info: log for error, warn and info will be logged
*/

var logger = new winston.Logger({
    transports: [
        // Log to file
        new winston.transports.DailyRotateFile({
            level: ERROR,
            filename: 'log',
            datePattern: './logs/yyyy-MM-dd.',
            prepend: true,
            json: true,
            colorize: false
        }),
        new winston.transports.Console({
            level: DEBUG,
            json: false,
            colorize: true
        })
    ],
    exceptionHandlers: [
        new winston.transports.DailyRotateFile({
            level: VERBOSE,
            filename: 'exception',
            datePattern: './logs/yyyy-MM-dd.',
            prepend: true,
            json: true,
            colorize: false
        })
    ],
    exitOnError: false
});

module.exports = logger;
module.exports.stream = {
    write: function(message, encoding){
        logger.info(message);
    }
};