import { readdir } from 'fs/promises';
import { pathToFileURL, fileURLToPath } from 'url';
import path from 'path';
import config from './config.js';
import db from './lib/database.js';
import { isOnCooldown } from './lib/utils.js';
import chalk from 'chalk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const plugins = new Map();

export const loadPlugins = async () => {
  const pluginDir = path.join(__dirname, 'plugins');
  const files = (await readdir(pluginDir)).filter(f => f.endsWith('.js') && f !== 'events.js');

  for (const file of files) {
    try {
      const mod = await import(pathToFileURL(path.join(pluginDir, file)).href);
      const plugin = mod.default;
      if (Array.isArray(plugin)) plugin.forEach(cmd => plugins.set(cmd.command, cmd));
      else if (plugin?.command) plugins.set(plugin.command, plugin);
      console.log(chalk.green(`[PLUGIN] ✅ ${file}`));
    } catch (e) {
      console.error(chalk.red(`[PLUGIN] ❌ ${file}: ${e.message}`));
    }
  }
  console.log(chalk.cyan(`[PLUGIN] Loaded ${plugins.size} commands`));
};

export const handler = async (sock, msg) => {
  try {
    if (!msg.message) return;

    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    const sender = isGroup ? msg.key.participant : msg.key.remoteJid;
    const senderNum = sender?.replace('@s.whatsapp.net', '');
    const isOwner = senderNum === config.ownerNumber;
    const isPremium = db.isPremium(sender) || isOwner;

    if (db.isBanned(sender) && !isOwner) return;

    // ── Extract message text ─────────────────────
    const msgType = Object.keys(msg.message)[0];
    let body = '';
    if (msgType === 'conversation') body = msg.message.conversation;
    else if (msgType === 'extendedTextMessage') body = msg.message.extendedTextMessage.text;
    else if (msgType === 'imageMessage') body = msg.message.imageMessage.caption || '';
    else if (msgType === 'videoMessage') body = msg.message.videoMessage.caption || '';

    // ── AFK system ──────────────────────────────
    if (isGroup) {
      const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      for (const jid of mentioned) {
        const u = db.getUser(jid);
        if (u?.afk) {
          const mins = Math.floor((Date.now() - u.afkTime) / 60000);
          await sock.sendMessage(from, {
            text: `😴 @${jid.split('@')[0]} is AFK\n📝 ${u.afkReason}\n⏱️ ${mins} min ago`,
            mentions: [jid],
          });
        }
      }
      const me = db.getUser(sender);
      if (me?.afk && body) {
        db.setUser(sender, { afk: false });
        await sock.sendMessage(from, { text: `✅ @${senderNum} is no longer AFK`, mentions: [sender] });
      }

      // Anti-link check
      const g = db.getGroup(from);
      if (g.antilink && /(https?:\/\/|www\.|chat\.whatsapp\.com|t\.me\/)/i.test(body)) {
        await sock.sendMessage(from, { delete: msg.key });
        await sock.sendMessage(from, { text: `🚫 @${senderNum} Links are not allowed!`, mentions: [sender] });
        return;
      }
    }

    // ── Only handle commands past here ───────────
    const prefix = db.getSetting('prefix') || config.prefix;
    if (!body.startsWith(prefix)) return;

    const args = body.slice(prefix.length).trim().split(/\s+/);
    const command = args.shift().toLowerCase();
    const text = args.join(' ');

    // ── Private mode ─────────────────────────────
    const mode = db.getSetting('mode') || config.mode;
    if (mode === 'private' && !isOwner) {
      if (db.getSetting('autoReply')) {
        await sock.sendMessage(from, {
          text: db.getSetting('autoReplyMsg') || '🔒 Bot is in private mode.'
        }, { quoted: msg });
      }
      return;
    }

    console.log(chalk.yellow(`[CMD] .${command} | ${senderNum}`));

    // ── Presence indicators ──────────────────────
    if (db.getSetting('autoTyping') ?? config.autoTyping)
      await sock.sendPresenceUpdate('composing', from);
    if (db.getSetting('autoRecording'))
      await sock.sendPresenceUpdate('recording', from);

    // ── Find plugin ──────────────────────────────
    const plugin = plugins.get(command);
    if (!plugin) {
      return sock.sendMessage(from, {
        text: `❌ Unknown command: *${prefix}${command}*\n\nType *${prefix}menu* for all commands.`
      }, { quoted: msg });
    }

    // ── Permission checks ────────────────────────
    if (plugin.ownerOnly && !isOwner)
      return sock.sendMessage(from, { text: '👑 This command is *owner only*.' }, { quoted: msg });
    if (plugin.premiumOnly && !isPremium)
      return sock.sendMessage(from, { text: '💎 This command is *premium only*.' }, { quoted: msg });
    if (plugin.groupOnly && !isGroup)
      return sock.sendMessage(from, { text: '👥 Use this command in a *group*.' }, { quoted: msg });
    if (plugin.privateOnly && isGroup)
      return sock.sendMessage(from, { text: '💬 Use this in *private chat*.' }, { quoted: msg });

    // ── Cooldown ─────────────────────────────────
    if (!isOwner) {
      const cd = isOnCooldown(sender, command, plugin.cooldown || config.commandCooldown);
      if (cd) return sock.sendMessage(from, { text: `⏳ Wait *${cd}s* before using this again.` }, { quoted: msg });
    }

    // ── Run ──────────────────────────────────────
    await plugin.execute({ sock, msg, from, sender, args, text, isOwner, isPremium, isGroup, command, prefix, db, config });

  } catch (e) {
    console.error(chalk.red(`[HANDLER ERROR] ${e.message}`));
  }
};

export const groupParticipantsHandler = async (sock, update) => {
  try {
    const { id, participants, action } = update;
    const g = db.getGroup(id);
    const meta = await sock.groupMetadata(id);
    for (const jid of participants) {
      const num = jid.replace('@s.whatsapp.net', '');
      if (action === 'add' && g.welcome) {
        await sock.sendMessage(id, {
          text: g.welcomeMsg || `👋 Welcome @${num} to *${meta.subject}*! 🎉`,
          mentions: [jid],
        });
      } else if (action === 'remove' && g.bye) {
        await sock.sendMessage(id, {
          text: g.byeMsg || `👋 Goodbye @${num}!`,
          mentions: [jid],
        });
      }
    }
  } catch (e) { console.error('[GROUP EVENT]', e.message); }
};

export { plugins };
