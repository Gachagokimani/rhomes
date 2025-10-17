// logger.js - Custom logger implementation (using Winston)
import winston from 'winston';
const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom format that includes error stack traces when available
const customFormat = printf(({ level, message, timestamp, stack }) => {
    const logMessage = `${timestamp} [${level}]: ${stack || message}`;
    return logMessage;
});

// Create logger instance
const logger = winston.createLogger({
    level: 'debug',
    format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        customFormat
    ),
    transports: [
        // Console transport for development
        new winston.transports.Console(),
        // File transports for production
        new winston.transports.File({ 
            filename: 'logs/error.log', 
            level: 'error' 
        }),
        new winston.transports.File({ 
            filename: 'logs/combined.log' 
        })
    ],
    // Handle exceptions separately
    exceptionHandlers: [
        new winston.transports.File({ 
            filename: 'logs/exceptions.log' 
        })
    ]
});

// Handle unhandled promise rejections
logger.rejections = new winston.transports.File({ 
    filename: 'logs/rejections.log' 
});

export default logger;