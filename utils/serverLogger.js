const levels = { error: 0, warn: 1, info: 2, debug: 3 };
const levelName = (process.env.LOG_LEVEL || 'info').toLowerCase();
const current = levels[levelName] ?? levels.info;

function shouldLog(level) {
  return levels[level] <= current;
}

function format(level, args) {
  return [`[${level.toUpperCase()}]`, ...args];
}

module.exports = {
  error: (...args) => { if (shouldLog('error')) console.error(...format('error', args)); },
  warn: (...args) => { if (shouldLog('warn')) console.warn(...format('warn', args)); },
  info: (...args) => { if (shouldLog('info')) console.info(...format('info', args)); },
  debug: (...args) => { if (shouldLog('debug')) console.debug(...format('debug', args)); },
};
