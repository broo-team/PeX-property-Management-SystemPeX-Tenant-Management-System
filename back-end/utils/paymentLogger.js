// utils/paymentLogger.js
const fs = require('fs');
const path = require('path');
const chalk = require('chalk'); // Optional for colored logs
const { format } = require('date-fns');

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logLevels = {
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error'
};

const logPaymentEvent = (eventType, details, meta = {}) => {
  const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss.SSS');
  const logEntry = {
    timestamp,
    service: 'payment-service',
    environment: process.env.NODE_ENV || 'development',
    eventType,
    level: logLevels.INFO, // default
    details: typeof details === 'string' ? { message: details } : details,
    meta
  };

  // Determine log level based on event type
  if (eventType.includes('FAIL') || eventType.includes('ERROR')) {
    logEntry.level = logLevels.ERROR;
  } else if (eventType.includes('WARN')) {
    logEntry.level = logLevels.WARN;
  }

  // Stringify log entry
  const logString = JSON.stringify(logEntry);

  // Write to file
  const logFilePath = path.join(logDir, `payments-${format(new Date(), 'yyyy-MM-dd')}.log`);
  fs.appendFile(logFilePath, logString + '\n', (err) => {
    if (err) console.error('Failed to write payment log:', err);
  });

  // Console output (colored in development)
  if (process.env.NODE_ENV !== 'production') {
    const color = logEntry.level === logLevels.ERROR ? chalk.red :
      logEntry.level === logLevels.WARN ? chalk.yellow : chalk.cyan;
    
    console.log((
      `[${timestamp}] [${eventType}] ${JSON.stringify(details, null, 2)}`
    ));
  }
};

module.exports = { logPaymentEvent };