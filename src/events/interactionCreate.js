import { getTicketDataByChannelId, deleteTicketData } from '../database/ticket.js';
import { generateTranscript } from '../utils/transcript.js';
import { uploadTranscriptToSupabase } from './uploadTranscriptToSupabase.js';
import { logTicketAction } from '../utils/logging.js';
import fs from 'fs';
import { join } from 'path';

export default async function interactionCreate(interaction) {
  if (!interaction.isButton()) return;

  const { customId, guild, member, channel } = interaction;

  if (customId === 'close_ticket') {
    const ticketData = getTicketDataByChannelId(channel.id);
    if (!ticketData) return await interaction.reply({ content: '❌ Ce ticket n\'est pas enregistré.', ephemeral: true });

    await interaction.reply({ content: 'Fermeture du ticket...', ephemeral: true });

    const ticketNumber = ticketData.ticket_number;
    const fileName = `ticket-${ticketNumber}.html`;
    const filePath = join(__dirname, '../../transcripts', fileName);

    // Générer le transcript HTML
    const transcript = await generateTranscript(channel);
    fs.writeFileSync(filePath, transcript, 'utf8');

    // Logger + upload
    await logTicketAction(guild, {
      ticketId: channel.id,
      ticketNumber,
      userId: member.id,
      action: 'closed',
      details: `Fermé par <@${member.id}>`
    });

    // Supprimer après 5 sec
    setTimeout(async () => {
      await interaction.channel.delete();
    }, 5000);

    // Supprimer de la base
    deleteTicketData(channel.id);
  }
} 
