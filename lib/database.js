const fs = require('fs-extra');
const path = require('path');
const config = require('../config');
const logger = require('./logger');

class Database {
  constructor() {
    this.data = {
      users: {},
      groups: {},
      economy: {},
      settings: {}
    };
  }

  init() {
    // Create database directory if not exists
    fs.ensureDirSync('./database');
    
    // Initialize JSON files
    Object.keys(config.dbPath).forEach(key => {
      const filePath = config.dbPath[key];
      if (!fs.existsSync(filePath)) {
        fs.writeJsonSync(filePath, {});
      }
    });
    
    // Load data
    this.loadAll();
    logger.info('Database initialized');
  }

  loadAll() {
    Object.keys(config.dbPath).forEach(key => {
      const filePath = config.dbPath[key];
      try {
        this.data[key] = fs.readJsonSync(filePath);
      } catch (error) {
        this.data[key] = {};
      }
    });
  }

  save(key) {
    const filePath = config.dbPath[key];
    fs.writeJsonSync(filePath, this.data[key], { spaces: 2 });
  }

  // User methods
  getUser(jid) {
    if (!this.data.users[jid]) {
      this.data.users[jid] = {
        jid,
        name: '',
        level: 0,
        xp: 0,
        limit: config.limits.daily,
        premium: false,
        banned: false,
        afk: false,
        afkReason: '',
        registered: Date.now(),
        lastSeen: Date.now()
      };
      this.save('users');
    }
    return this.data.users[jid];
  }

  updateUser(jid, data) {
    this.data.users[jid] = { ...this.getUser(jid), ...data, lastSeen: Date.now() };
    this.save('users');
  }

  // Group methods
  getGroup(jid) {
    if (!this.data.groups[jid]) {
      this.data.groups[jid] = {
        jid,
        name: '',
        welcome: config.welcomeMsg,
        antiLink: config.antiLink,
        nsfw: false,
        members: {},
        settings: {}
      };
      this.save('groups');
    }
    return this.data.groups[jid];
  }

  updateGroup(jid, data) {
    this.data.groups[jid] = { ...this.getGroup(jid), ...data };
    this.save('groups');
  }

  // Economy methods
  getEconomy(jid) {
    if (!this.data.economy[jid]) {
      this.data.economy[jid] = {
        wallet: 1000,
        bank: 0,
        daily: 0,
        lastDaily: null,
        inventory: [],
        job: null
      };
      this.save('economy');
    }
    return this.data.economy[jid];
  }

  updateEconomy(jid, data) {
    this.data.economy[jid] = { ...this.getEconomy(jid), ...data };
    this.save('economy');
  }

  // Settings methods
  getSettings() {
    return this.data.settings;
  }

  updateSettings(data) {
    this.data.settings = { ...this.data.settings, ...data };
    this.save('settings');
  }
}

module.exports = new Database();
