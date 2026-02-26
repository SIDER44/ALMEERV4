import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../database/db.json');

const defaultDB = {
  users: {},
  groups: {},
  settings: {
    mode: config.mode,
    prefix: config.prefix,
    autoTyping: true,
    autoRecording: false,
    autoRead: true,
    autoOnline: false,
    autoViewStatus: false,
    autoReactStatus: false,
    reactEmoji: '❤️',
    autoReply: false,
    autoReplyMsg: 'Bot is busy, please wait!',
    antiDelete: false,
    antiDeleteStatus: false,
    antiCall: true,
    antiViewOnce: false,
  },
  premium: [],
  banned: [],
};

const ensureDB = () => {
  if (!fs.existsSync(dbPath)) {
    fs.ensureFileSync(dbPath);
    fs.writeJSONSync(dbPath, defaultDB, { spaces: 2 });
  }
};

ensureDB();

const readDB = () => {
  try { return fs.readJSONSync(dbPath); }
  catch { return { ...defaultDB }; }
};

const writeDB = (data) => {
  try { fs.writeJSONSync(dbPath, data, { spaces: 2 }); }
  catch (e) { console.error('[DB]', e.message); }
};

const db = {
  get: (key) => { const d = readDB(); return key ? d[key] : d; },
  set: (key, value) => { const d = readDB(); d[key] = value; writeDB(d); },

  getUser: (jid) => {
    const d = readDB();
    if (!d.users[jid]) {
      d.users[jid] = { jid, warn: 0, banned: false, premium: false, afk: false, joinedAt: Date.now() };
      writeDB(d);
    }
    return d.users[jid];
  },
  setUser: (jid, obj) => {
    const d = readDB();
    d.users[jid] = { ...d.users[jid], ...obj };
    writeDB(d);
  },

  getGroup: (jid) => {
    const d = readDB();
    if (!d.groups[jid]) {
      d.groups[jid] = {
        jid, antilink: false, antibadword: false, antispam: false,
        antiDelete: false, antiRaid: false, antiFake: false,
        welcome: true, bye: true, levelUp: false,
      };
      writeDB(d);
    }
    return d.groups[jid];
  },
  setGroup: (jid, obj) => {
    const d = readDB();
    d.groups[jid] = { ...d.groups[jid], ...obj };
    writeDB(d);
  },

  getSetting: (key) => { const d = readDB(); return d.settings[key]; },
  setSetting: (key, value) => {
    const d = readDB();
    d.settings[key] = value;
    writeDB(d);
  },

  isBanned: (jid) => { const d = readDB(); return (d.banned || []).includes(jid); },
  isPremium: (jid) => { const d = readDB(); return (d.premium || []).includes(jid); },
};

export default db;
