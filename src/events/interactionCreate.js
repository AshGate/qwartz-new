import { getTicketDataByChannelId, deleteTicketData } from '../database/db.js';
import { generateTranscript } from '../utils/transcript.js';
import { uploadTranscriptToSupabase } from '../commands/uploadTranscriptToSupabase.js';
import { logTicketAction } from '../utils/logging.js';
import fs from 'fs';
import { join } from 'path';

export default async function interactionCreate(interaction) {
  if (!interaction.isButton()) return;

  const { customId, guild, member, channel } = interaction;

  if (customId === 'close_ticket') {
    const ticketData = getTicketDataByChannelId(channel.id);
    if (!ticketData) {
      return await interaction.reply({ content: '❌ Ce ticket n\'est pas enregistré.', ephemeral: true });
    }

    const ticketNumber = ticketData.ticket_number;
    const fileName = `ticket-${ticketNumber}.html`;
    const filePath = join(process.cwd(), 'transcripts', fileName); // Corrigé pour éviter __dirname
    const transcript = await generateTranscript(channel);
    fs.writeFileSync(filePath, transcript, 'utf8');

    const publicUrl = await uploadTranscriptToSupabase(filePath, fileName);

    if (!publicUrl) {
      return await interaction.reply({
        content: '❌ Une erreur est survenue lors de l’upload du transcript.',
        ephemeral: true,
      });
    }

    await interaction.reply({
      embeds: [
        {
          color: 0xed4245,
          title: 'Ticket Fermé',
          description: `Utilisateur: <@${member.id}>\nTicket: ${channel.name}\n\n**Transcript**\n[📄 Lien direct](${publicUrl})`,
          timestamp: new Date().toISOString(),
        },
      ],
    });

    await logTicketAction(guild, {
      ticketId: channel.id,
      ticketNumber,
      userId: member.id,
      action: 'closed',
      details: `Fermé par <@${member.id}>`
    });

    deleteTicketData(channel.id);

    setTimeout(async () => {
      await channel.delete();
    }, 5000);
  }
}
