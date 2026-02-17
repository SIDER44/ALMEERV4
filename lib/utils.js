const axios = require('axios');
const fs = require('fs-extra');
const config = require('../config');

module.exports = {
  // Check if user is admin in group
  async isAdmin(sock, groupId, userId) {
    try {
      const groupMetadata = await sock.groupMetadata(groupId);
      const participant = groupMetadata.participants.find(p => p.id === userId);
      return participant?.admin === 'admin' || participant?.admin === 'superadmin';
    } catch {
      return false;
    }
  },

  // Download media
  async downloadMedia(msg, type = 'image') {
    try {
      const message = msg.message;
      let media;
      
      if (type === 'image' && message.imageMessage) {
        media = message.imageMessage;
      } else if (type === 'video' && message.videoMessage) {
        media = message.videoMessage;
      } else if (type === 'sticker' && message.stickerMessage) {
        media = message.stickerMessage;
      } else if (type === 'audio' && message.audioMessage) {
        media = message.audioMessage;
      } else {
        throw new Error('No media found');
      }

      const buffer = await sock.downloadMediaMessage(msg);
      const fileName = `./media/temp/${Date.now()}.${type}`;
      
      await fs.writeFile(fileName, buffer);
      return fileName;
    } catch (error) {
      throw error;
    }
  },

  // Format size
  formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Format time
  formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
  },

  // Get random number
  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  // Get random item from array
  randomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
  },

  // Sleep
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // Shorten URL
  async shortenUrl(url) {
    try {
      const response = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
      return response.data;
    } catch {
      return url;
    }
  },

  // Fetch with timeout
  async fetchWithTimeout(url, options = {}, timeout = 10000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await axios({
        url,
        signal: controller.signal,
        ...options
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  },

  // Check if URL is valid
  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  },

  // Parse mentioned users
  getMentions(message) {
    const mentions = [];
    const regex = /@(\d+)/g;
    let match;

    while ((match = regex.exec(message)) !== null) {
      mentions.push(match[1] + '@s.whatsapp.net');
    }

    return mentions;
  },

  // Format number with commas
  formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },

  // Get time greeting
  getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  },

  // Escape markdown
  escapeMarkdown(text) {
    return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
  }
};
