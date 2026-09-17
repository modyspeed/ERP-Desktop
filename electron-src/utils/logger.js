const fs = require('fs');
const path = require('path');

const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

function writeLog(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] [${level.toUpperCase()}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}\n`;
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${level.toUpperCase()}]`, message, meta);
  }

  const logFile = path.join(logDir, `${new Date().toISOString().slice(0, 10)}.log`);
  fs.appendFile(logFile, logLine, (err) => {
    if (err) console.error('Failed to write log file:', err);
  });
}

const logger = {
  info: (msg, meta) => writeLog('info', msg, meta),
  warn: (msg, meta) => writeLog('warn', msg, meta),
  error: (msg, meta) => writeLog('error', msg, meta),
  debug: (msg, meta) => writeLog('debug', msg, meta),
};

module.exports = logger;
