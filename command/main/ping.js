const os = require('os');

module.exports = {
  name: 'ping',
  aliases: ['pong', 'speed'],
  description: 'Check bot response time',
  usage: '.ping',
  cooldown: 3,
  
  async execute(sock, msg, args, { from, utils }) {
    const start = Date.now();
    
    await sock.sendMessage(from, { text: '📡 *Pinging...*' }, { quoted: msg });
    
    const end = Date.now();
    const responseTime = end - start;
    
    const memoryUsage = process.memoryUsage();
    const uptime = os.uptime();
    
    const pingText = `📊 *Bot Status*\n\n` +
      `📡 Response: *${responseTime}ms*\n` +
      `💾 RAM: *${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB*\n` +
      `🕒 Uptime: *${utils.formatTime(uptime)}*\n` +
      `⚡ Platform: *${os.platform()}*`;

    await sock.sendMessage(from, { text: pingText }, { quoted: msg });
  }
};
