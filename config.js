import 'dotenv/config';

const config = {
  botName: 'ALMEERv4',
  botVersion: '4.0.0',
  prefix: process.env.PREFIX || '.',
  mode: process.env.MODE || 'public',
  ownerNumber: process.env.OWNER_NUMBER || '1234567890',
  ownerName: process.env.OWNER_NAME || 'Sydney Sider',
  sessionPath: './sessions',
  dbPath: './database/db.json',
  autoRead: true,
  autoTyping: true,
  autoRecording: false,
  autoReconnect: true,
  commandCooldown: 3000,
  port: process.env.PORT || 3000,
};

export default config;
