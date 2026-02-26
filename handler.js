const fs = require('fs');
const path = require('path');
const config = require('./config');
const db = require('./lib/database');
const { isOnCooldown } = require('./lib/utils');
const chalk = require('chalk');

const plugins = new Map();

const loadPlugins = () => {
  const pluginDir = path.join(__dirname, 'plugins');
  const files = fs.readdirSync(pluginDir).filter(f => f.endsWith('.js') && f !== 'events.js');
  files.forEach(file => {
    try {
      const plugin = require(path.join(pluginDir, file));
      if (Array.isArray(plugin)) plugin.forEach(cmd => plugins.set(cmd.command, cmd));
      else if (plugin.command) plugins.set(plugin.command, plugin);
      console.log(chalk.green(`[PLUGIN] Loaded: ${file}`));
    } catch (e) { console.error(chalk.red(`[PLUGIN] Failed ${file}: ${e.message}`)); }
  });
  console.log(chalk.cyan(`[PLUGIN] Total: ${plugins.size} commands`));
};

loadPlugins();

const handler = async (sock, msg) => {
  try {
    if (!msg.message) return;

    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    const sender = isGroup ? msg.key.participant : msg.key.remoteJid;
    const senderNum = sender?.replace('@s.whatsapp.net', '');
    const isOwner = senderNum === config.ownerNumber;
    const isPremium = db.isPremium(sender) || isOwner;

    if (db.isBanned(sender) && !isOwner) return;

    // Extract text
    const msgType = Object.keys(msg.message)[0];
    let body = '';
    if (msgType === 'conversation') body = msg.message.conversation;
    else if (msgType === 'extendedTextMessage') body = msg.message.extendedTextMessage.text;
    else if (msgType === 'imageMessage') body = msg.message.imageMessage.caption || '';
    else if (msgType === 'videoMessage') body = msg.message.videoMessage.caption || '';

    // AFK check — notify sender if target is AFK
    if (isGroup) {
      const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      for (const jid of mentioned) {
        const u = db.getUser(jid);
        if (u?.afk) {
          const elapsed = Math.floor((Date.now() - u.afkTime) / 60000);
          await sock.sendMessage(from, {
            text: `😴 @${jid.split('@')[0]} is AFK\n📝 Reason: ${u.afkReason}\n⏱️ Since: ${elapsed} min ago`,
            mentions: [jid],
          });
        }
      }
      // Remove AFK if they send a message
      const senderUser = db.getUser(sender);
      if (senderUser?.afk) {
        db.setUser(sender, { afk: false });
        await sock.sendMessage(from, { text: `✅ @${senderNum} is no longer AFK`, mentions: [sender] });
      }
      // Group protection events
      await handleGroupEvents(sock, msg, from, sender, body);
    }

    const prefix = db.getSetting('prefix') || config.prefix;
    if (!body.startsWith(prefix)) return;

    const args = body.slice(prefix.length).trim().split(/\s+/);
    const command = args.shift().toLowerCase();
    const text = args.join(' ');

    const mode = db.getSetting('mode') || config.mode;
    if (mode === 'private' && !isOwner) {
      const autoReply = db.getSetting('autoReply');
      const replyMsg = db.getSetting('autoReplyMsg') || 'Bot is in private mode.';
      if (autoReply) await sock.sendMessage(from, { text: replyMsg }, { quoted: msg });
      return;
    }

    console.log(chalk.yellow(`[CMD] .${command} | ${senderNum}`));

    if (db.getSetting('autoTyping') ?? config.autoTyping)
      await sock.sendPresenceUpdate('composing', from);
    if (db.getSetting('autoRecording'))
      await sock.sendPresenceUpdate('recording', from);

    const plugin = plugins.get(command);
    if (!plugin) {
      return sock.sendMessage(from, {
        text: `❌ Unknown: *${prefix}${command}*\nType *${prefix}menu* for all commands.`
      }, { quoted: msg });
    }

    if (plugin.ownerOnly && !isOwner)
      return sock.sendMessage(from, { text: '👑 Owner only command.' }, { quoted: msg });
    if (plugin.premiumOnly && !isPremium)
      return sock.sendMessage(from, { text: '💎 Premium only command.' }, { quoted: msg });
    if (plugin.groupOnly && !isGroup)
      return sock.sendMessage(from, { text: '👥 Use this in a group.' }, { quoted: msg });
    if (plugin.privateOnly && isGroup)
      return sock.sendMessage(from, { text: '💬 Use this in private chat.' }, { quoted: msg });

    if (!isOwner) {
      const cd = isOnCooldown(sender, command, plugin.cooldown || config.commandCooldown);
      if (cd) return sock.sendMessage(from, { text: `⏳ Wait *${cd}s* before using this again.` }, { quoted: msg });
    }

    await plugin.execute({ sock, msg, from, sender, args, text, isOwner, isPremium, isGroup, command, prefix, db, config });

  } catch (e) { console.error(chalk.red(`[HANDLER] ${e.message}`)); }
};

const handleGroupEvents = async (sock, msg, from, sender, body) => {
  const groupData = db.getGroup(from);
  if (groupData.antilink) {
    const linkRegex = /(https?:\/\/|www\.|chat\.whatsapp\.com|t\.me\/)/i;
    if (linkRegex.test(body)) {
      await sock.sendMessage(from, { delete: msg.key });
      await sock.sendMessage(from, {
        text: `🚫 @${sender.split('@')[0]} Links are not allowed!`,
        mentions: [sender],
      });
    }
  }
};

const groupParticipantsHandler = async (sock, update) => {
  try {
    const { id, participants, action } = update;
    const groupData = db.getGroup(id);
    const groupMeta = await sock.groupMetadata(id);
    for (const jid of participants) {
      const num = jid.replace('@s.whatsapp.net', '');
      if (action === 'add' && groupData.welcome) {
        await sock.sendMessage(id, {
          text: groupData.welcomeMsg || `👋 Welcome @${num} to *${groupMeta.subject}*! 🎉`,
          mentions: [jid],
        });
      } else if (action === 'remove' && groupData.bye) {
        await sock.sendMessage(id, {
          text: groupData.byeMsg || `👋 Goodbye @${num}!`,
          mentions: [jid],
        });
      }
    }
  } catch (e) { console.error('[GROUP EVENT]', e.message); }
};

module.exports = { handler, groupParticipantsHandler, plugins };
