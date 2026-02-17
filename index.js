/**
 * ALMEERV4 - Advanced WhatsApp Bot
 * Created by: ALMEER
 * Version: 4.0.0
 */

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, Browsers } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const express = require('express');
const pino = require('pino');
const fs = require('fs-extra');
const path = require('path');
const config = require('./config');
const handler = require('./lib/handler');
const database = require('./lib/database');
const logger = require('./lib/logger');

// Initialize Express server for uptime
const app = express();
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'active', 
    bot: config.botName,
    uptime: process.uptime(),
    commands: handler.getCommandsCount(),
    mode: config.mode
  });
});

app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port}`);
});

// Initialize database
database.init();

// Connect to WhatsApp
async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(`./${config.sessionName}`);
  const { version, isLatest } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: true,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
    },
    browser: Browsers.appropriate('Desktop'),
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
    syncFullHistory: false,
    patchMessageBeforeSending: (msg) => {
      // Auto typing effect
      if (config.autoTyping) {
        sock.sendPresenceUpdate('composing', msg.key.remoteJid);
      }
      return msg;
    }
  });

  // Store socket globally
  global.sock = sock;

  // Handle connection updates
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      logger.info('QR Code received, scan with WhatsApp');
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      
      if (shouldReconnect) {
        logger.info('Connection closed, reconnecting...');
        connectToWhatsApp();
      } else {
        logger.error('Connection closed. You are logged out.');
        process.exit(1);
      }
    } else if (connection === 'open') {
      logger.info('✅ Bot connected successfully!');
      logger.info(`Bot Name: ${config.botName}`);
      logger.info(`Owner: ${config.ownerNumber}`);
      logger.info(`Mode: ${config.mode}`);
      
      // Send online presence
      sock.sendPresenceUpdate('available');
      
      // Send startup notification to owner
      const ownerJid = config.ownerNumber + '@s.whatsapp.net';
      await sock.sendMessage(ownerJid, { 
        text: `✅ *${config.botName}* is now active!\n\n📊 Status: Online\n⚡ Mode: ${config.mode}\n📝 Commands: ${handler.getCommandsCount()}\n🕒 Time: ${new Date().toLocaleString()}` 
      });
    }
  });

  // Handle credentials update
  sock.ev.on('creds.update', saveCreds);

  // Handle messages
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type === 'notify') {
      for (const msg of messages) {
        if (!msg.message) continue;
        
        // Auto read messages
        if (config.autoRead) {
          await sock.readMessages([msg.key]);
        }

        // Handle message
        await handler.handleMessage(sock, msg);
      }
    }
  });

  // Handle group participants update
  sock.ev.on('group-participants.update', async (update) => {
    if (config.welcomeMsg) {
      await handler.handleGroupParticipants(sock, update);
    }
  });

  // Handle message delete
  sock.ev.on('messages.delete', async (deleteInfo) => {
    if (config.features.antiDelete) {
      await handler.handleDeleteMessage(sock, deleteInfo);
    }
  });

  return sock;
}

// Start bot with auto-reconnect
async function startBot() {
  try {
    await connectToWhatsApp();
  } catch (error) {
    logger.error('Failed to start bot:', error);
    setTimeout(startBot, 5000);
  }
}

// Handle process termination
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
});

// Start the bot
startBot();
