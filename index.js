process.on('uncaughtException', err => console.error('[ANTI-CRASH]', err.message));
process.on('unhandledRejection', reason => console.error('[ANTI-CRASH]', reason?.message || reason));

const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  makeInMemoryStore,
} = require('@whiskeysockets/baileys');

const pino = require('pino');
const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const readline = require('readline');
const http = require('http');

const config = require('./config');
const db = require('./lib/database');
const { handler, groupParticipantsHandler } = require('./handler');
const { registerEvents } = require('./plugins/events');

const logger = pino({ level: 'silent' });
const store = makeInMemoryStore({ logger });

fs.ensureFileSync('./database/store.json');
try { store.readFromFile('./database/store.json'); } catch {}
setInterval(() => store.writeToFile('./database/store.json'), 10000);

http.createServer((_, res) => { res.writeHead(200); res.end('ALMEERv4 Online 🤖'); })
  .listen(config.port, () => console.log(chalk.green(`[SERVER] Port ${config.port}`)));

const askQuestion = q => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(r => rl.question(q, a => { rl.close(); r(a.trim()); }));
};

let retryCount = 0;

const startBot = async () => {
  console.log(chalk.cyan('\n╭━━━━━━━━━━━━━━━━━━━╮'));
  console.log(chalk.cyan('┃   🤖 ALMEERv4     ┃'));
  console.log(chalk.cyan('┃   Version 4.0.0   ┃'));
  console.log(chalk.cyan('╰━━━━━━━━━━━━━━━━━━━╯\n'));

  fs.ensureDirSync('./sessions');
  fs.ensureDirSync('./database');

  const { state, saveCreds } = await useMultiFileAuthState('./sessions');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, logger) },
    browser: ['ALMEERv4', 'Chrome', '4.0.0'],
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
  });

  store.bind(sock.ev);
  registerEvents(sock, db);

  if (!sock.authState.creds.registered) {
    let phone = config.ownerNumber;
    if (!phone || phone === '1234567890') {
      phone = await askQuestion(chalk.cyan('[INPUT] Enter number (country code + number, no +): '));
    }
    phone = phone.replace(/[^0-9]/g, '');
    await new Promise(r => setTimeout(r, 3000));
    try {
      const code = await sock.requestPairingCode(phone);
      console.log(chalk.bgGreen.black(`\n  ✅ PAIRING CODE: ${code}  \n`));
      console.log(chalk.yellow('  WhatsApp → Linked Devices → Link with phone number\n'));
    } catch (e) { console.error('[PAIRING]', e.message); }
  }

  sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
    if (connection === 'open') {
      retryCount = 0;
      console.log(chalk.green('[✅] Bot connected!'));
      try {
        await sock.sendMessage(`${config.ownerNumber}@s.whatsapp.net`, {
          text: `╭━━〔 ✅ *ALMEERv4 Online* 〕━━⬣\n┃ 🤖 Bot connected!\n┃ 📅 ${new Date().toLocaleString()}\n╰━━━━━━━━━━━━━━━⬣`
        });
      } catch {}
    }
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = code !== DisconnectReason.loggedOut;
      console.log(chalk.red(`[DISCONNECT] Code: ${code}`));
      if (shouldReconnect && config.autoReconnect && retryCount < 10) {
        retryCount++;
        const delay = Math.min(retryCount * 5000, 60000);
        console.log(chalk.yellow(`[RECONNECT] Attempt ${retryCount} in ${delay / 1000}s`));
        setTimeout(startBot, delay);
      } else process.exit(0);
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) await handler(sock, msg);
  });

  sock.ev.on('group-participants.update', async update => groupParticipantsHandler(sock, update));

  return sock;
};

startBot().catch(e => { console.error('[FATAL]', e.message); process.exit(1); });
