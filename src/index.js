import { Client, GatewayIntentBits } from 'discord.js';
import { config } from './config/config.js';
import { loadData } from './utils/database.js';
import { handleCommand } from './handlers/commandHandler.js';
import { handleInteraction } from './handlers/interactionHandler.js';
import { handleMemberJoin, handleMemberLeave } from './events/memberEvents.js';
import { getCreditsFooter } from './info/credits.js';
import { askGPT } from './services/openai.js';
import { checkMessage } from './commands/badwords.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const data = loadData();

client.once('ready', () => {
  console.log(`Bot connecté en tant que ${client.user.tag}`);
  console.log('Le bot est prêt à recevoir des commandes!');
  console.log(getCreditsFooter());

  // Mettre à jour la description du bot
  client.user.setPresence({
    activities: [{ name: 'Serkan Dormir', type: 3 }],
    status: 'watch'
  });
});

client.on('guildMemberAdd', async (member) => {
  await handleMemberJoin(member, data);
});

client.on('guildMemberRemove', async (member) => {
  await handleMemberLeave(member, data);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // Vérifier les mots interdits
  if (checkMessage(message, data)) return;

  // Gérer les commandes !serko et !kgb
  if (message.content.startsWith('!serko') || message.content.startsWith('!kgb')) {
    const prefix = message.content.startsWith('!serko') ? '!serko' : '!kgb';
    const prompt = message.content.slice(prefix.length).trim();
    if (!prompt) {
      return message.reply(`Format: ${prefix} <votre question>`);
    }
    await message.channel.sendTyping();
    const response = await askGPT(prompt, data);
    await message.reply(response);
    return;
  }

  // Gérer les autres commandes
  if (message.content.startsWith('!')) {
    const args = message.content.slice(1).toLowerCase().split(' ');
    await handleCommand(message, args, data);
  }
});

client.on('interactionCreate', async (interaction) => {
  await handleInteraction(interaction, data);
});

process.on('unhandledRejection', error => {
  console.error('Erreur non gérée:', error);
});

if (!process.env.DISCORD_TOKEN) {
  console.error('Erreur: Le token Discord n\'est pas défini dans le fichier .env');
  process.exit(1);
}

client.login(config.token);