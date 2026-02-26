// ── Anti-crash ────────────────────────────────────
process.on('uncaughtException', e => console.error('[ANTI-CRASH] uncaughtException:', e.message));
process.on('unhandledRejection', e => console.error('[ANTI-CRASH] unhandledRejection:', e?.message || e));

import {
  default as makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  makeInMemoryStore,
} from '@whiskeysockets/baileys';

import pino from 'pino';
import chalk from 'chalk';
import fs from 'fs-extra';
import readline from 'readline';
import { createServer } from 'http';

import config from './config.js';
import db from './lib/database.js';
import { loadPlugins, handler, groupParticipantsHandler } from './handler.js';
import { registerEvents } from './plugins/events.js';

// ── Setup ─────────────────────────────────────────
const logger = pino({ level: 'silent' });
const store = makeInMemoryStore({ logger });

fs.ensureDirSync('./sessions');
fs.ensureDirSync('./database');
fs.ensureFileSync('./database/store.json');

try { store.readFromFile('./database/store.json'); } catch {}
setInterval(() => { try { store.writeToFile('./database/store.json'); } catch {} }, 10000);

// ── Keep-alive HTTP server ────────────────────────
createServer((_, res) => { res.writeHead(200); res.end('ALMEERv4 🤖 Online'); })
  .listen(config.port, () => console.log(chalk.green(`[SERVER] Port ${config.port} ✅`)));

// ── Pairing code input helper ─────────────────────
const askQuestion = (q) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(r => rl.question(q, a => { rl.close(); r(a.trim()); }));
};

let retryCount = 0;

// ── Start bot ─────────────────────────────────────
const startBot = async () => {
  await loadPlugins();

  console.log(chalk.cyan(`
╭━━━━━━━━━━━━━━━━━━━━━━╮
┃    🤖 ALMEERv4 v4.0  ┃
┃    Node ${process.version.padEnd(13)}┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`));

  const { state, saveCreds } = await useMultiFileAuthState('./sessions');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    browser: ['ALMEERv4', 'Chrome', '4.0.0'],
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
  });

  store.bind(sock.ev);
  registerEvents(sock, db);

  // ── Pairing code on first run ──────────────────
  if (!sock.authState.creds.registered) {
    let phone = config.ownerNumber;
    if (!phone || phone === '1234567890') {
      phone = await askQuestion(chalk.cyan('\n[INPUT] Enter your number (country code, no +): '));
    }
    phone = phone.replace(/[^0-9]/g, '');
    await new Promise(r => setTimeout(r, 3000));
    try {
      const code = await sock.requestPairingCode(phone);
      console.log(chalk.bgGreen.black(`\n  ✅ PAIRING CODE: ${code}  \n`));
      console.log(chalk.yellow('  WhatsApp → Linked Devices → Link with phone number\n'));
    } catch (e) {
      console.error('[PAIRING ERROR]', e.message);
    }
  }

  // ── Connection events ──────────────────────────
  sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
    if (connection === 'open') {
      retryCount = 0;
      console.log(chalk.green('\n[✅] ALMEERv4 Connected!\n'));
      try {
        await sock.sendMessage(`${config.ownerNumber}@s.whatsapp.net`, {
          text: `╭━━〔 ✅ *ALMEERv4 Online* 〕━━⬣\n┃ 🤖 Bot is now connected!\n┃ 📅 ${new Date().toLocaleString()}\n┃ 🚀 Node.js ${process.version}\n╰━━━━━━━━━━━━━━━⬣`
        });
      } catch {}
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = code === DisconnectReason.loggedOut;
      console.log(chalk.red(`[DISCONNECT] Code: ${code} | LoggedOut: ${loggedOut}`));

      if (!loggedOut && config.autoReconnect && retryCount < 10) {
        retryCount++;
        const delay = Math.min(retryCount * 5000, 60000);
        console.log(chalk.yellow(`[RECONNECT] Attempt ${retryCount}/10 in ${delay / 1000}s...`));
        setTimeout(startBot, delay);
      } else {
        console.log(chalk.red('[BOT] Stopped. Clear sessions folder to re-pair.'));
        process.exit(0);
      }
    }
  });

  // ── Save credentials ───────────────────────────
  sock.ev.on('creds.update', saveCreds);

  // ── Messages ───────────────────────────────────
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      await handler(sock, msg);
    }
  });

  // ── Group members join/leave ───────────────────
  sock.ev.on('group-participants.update', async update => {
    await groupParticipantsHandler(sock, update);
  });
};

startBot().catch(e => {
  console.error(chalk.red('[FATAL]', e.message));
  process.exit(1);
});
