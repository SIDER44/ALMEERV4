const config = require('../config');
const cooldowns = new Map();

const isOnCooldown = (jid, command, ms = config.commandCooldown) => {
  const key = `${jid}:${command}`;
  const now = Date.now();
  if (cooldowns.has(key)) {
    const exp = cooldowns.get(key);
    if (now < exp) return Math.ceil((exp - now) / 1000);
  }
  cooldowns.set(key, now + ms);
  return false;
};

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024, sizes = ['B','KB','MB','GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const isUrl = (str) => { try { new URL(str); return true; } catch { return false; } };
const formatRuntime = (seconds) => {
  const d = Math.floor(seconds / 86400), h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60), s = Math.floor(seconds % 60);
  return `${d > 0 ? d + 'd ' : ''}${h}h ${m}m ${s}s`;
};

module.exports = { isOnCooldown, formatBytes, sleep, randomItem, isUrl, formatRuntime };
