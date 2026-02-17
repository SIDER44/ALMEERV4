require('dotenv').config();

module.exports = {
  // Bot Configuration
  botName: process.env.BOT_NAME || 'ALMEERV4',
  ownerNumber: process.env.OWNER_NUMBER || '923XXXXXXXXX',
  prefix: process.env.PREFIX || '.',
  sessionName: process.env.SESSION_NAME || 'session',
  mode: process.env.MODE || 'public', // public, private, groups
  autoRead: process.env.AUTO_READ === 'true',
  autoTyping: process.env.AUTO_TYPING === 'true',
  antiLink: process.env.ANTI_LINK === 'true',
  welcomeMsg: process.env.WELCOME_MSG === 'true',
  nsfw: process.env.NSFW === 'true',

  // Feature Toggles
  features: {
    economy: true,
    rpg: true,
    leveling: true,
    nsfw: false,
    antiSpam: true,
    antiDelete: true,
    autoReply: true,
    afk: true
  },

  // API Keys
  apis: {
    openai: process.env.OPENAI_API_KEY,
    weather: process.env.WEATHER_API_KEY,
    removebg: process.env.REMOVEBG_API_KEY
  },

  // Server
  port: process.env.PORT || 3000,

  // Cooldowns
  cooldown: {
    default: 3, // seconds
    download: 10,
    ai: 15,
    economy: 5
  },

  // Limits
  limits: {
    daily: 100, // commands per day for free users
    premiumDaily: 500, // commands per day for premium users
    downloadSize: 50 // MB
  },

  // Database paths
  dbPath: {
    users: './database/users.json',
    groups: './database/groups.json',
    economy: './database/economy.json',
    settings: './database/settings.json'
  }
};
