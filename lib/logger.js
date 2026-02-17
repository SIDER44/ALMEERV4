const config = require('../config');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function getTimestamp() {
  return new Date().toLocaleTimeString();
}

module.exports = {
  info: (message, data = '') => {
    console.log(`${colors.cyan}[${getTimestamp()}] [INFO]${colors.reset} ${message}`, data);
  },
  
  success: (message, data = '') => {
    console.log(`${colors.green}[${getTimestamp()}] [SUCCESS]${colors.reset} ${message}`, data);
  },
  
  warn: (message, data = '') => {
    console.log(`${colors.yellow}[${getTimestamp()}] [WARN]${colors.reset} ${message}`, data);
  },
  
  error: (message, data = '') => {
    console.log(`${colors.red}[${getTimestamp()}] [ERROR]${colors.reset} ${message}`, data);
  },
  
  debug: (message, data = '') => {
    if (process.env.DEBUG) {
      console.log(`${colors.magenta}[${getTimestamp()}] [DEBUG]${colors.reset} ${message}`, data);
    }
  },
  
  command: (command, from, user) => {
    console.log(`${colors.blue}[${getTimestamp()}] [CMD]${colors.reset} ${command} from ${user} in ${from}`);
  }
};
