import { config } from '../config.js';
import { handleTicketCommand } from '../commands/ticket.js';
import { handleEmbedCommand } from '../commands/embed.js';
import { handleAvatarCommand } from '../commands/avatar.js';
import { handleSendCommand } from '../commands/send.js';
import { handleHelpCommand } from '../commands/help.js';
import { handleDirectoryCommand, handleSearchDirectoryCommand } from '../commands/directory.js';
import { 
  handleAddWhitelistCommand, 
  handleRemoveWhitelistCommand, 
  handleAddWhitelistDayCommand,
  handleAddWhitelistTimeCommand,
  isWhitelisted 
} from '../commands/whitelist.js';
import { handleWhitelistListCommand } from '../commands/whitelist-list.js';
import { handleMessageLogOnCommand, handleMessageLogOffCommand } from '../commands/messagelog.js';
import { handleThemeCommand } from '../commands/theme.js';
import { handleRecruitmentCommand } from '../commands/recruitment.js';
import { handleInvoiceCreate, handleInvoiceCreation, handleInvoiceExport } from '../commands/invoice.js';
import { handleClearCommand } from '../commands/clear.js';
import { handleRenewCommand } from '../commands/renew.js';
import { handleSayCommand } from '../commands/say.js';

export const commands = new Map([
  ['ticket', handleTicketCommand],
  ['embed', handleEmbedCommand],
  ['pic', handleAvatarCommand],
  ['send', handleSendCommand],
  ['help', handleHelpCommand],
  ['ajoutannuaire', handleDirectoryCommand],
  ['recherche', handleSearchDirectoryCommand],
  ['addwl', handleAddWhitelistCommand],
  ['delwl', handleRemoveWhitelistCommand],
  ['addwlday', handleAddWhitelistDayCommand],
  ['addwltime', handleAddWhitelistTimeCommand],
  ['wliste', handleWhitelistListCommand],
  ['theme', handleThemeCommand],
  ['recrutement', handleRecruitmentCommand],
  ['clear', handleClearCommand],
  ['renew', handleRenewCommand],
  ['say', handleSayCommand],
  ['messagelog', (message) => {
    const args = message.content.split(' ');
    if (args[1] === 'on') {
      return handleMessageLogOnCommand(message);
    } else if (args[1] === 'off') {
      return handleMessageLogOffCommand(message);
    }
    return message.reply('Format incorrect. Utilisez : !messagelog on #salon ou !messagelog off');
  }],
  ['facture', async (message) => {
    const args = message.content.split(' ');
    const subCommand = args[1]?.toLowerCase();
    const param = args[2];

    if (!subCommand) {
      return message.reply('Commande invalide. Utilisez : !facture create|export <id>');
    }

    if (subCommand === 'create') {
      return handleInvoiceCreate(message);
    } else if (subCommand === 'export' && param) {
      return handleInvoiceExport(message, param);
    } else {
      return message.reply('Commande invalide. Utilisez : !facture create|export <id>');
    }
  }]
]);

export async function handleCommand(message) {
  const commandName = message.content.slice(config.prefix.length).split(' ')[0];
  const commandHandler = commands.get(commandName);

  if (commandHandler) {
    if (!['addwl', 'delwl', 'addwlday', 'addwltime'].includes(commandName)) {
      if (!isWhitelisted(message.guild.id, message.author.id)) {
        return message.reply('Vous n\'êtes pas whitelisté sur Bravix.');
      }
    }
    
    await commandHandler(message);
  }
}