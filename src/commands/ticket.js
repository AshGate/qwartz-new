import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ChannelType, PermissionFlagsBits } from 'discord.js';
import db from '../database/db.js';

async function getOrCreateLogsChannel(guild) {
  // Cherche d'abord la catégorie Logs
  let logsCategory = guild.channels.cache.find(c => c.name === "Logs" && c.type === ChannelType.GuildCategory);
  
  // Crée la catégorie si elle n'existe pas
  if (!logsCategory) {
    logsCategory = await guild.channels.create({
      name: 'Logs',
      type: ChannelType.GuildCategory,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        }
      ]
    });
  }

  // Cherche le salon logs-tickets dans la catégorie
  let logsChannel = guild.channels.cache.find(c => 
    c.name === "logs-tickets" && 
    c.type === ChannelType.GuildText &&
    c.parentId === logsCategory.id
  );

  // Crée le salon s'il n'existe pas
  if (!logsChannel) {
    logsChannel = await guild.channels.create({
      name: 'logs-tickets',
      type: ChannelType.GuildText,
      parent: logsCategory,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        }
      ]
    });
  }

  return logsChannel;
}

export async function handleTicketCommand(message) {
  const channel = message.mentions.channels.first() || message.channel;
    
  const embed = new EmbedBuilder()
    .setTitle('Contactez notre entreprise')
    .setDescription('Afin de prendre contact avec notre secrétariat, utilisez l\'onglet ci-dessous 📩')
    .setColor('#0099ff');

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('create_ticket')
        .setLabel('Créer un ticket')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📩')
    );

  const ticketMessage = await channel.send({
    embeds: [embed],
    components: [row]
  });

  // Crée ou récupère le salon de logs
  const logsChannel = await getOrCreateLogsChannel(message.guild);

  // Log de création du message de ticket
  const logEmbed = new EmbedBuilder()
    .setTitle('📋 Configuration système de tickets')
    .setDescription(`Un nouveau point d'entrée pour les tickets a été créé`)
    .addFields(
      { name: 'Créé par', value: `<@${message.author.id}>`, inline: true },
      { name: 'Salon', value: `<#${channel.id}>`, inline: true },
      { name: 'Message ID', value: ticketMessage.id, inline: true }
    )
    .setColor('#2b2d31')
    .setTimestamp();

  await logsChannel.send({ embeds: [logEmbed] });

  // Log dans la base de données
  const stmt = db.prepare(`
    INSERT INTO ticket_logs (guild_id, ticket_id, ticket_number, user_id, action, details)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    message.guild.id,
    channel.id,
    0, // Pas de numéro de ticket car c'est le message initial
    message.author.id,
    'setup',
    `Canal: ${channel.name} (${channel.id})`
  );
}