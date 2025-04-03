import { EmbedBuilder, ChannelType, PermissionFlagsBits } from 'discord.js';

export async function logTicketAction(guild, { ticketId, ticketNumber, userId, action, details }) {
  const logsCategory = guild.channels.cache.find(
    (c) => c.name === 'Logs' && c.type === ChannelType.GuildCategory
  );

  if (!logsCategory) return;

  const logsChannel = guild.channels.cache.find(
    (c) =>
      c.name === 'logs-tickets' &&
      c.type === ChannelType.GuildText &&
      c.parentId === logsCategory.id
  );

  if (!logsChannel) return;

  const embed = new EmbedBuilder()
    .setTitle('🎫 Journal des tickets')
    .setColor('#2b2d31')
    .addFields(
      { name: 'Action', value: action, inline: true },
      { name: 'Utilisateur', value: `<@${userId}>`, inline: true },
      { name: 'Ticket', value: `#ticket-${ticketNumber} (${ticketId})`, inline: true },
      { name: 'Détails', value: details }
    )
    .setTimestamp();

  await logsChannel.send({ embeds: [embed] });
}
