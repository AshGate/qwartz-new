import { ChannelType, PermissionFlagsBits, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { createTranscript } from 'discord-html-transcripts';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import db from '../database/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Map pour stocker les compteurs de tickets par serveur
const ticketCounters = new Map();

function getNextTicketNumber(guildId) {
  const currentCount = ticketCounters.get(guildId) || 0;
  const nextCount = currentCount + 1;
  ticketCounters.set(guildId, nextCount);
  return nextCount;
}

async function getOrCreateLogsChannels(guild) {
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

  // Cherche ou crée le salon logs-tickets
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
    // Sauvegarder le transcript dans le dossier
    const transcriptsDir = join(__dirname, '../../transcripts');
    if (!fs.existsSync(transcriptsDir)) {
      fs.mkdirSync(transcriptsDir, { recursive: true });
    }
    
    const fileName = `ticket-${ticketNumber}.html`;
    const filePath = join(transcriptsDir, fileName);
    fs.writeFileSync(filePath, transcript);

    // Ajouter le lien direct au transcript
    embed.addFields({
      name: 'Transcript',
      value: `[Lien direct](https://transcripts.qwartzcloud.fr/${fileName})`
    });

    await logsChannel.send({
      embeds: [embed],
      files: [{
        attachment: Buffer.from(transcript),
        name: fileName
      }]
    });
  } else {
    await logsChannel.send({ embeds: [embed] });
  }
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
      flags: [4096]
    });

    await logTicketAction(guild, ticketNumber, member.id, 'create');
  }

  if (interaction.isButton() && interaction.customId === 'close_ticket') {
    const ticketNumber = parseInt(interaction.channel.name.split('-')[1]);
    
    const embed = new EmbedBuilder()
      .setTitle('🔒 Fermeture du ticket')
      .setDescription('Le ticket va être fermé dans 5 secondes.')
      .setColor('#2b2d31')
      .setTimestamp();

    await interaction.reply({
      embeds: [embed]
    });

    try {
      const transcript = await createTranscript(interaction.channel, {
        limit: -1,
        returnType: 'string',
        fileName: `ticket-${ticketNumber}.html`,
        saveImages: true,
        poweredBy: false,
        footerText: "Développé avec ❤️ créé par H-Gate",
        headerText: `Transcript du ticket-${ticketNumber}`
      });

      await logTicketAction(interaction.guild, ticketNumber, interaction.user.id, 'close', transcript);

      setTimeout(async () => {
        await interaction.channel.delete();
      }, 5000);
    } catch (error) {
      console.error('Erreur lors de la création du transcript:', error);
      await interaction.followUp({
        content: 'Une erreur est survenue lors de la création du transcript.',
        flags: [4096]
      });
    }
  }
}