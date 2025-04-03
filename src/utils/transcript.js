import { ChannelType } from 'discord.js';

/**
 * Génère un transcript HTML depuis un salon
 * @param {TextChannel} channel - Le salon à transcrire
 * @returns {string} - Contenu HTML
 */
export async function generateTranscript(channel) {
  if (!channel || channel.type !== ChannelType.GuildText) {
    return '<p>Salon invalide ou non textuel</p>';
  }

  const messages = await channel.messages.fetch({ limit: 100 });
  const sorted = [...messages.values()].reverse();

  const content = sorted.map(msg => {
    const time = msg.createdAt.toLocaleString();
    return `<p><strong>${msg.author.username}</strong> [${time}]: ${msg.content}</p>`;
  }).join('\n');

  return `<!DOCTYPE html>
  <html>
  <head><meta charset="UTF-8"><title>Transcript</title></head>
  <body>${content}</body>
  </html>`;
}
