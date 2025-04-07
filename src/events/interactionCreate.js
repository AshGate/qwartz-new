import { ChannelType, PermissionFlagsBits, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import { createTranscript } from 'discord-html-transcripts';
import db from '../database/db.js';
import fs from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TRANSCRIPTS_DIR = join(__dirname, '../../transcripts');

// Assure que le dossier transcripts existe
if (!fs.existsSync(TRANSCRIPTS_DIR)) {
  fs.mkdirSync(TRANSCRIPTS_DIR, { recursive: true });
}

async function saveTranscript(html, ticketNumber, guildId) {
  try {
    // Crée le dossier pour le serveur s'il n'existe pas
    const guildDir = join(TRANSCRIPTS_DIR, guildId);
    if (!fs.existsSync(guildDir)) {
      fs.mkdirSync(guildDir, { recursive: true });
    }

    const fileName = `ticket-${ticketNumber}-${Date.now()}.html`;
    const filePath = join(guildDir, fileName);

    // Vérifie les permissions d'écriture
    try {
      fs.accessSync(dirname(filePath), fs.constants.W_OK);
    } catch (error) {
      console.error(`Erreur de permissions: ${error}`);
      throw new Error('Erreur de permissions pour l\'écriture du fichier');
    }

    // Écrit le fichier
    fs.writeFileSync(filePath, html, 'utf8');

    return {
      success: true,
      fileName,
      url: `/transcripts/${guildId}/${fileName}`
    };
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du transcript:', error);
    throw error;
  }
}

// Map pour stocker les compteurs de tickets par serveur
const ticketCounters = new Map();

function getNextTicketNumber(guildId) {
  const currentCount = ticketCounters.get(guildId) || 0;
  const nextCount = currentCount + 1;
  ticketCounters.set(guildId, nextCount);
  return nextCount;
}

async function getOrCreateLogsChannels(guild) {
  let logsCategory = guild.channels.cache.find(c => c.name === "Logs" && c.type === ChannelType.GuildCategory);
  
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

  let logsChannel = guild.channels.cache.find(c => 
    c.name === "logs-tickets" && 
    c.type === ChannelType.GuildText &&
    c.parentId === logsCategory.id
  );

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

  return { logsChannel };
}

async function logTicketAction(guild, ticketNumber, userId, action, transcript = null) {
  const { logsChannel } = await getOrCreateLogsChannels(guild);
  
  const embed = new EmbedBuilder()
    .setColor(action === 'create' ? '#2b2d31' : '#ff0000')
    .setDescription(`**${action === 'create' ? 'Ticket Ouvert' : 'Ticket Fermé'}**\n\nUtilisateur: <@${userId}>\nTicket: ticket-${ticketNumber}`)
    .setTimestamp();

  if (transcript) {
    try {
      const result = await saveTranscript(transcript, ticketNumber, guild.id);
      
      if (result.success) {
        embed.addFields({
          name: 'Transcript',
          value: `[Cliquez ici pour voir le transcript](${result.url})`
        });
      } else {
        embed.addFields({
          name: 'Erreur',
          value: `Impossible de sauvegarder le transcript: ${result.error}`
        });
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du transcript:', error);
      embed.addFields({
        name: 'Erreur',
        value: 'Une erreur est survenue lors de la sauvegarde du transcript'
      });
    }
  }

  await logsChannel.send({ embeds: [embed] });
}

export async function handleInteraction(interaction) {
  if (interaction.isButton() && interaction.customId === 'create_ticket') {
    const modal = new ModalBuilder()
      .setCustomId('ticket_modal')
      .setTitle('Création de ticket');

    const nomInput = new TextInputBuilder()
      .setCustomId('nom')
      .setLabel('Nom')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const prenomInput = new TextInputBuilder()
      .setCustomId('prenom')
      .setLabel('Prénom')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const numeroInput = new TextInputBuilder()
      .setCustomId('numero')
      .setLabel('Numéro')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const entrepriseInput = new TextInputBuilder()
      .setCustomId('entreprise')
      .setLabel('Entreprise / Grade')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const demandeInput = new TextInputBuilder()
      .setCustomId('demande')
      .setLabel('Demande')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const firstRow = new ActionRowBuilder().addComponents(nomInput);
    const secondRow = new ActionRowBuilder().addComponents(prenomInput);
    const thirdRow = new ActionRowBuilder().addComponents(numeroInput);
    const fourthRow = new ActionRowBuilder().addComponents(entrepriseInput);
    const fifthRow = new ActionRowBuilder().addComponents(demandeInput);

    modal.addComponents(firstRow, secondRow, thirdRow, fourthRow, fifthRow);
    await interaction.showModal(modal);
  }

  if (interaction.isModalSubmit() && interaction.customId === 'ticket_modal') {
    const nom = interaction.fields.getTextInputValue('nom');
    const prenom = interaction.fields.getTextInputValue('prenom');
    const numero = interaction.fields.getTextInputValue('numero');
    const entreprise = interaction.fields.getTextInputValue('entreprise');
    const demande = interaction.fields.getTextInputValue('demande');

    const guild = interaction.guild;
    const member = interaction.member;
    const ticketNumber = getNextTicketNumber(guild.id);

    let category = guild.channels.cache.find(c => c.name === "Tickets" && c.type === ChannelType.GuildCategory);
    if (!category) {
      category = await guild.channels.create({
        name: 'Tickets',
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          }
        ]
      });
    }

    const channel = await guild.channels.create({
      name: `ticket-${ticketNumber}`,
      type: ChannelType.GuildText,
      parent: category,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: member.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
        }
      ],
    });

    const ticketEmbed = new EmbedBuilder()
      .setTitle(`📋 Ticket #${ticketNumber}`)
      .addFields(
        { name: '👤 Identité', value: `${nom} ${prenom}`, inline: true },
        { name: '📱 Numéro', value: numero, inline: true },
        { name: '🏢 Entreprise/Grade', value: entreprise, inline: true },
        { name: '📝 Demande', value: demande }
      )
      .setColor('#2b2d31')
      .setTimestamp();

    const closeButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('close_ticket')
          .setLabel('Fermer le ticket')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🔒')
      );

    await channel.send({ embeds: [ticketEmbed], components: [closeButton] });
    await interaction.reply({
      content: `Votre ticket a été créé : ${channel}`,
      flags: [MessageFlags.Ephemeral]
    });

    await logTicketAction(guild, ticketNumber, member.id, 'create');
  }

  if (interaction.isButton() && interaction.customId === 'close_ticket') {
    const ticketNumber = parseInt(interaction.channel.name.split('-')[1]);
    
    try {
      const transcript = await createTranscript(interaction.channel, {
        limit: -1,
        returnType: 'string',
        fileName: `ticket-${ticketNumber}.html`,
        saveImages: true,
        poweredBy: false
      });

      const result = await saveTranscript(transcript, ticketNumber, interaction.guild.id);
      
      if (result.success) {
        const embed = new EmbedBuilder()
          .setTitle('🔒 Ticket fermé')
          .setDescription(`Le ticket a été fermé et archivé.\nTranscript: [Voir le transcript](${result.url})`)
          .setColor('#ff0000')
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        
        setTimeout(() => interaction.channel.delete(), 5000);
      } else {
        throw new Error('Échec de la sauvegarde du transcript');
      }
    } catch (error) {
      console.error('Erreur lors de la fermeture du ticket:', error);
      await interaction.reply({
        content: 'Une erreur est survenue lors de la fermeture du ticket.',
        ephemeral: true
      });
    }
  }
}