require('dotenv').config();

module.exports = {
  botName: 'ALMEERv4',
  botVersion: '4.0.0',
  prefix: process.env.PREFIX || '.',
  mode: process.env.MODE || 'public',
  ownerNumber: process.env.OWNER_NUMBER || '1234567890',
  ownerName: process.env.OWNER_NAME || 'Sider',
  sessionPath: './sessions',
  dbPath: './database/db.json',
  openAIKey: process.env.OPENAI_KEY || '',
  autoRead: true,
  autoTyping: true,
  autoRecording: false,
  antiCrash: true,
  autoReconnect: true,
  commandCooldown: 3000,
  port: process.env.PORT || 3000,
};0,
};
