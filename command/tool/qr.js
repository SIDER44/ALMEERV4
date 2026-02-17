const QRCode = require('qrcode');

module.exports = {
  name: 'qr',
  aliases: ['qrcode'],
  description: 'Generate QR code from text',
  usage: '.qr (text or link)',
  cooldown: 5,
  
  async execute(sock, msg, args, { from }) {
    if (!args[0]) {
      return await sock.sendMessage(from, { 
        text: '❌ Please provide text to generate QR code!' 
      }, { quoted: msg });
    }

    const text = args.join(' ');

    try {
      const qrBuffer = await QRCode.toBuffer(text, {
        width: 500,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });

      await sock.sendMessage(from, { 
        image: qrBuffer,
        caption: `✅ *QR Code Generated*\n\nContent: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`
      }, { quoted: msg });

    } catch (error) {
      console.error('QR error:', error);
      await sock.sendMessage(from, { 
        text: '❌ Failed to generate QR code.' 
      }, { quoted: msg });
    }
  }
};
