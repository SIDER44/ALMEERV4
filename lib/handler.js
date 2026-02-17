const fs = require('fs-extra');
const path = require('path');
const config = require('../config');
const database = require('./database');
const logger = require('./logger');
const utils = require('./utils');

class CommandHandler {
  constructor() {
    this.commands = new Map();
    this.aliases = new Map();
    this.cooldowns = new Map();
    this.categories = new Set();
    this.loadCommands();
  }

  loadCommands() {
    const commandsPath = path.join(__dirname, '../commands');
    const categories = fs.readdirSync(commandsPath);

    categories.forEach(category => {
      const categoryPath = path.join(commandsPath, category);
      if (fs.statSync(categoryPath).isDirectory()) {
        this.categories.add(category);
        
        const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));
        
        commandFiles.forEach(file => {
          try {
            const command = require(path.join(categoryPath, file));
            
            // Register command
            this.commands.set(command.name, {
              ...command,
              category,
              path: path.join(categoryPath, file)
            });
            
            // Register aliases
            if (command.aliases) {
              command.aliases.forEach(alias => {
                this.aliases.set(alias, command.name);
              });
            }
            
            logger.debug(`Loaded command: ${command.name} (${category})`);
          } catch (error) {
            logger.error(`Failed to load command ${file}:`, error);
          }
        });
      }
    });

    logger.success(`Loaded ${this.commands.size} commands from ${this.categories.size} categories`);
  }

  getCommand(name) {
    const cmdName = this.aliases.get(name) || name;
    return this.commands.get(cmdName);
  }

  async handleMessage(sock, msg) {
    try {
      const { key, message } = msg;
      const from = key.remoteJid;
      const sender = key.participant || from;
      const pushName = msg.pushName || '';

      // Get user data
      const user = database.getUser(sender);
      
      // Check if user is banned
      if (user.banned) return;

      // Get message text
      const messageType = Object.keys(message)[0];
      let body = '';

      if (messageType === 'conversation') {
        body = message.conversation;
      } else if (messageType === 'extendedTextMessage') {
        body = message.extendedTextMessage.text;
      } else if (messageType === 'imageMessage') {
        body = message.imageMessage.caption || '';
      } else if (messageType === 'videoMessage') {
        body = message.videoMessage.caption || '';
      }

      // Check if message starts with prefix
      if (!body.startsWith(config.prefix)) return;

      // Parse command
      const args = body.slice(config.prefix.length).trim().split(/ +/);
      const commandName = args.shift().toLowerCase();
      const command = this.getCommand(commandName);

      if (!command) return;

      // Log command usage
      logger.command(commandName, from, sender);

      // Check cooldown
      const cooldownKey = `${sender}_${command.name}`;
      const cooldown = this.cooldowns.get(cooldownKey);
      
      if (cooldown && Date.now() - cooldown < (command.cooldown || config.cooldown.default) * 1000) {
        const timeLeft = Math.ceil(((command.cooldown || config.cooldown.default) * 1000 - (Date.now() - cooldown)) / 1000);
        return await sock.sendMessage(from, { 
          text: `⏳ Please wait ${timeLeft} seconds before using this command again.` 
        }, { quoted: msg });
      }

      // Check permissions
      if (command.owner && sender.split('@')[0] !== config.ownerNumber) {
        return await sock.sendMessage(from, { 
          text: '❌ This command is only for the bot owner!' 
        }, { quoted: msg });
      }

      if (command.admin) {
        const isAdmin = await utils.isAdmin(sock, from, sender);
        if (!isAdmin) {
          return await sock.sendMessage(from, { 
            text: '❌ This command is only for group admins!' 
          }, { quoted: msg });
        }
      }

      if (command.group && !from.endsWith('@g.us')) {
        return await sock.sendMessage(from, { 
          text: '❌ This command can only be used in groups!' 
        }, { quoted: msg });
      }

      if (command.nsfw && !config.nsfw) {
        return await sock.sendMessage(from, { 
          text: '❌ NSFW commands are disabled!' 
        }, { quoted: msg });
      }

      // Add to cooldown
      this.cooldowns.set(cooldownKey, Date.now());
      
      // Auto typing effect
      if (config.autoTyping) {
        await sock.sendPresenceUpdate('composing', from);
      }

      // Execute command
      try {
        await command.execute(sock, msg, args, {
          user,
          from,
          sender,
          pushName,
          config,
          database,
          utils
        });
      } catch (error) {
        logger.error(`Error executing command ${command.name}:`, error);
        await sock.sendMessage(from, { 
          text: '❌ An error occurred while executing the command.' 
        }, { quoted: msg });
      }

    } catch (error) {
      logger.error('Error handling message:', error);
    }
  }

  async handleGroupParticipants(sock, update) {
    const { id, participants, action } = update;
    
    if (action === 'add') {
      for (const participant of participants) {
        // Send welcome message
        const groupMetadata = await sock.groupMetadata(id);
        const welcomeText = `👋 Welcome @${participant.split('@')[0]} to *${groupMetadata.subject}*!\n\n📝 Read the group description to avoid being kicked.`;
        
        await sock.sendMessage(id, { 
          text: welcomeText,
          mentions: [participant]
        });
      }
    } else if (action === 'remove') {
      for (const participant of participants) {
        // Send goodbye message
        const goodbyeText = `👋 Goodbye @${participant.split('@')[0]}, we'll miss you!`;
        
        await sock.sendMessage(id, { 
          text: goodbyeText,
          mentions: [participant]
        });
      }
    }
  }

  async handleDeleteMessage(sock, deleteInfo) {
    // Anti-delete feature - notify when someone deletes a message
    const { id: chatId, fromMe, participant, remoteJid } = deleteInfo.keys[0];
    
    if (!fromMe && remoteJid.endsWith('@g.us')) {
      await sock.sendMessage(remoteJid, { 
        text: `⚠️ @${participant.split('@')[0]} deleted a message!`,
        mentions: [participant]
      });
    }
  }

  getCommandsCount() {
    return this.commands.size;
  }
}

module.exports = new CommandHandler();
