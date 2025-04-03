import { handleCommand } from './commandHandler.js';
import { handleInteraction } from '../events/interactionCreate.js';
import { handleMessageDelete, handleMessageUpdate, handleMessage } from '../events/messageEvents.js';
import { config } from '../config.js';

export function setupEventHandlers(client) {
  client.once('ready', () => {
    console.log(`Bot connecté en tant que ${client.user.tag}`);
  });

  client.on('messageCreate', async (message) => {
    if (message.content.startsWith(config.prefix)) {
      await handleCommand(message);
    } else {
      await handleMessage(message);
    }
  });
  
  client.on('interactionCreate', handleInteraction);
  client.on('messageDelete', handleMessageDelete);
  client.on('messageUpdate', handleMessageUpdate);
}