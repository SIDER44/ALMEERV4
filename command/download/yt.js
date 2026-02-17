const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');
const fs = require('fs-extra');

module.exports = {
  name: 'yt',
  aliases: ['youtube', 'ytmp3', 'ytmp4'],
  description: 'Download YouTube videos or audio',
  usage: '.yt (link) or .yt (search query)',
  cooldown: 15,
  
  async execute(sock, msg, args, { from, utils }) {
    if (!args[0]) {
      return await sock.sendMessage(from, { 
        text: '❌ Please provide a YouTube link or search query!' 
      }, { quoted: msg });
    }

    const query = args.join(' ');
    let videoUrl = query;

    try {
      await sock.sendMessage(from, { text: '🔍 *Searching...*' }, { quoted: msg });

      // Check if query is a URL
      if (!utils.isValidUrl(query)) {
        // Search YouTube
        const searchResults = await ytSearch(query);
        if (!searchResults.videos.length) {
          return await sock.sendMessage(from, { 
            text: '❌ No videos found!' 
          }, { quoted: msg });
        }
        videoUrl = searchResults.videos[0].url;
      }

      // Get video info
      const info = await ytdl.getInfo(videoUrl);
      const title = info.videoDetails.title;
      const duration = utils.formatTime(info.videoDetails.lengthSeconds);
      const views = utils.formatNumber(info.videoDetails.viewCount);
      
      // Create selection message
      const options = [
        {
          title: '🎵 Audio (MP3)',
          description: 'Download as audio',
          id: 'audio'
        },
        {
          title: '🎬 Video (MP4)',
          description: 'Download as video',
          id: 'video'
        }
      ];

      const sections = [{
        title: 'Select Download Type',
        rows: options.map(opt => ({
          title: opt.title,
          description: opt.description,
          id: `${from}:${opt.id}:${videoUrl}`
        }))
      }];

      await sock.sendMessage(from, {
        text: `📹 *${title}*\n\n⏱️ Duration: ${duration}\n👁️ Views: ${views}\n\nSelect download type:`,
        footer: 'Powered by ALMEERV4',
        title: 'YouTube Downloader',
        buttonText: 'Download',
        sections
      });

    } catch (error) {
      console.error('YouTube error:', error);
      await sock.sendMessage(from, { 
        text: '❌ Failed to process YouTube video. Please try again.' 
      }, { quoted: msg });
    }
  }
};
