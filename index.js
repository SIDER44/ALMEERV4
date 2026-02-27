// ── Anti-crash ────────────────────────────────────
process.on('uncaughtException', e => console.error('[ANTI-CRASH]', e.message));
process.on('unhandledRejection', e => console.error('[ANTI-CRASH]', e?.message || e));

import {
  default as makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys';

import pino from 'pino';
import chalk from 'chalk';
import fs from 'fs-extra';
import qrcode from 'qrcode';
import { createServer } from 'http';

import config from './config.js';
import db from './lib/database.js';
import { loadPlugins, handler, groupParticipantsHandler } from './handler.js';
import { registerEvents } from './plugins/events.js';

// ── Setup folders ─────────────────────────────────
fs.ensureDirSync('./sessions');
fs.ensureDirSync('./database');

const logger = pino({ level: 'silent' });

// ── QR state ──────────────────────────────────────
let currentQR = null;
let botStatus = 'waiting'; // waiting | connected | disconnected

// ── Web server (serves QR on Render URL) ──────────
const server = createServer(async (req, res) => {

  if (req.url === '/qr' && currentQR) {
    try {
      const qrImage = await qrcode.toDataURL(currentQR, { width: 300, margin: 2 });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ qr: qrImage, status: botStatus }));
    } catch {
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Failed to generate QR' }));
    }
    return;
  }

  if (req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: botStatus }));
    return;
  }

  // ── Main page with QR display ──────────────────
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ALMEERv4 — WhatsApp Bot</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      min-height: 100vh;
      background: #0a0a0a;
      color: #fff;
      font-family: 'Segoe UI', sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .card {
      background: #111;
      border: 1px solid #222;
      border-radius: 20px;
      padding: 40px;
      max-width: 420px;
      width: 100%;
      text-align: center;
      box-shadow: 0 0 40px rgba(37,211,102,0.1);
    }

    .logo {
      font-size: 2.5rem;
      font-weight: 900;
      background: linear-gradient(135deg, #25d366, #128c7e);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 6px;
      letter-spacing: 2px;
    }

    .version {
      font-size: 0.8rem;
      color: #444;
      margin-bottom: 30px;
      letter-spacing: 3px;
      text-transform: uppercase;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 20px;
      border-radius: 50px;
      font-size: 0.85rem;
      font-weight: 600;
      margin-bottom: 25px;
      letter-spacing: 1px;
    }

    .status-waiting {
      background: rgba(255,193,7,0.15);
      border: 1px solid rgba(255,193,7,0.3);
      color: #ffc107;
    }

    .status-connected {
      background: rgba(37,211,102,0.15);
      border: 1px solid rgba(37,211,102,0.3);
      color: #25d366;
    }

    .status-disconnected {
      background: rgba(255,82,82,0.15);
      border: 1px solid rgba(255,82,82,0.3);
      color: #ff5252;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: currentColor;
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }

    .qr-box {
      background: #fff;
      border-radius: 16px;
      padding: 16px;
      display: inline-block;
      margin-bottom: 25px;
      box-shadow: 0 0 30px rgba(37,211,102,0.2);
    }

    .qr-box img {
      display: block;
      width: 240px;
      height: 240px;
    }

    .qr-placeholder {
      width: 240px;
      height: 240px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      color: #555;
      font-size: 0.85rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #222;
      border-top-color: #25d366;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .connected-icon {
      font-size: 5rem;
      margin-bottom: 10px;
    }

    .connected-text {
      color: #25d366;
      font-size: 1.2rem;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .connected-sub {
      color: #555;
      font-size: 0.85rem;
    }

    .instructions {
      background: #0d0d0d;
      border: 1px solid #1a1a1a;
      border-radius: 12px;
      padding: 16px;
      text-align: left;
      margin-bottom: 20px;
    }

    .instructions p {
      font-size: 0.82rem;
      color: #666;
      line-height: 1.8;
    }

    .instructions span {
      color: #25d366;
      font-weight: 600;
    }

    .timer {
      font-size: 0.78rem;
      color: #333;
      margin-top: 8px;
    }

    .timer b {
      color: #ffc107;
    }

    .refresh-btn {
      background: linear-gradient(135deg, #25d366, #128c7e);
      color: white;
      border: none;
      padding: 12px 30px;
      border-radius: 50px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      letter-spacing: 1px;
      transition: opacity 0.2s;
      width: 100%;
    }

    .refresh-btn:hover { opacity: 0.85; }

    .footer {
      margin-top: 30px;
      font-size: 0.75rem;
      color: #333;
      letter-spacing: 2px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">ALMEERv4</div>
    <div class="version">WhatsApp Bot v4.0.0</div>

    <div class="status-badge status-waiting" id="statusBadge">
      <div class="dot"></div>
      <span id="statusText">Waiting for scan...</span>
    </div>

    <div id="qrSection">
      <div class="qr-box" id="qrBox">
        <div class="qr-placeholder" id="qrPlaceholder">
          <div class="spinner"></div>
          <span>Generating QR Code...</span>
        </div>
        <img id="qrImage" src="" alt="QR Code" style="display:none;" />
      </div>
    </div>

    <div id="connectedSection" style="display:none;">
      <div class="connected-icon">✅</div>
      <div class="connected-text">Bot Connected!</div>
      <div class="connected-sub">ALMEERv4 is now online and ready.</div>
    </div>

    <div class="instructions" id="instructions">
      <p>
        <span>1.</span> Open WhatsApp on your phone<br>
        <span>2.</span> Tap ⋮ → <b style="color:#fff">Linked Devices</b><br>
        <span>3.</span> Tap <b style="color:#fff">Link a Device</b><br>
        <span>4.</span> Point camera at QR code above<br>
        <span>5.</span> Wait for connection ✅
      </p>
    </div>

    <div class="timer" id="timer">
      ⏱️ QR refreshes automatically every <b>30 seconds</b>
    </div>

    <br>

    <button class="refresh-btn" onclick="loadQR()">🔄 Refresh QR</button>
  </div>

  <div class="footer">POWERED BY BAILEYS + NODE.JS</div>

  <script>
    let countdown = 30;
    let countdownTimer;

    async function loadQR() {
      document.getElementById('qrPlaceholder').style.display = 'flex';
      document.getElementById('qrImage').style.display = 'none';

      try {
        const res = await fetch('/qr');
        const data = await res.json();

        if (data.status === 'connected') {
          showConnected();
          return;
        }

        if (data.qr) {
          document.getElementById('qrPlaceholder').style.display = 'none';
          document.getElementById('qrImage').src = data.qr;
          document.getElementById('qrImage').style.display = 'block';

          // Update status badge
          const badge = document.getElementById('statusBadge');
          badge.className = 'status-badge status-waiting';
          document.getElementById('statusText').textContent = 'Waiting for scan...';

          resetCountdown();
        }
      } catch {
        document.getElementById('qrPlaceholder').innerHTML =
          '<span style="color:#ff5252">⚠️ Bot starting up...<br>Please wait a moment</span>';
        setTimeout(loadQR, 5000);
      }
    }

    async function checkStatus() {
      try {
        const res = await fetch('/status');
        const data = await res.json();
        if (data.status === 'connected') {
          showConnected();
          return true;
        }
        if (data.status === 'disconnected') {
          const badge = document.getElementById('statusBadge');
          badge.className = 'status-badge status-disconnected';
          document.getElementById('statusText').textContent = 'Disconnected — Reconnecting...';
        }
      } catch {}
      return false;
    }

    function showConnected() {
      document.getElementById('qrSection').style.display = 'none';
      document.getElementById('connectedSection').style.display = 'block';
      document.getElementById('instructions').style.display = 'none';
      document.getElementById('timer').style.display = 'none';

      const badge = document.getElementById('statusBadge');
      badge.className = 'status-badge status-connected';
      document.getElementById('statusText').textContent = 'Connected ✅';

      clearInterval(countdownTimer);
    }

    function resetCountdown() {
      clearInterval(countdownTimer);
      countdown = 30;
      countdownTimer = setInterval(() => {
        countdown--;
        document.getElementById('timer').innerHTML =
          '⏱️ QR refreshes in <b>' + countdown + 's</b>';
        if (countdown <= 0) {
          loadQR();
        }
      }, 1000);
    }

    // Poll status every 3 seconds
    setInterval(async () => {
      const connected = await checkStatus();
      if (!connected && document.getElementById('qrImage').style.display === 'none') {
        loadQR();
      }
    }, 3000);

    // Initial load
    loadQR();
  </script>
</body>
</html>`);
});

server.listen(config.port, () => {
  console.log(chalk.green(`[SERVER] ✅ Running at port ${config.port}`));
  console.log(chalk.cyan(`[QR PAGE] Open your Render URL to scan QR code`));
});

let retryCount = 0;

// ── Main bot function ─────────────────────────────
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
    syncFullHistory: false,
  });

  registerEvents(sock, db);

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {

    // ── Save QR for web display ────────────────
    if (qr) {
      currentQR = qr;
      botStatus = 'waiting';
      console.log(chalk.yellow('[QR] New QR generated — open your Render URL to scan'));
    }

    if (connection === 'open') {
      retryCount = 0;
      currentQR = null;
      botStatus = 'connected';
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
      botStatus = 'disconnected';
      console.log(chalk.red(`[DISCONNECT] Code: ${code}`));

      if (!loggedOut && config.autoReconnect && retryCount < 10) {
        retryCount++;
        const delay = Math.min(retryCount * 5000, 60000);
        console.log(chalk.yellow(`[RECONNECT] Attempt ${retryCount}/10 in ${delay / 1000}s...`));
        setTimeout(startBot, delay);
      } else {
        console.log(chalk.red('[BOT] Stopped. Clear sessions to re-scan.'));
        process.exit(0);
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) await handler(sock, msg);
  });

  sock.ev.on('group-participants.update', async update => {
    await groupParticipantsHandler(sock, update);
  });
};

startBot().catch(e => {
  console.error(chalk.red('[FATAL]'), e.message);
  process.exit(1);
});
