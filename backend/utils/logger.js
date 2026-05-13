import winston from 'winston';
import { existsSync, mkdirSync } from 'fs';

// Ensure logs directory exists
if (!existsSync('logs')) mkdirSync('logs');

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  let log = `${timestamp} [${level}] ${message}`;
  if (Object.keys(meta).length) log += ` ${JSON.stringify(meta)}`;
  if (stack) log += `\n${stack}`;
  return log;
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    // Console — colorized in dev
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: 'HH:mm:ss' }),
        errors({ stack: true }),
        logFormat
      ),
    }),
    // File — errors only
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    // File — all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
});

export default logger;
