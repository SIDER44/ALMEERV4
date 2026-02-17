module.exports = {
  name: 'menu',
  aliases: ['help', 'commands', 'list'],
  description: 'Show all available commands',
  usage: '.menu [category]',
  cooldown: 5,
  
  async execute(sock, msg, args, { from, config, handler }) {
    const categories = {};
    const prefix = config.prefix;
    
    // Organize commands by category
    handler.commands.forEach(cmd => {
      if (!categories[cmd.category]) {
        categories[cmd.category] = [];
      }
      categories[cmd.category].push(cmd.name);
    });

    let menuText = `╔══════════════════╗\n`;
    menuText += `║   *${config.botName}*   ║\n`;
    menuText += `╚══════════════════╝\n\n`;
    menuText += `👋 Hello @${from.split('@')[0]}\n`;
    menuText += `📊 Total Commands: ${handler.commands.size}\n`;
    menuText += `📁 Categories: ${handler.categories.size}\n\n`;

    // If specific category requested
    if (args[0]) {
      const category = args[0].toLowerCase();
      const cmds = categories[category];
      
      if (cmds) {
        menuText += `📂 *${category.toUpperCase()}* (${cmds.length})\n`;
        menuText += `${'-'.repeat(30)}\n`;
        cmds.sort().forEach(cmd => {
          const command = handler.getCommand(cmd);
          menuText += `${prefix}${cmd} - ${command.description || 'No description'}\n`;
        });
      } else {
        menuText += `❌ Category '${category}' not found!\n`;
      }
    } else {
      // Show all categories
      Object.keys(categories).sort().forEach(category => {
        menuText += `📁 *${category.toUpperCase()}* (${categories[category].length})\n`;
      });
      
      menuText += `\n📝 Use *${prefix}menu [category]* to see commands\n`;
    }

    menuText += `\n⚡ *Bot Status:* ${config.mode}\n`;
    menuText += `🕒 *Uptime:* ${Math.floor(process.uptime() / 3600)}h\n`;
    menuText += `\n_Powered by ALMEERV4_`;

    await sock.sendMessage(from, { 
      text: menuText,
      mentions: [from]
    }, { quoted: msg });
  }
};
