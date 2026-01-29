import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';
const logFormat = process.env.LOG_FORMAT || 'json';

const formats = {
  json: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  pretty: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
      return `${timestamp} [${level.toUpperCase()}]: ${message} ${metaStr}`;
    })
  )
};

export const logger = winston.createLogger({
  level: logLevel,
  format: formats[logFormat as keyof typeof formats] || formats.json,
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: process.env.LOG_FILE || './logs/orchestrator.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Add request ID to all logs
export function createChildLogger(requestId: string) {
  return logger.child({ requestId });
}
