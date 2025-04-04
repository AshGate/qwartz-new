import { getTicketDataByChannelId, deleteTicketData } from '../database/db.js';
import { generateTranscript } from '../utils/transcript.js';
import { uploadTranscriptToSupabase } from '../commands/uploadTranscriptToSupabase.js';
import { logTicketAction } from '../utils/logging.js';
import fs from 'fs';
import { join } from 'path';

export default async function interactionCreate(interaction) {
  if (!interaction.isButton()) return;

  const { customId, guild, member, channel } = interaction;

  if (customId === 'create_ticket') {
    console.log("📥 Interaction bouton : create_ticket");

    try {
      await interaction.reply({ content: '📨 Création du ticket...', ephemeral: true });

      const { createTicket } = await import('../handlers/ticket.js');
      await createTicket(interaction);

    } catch (err) {
      console.error('❌ Erreur création de ticket :', err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '❌ Une erreur est survenue.', ephemeral: true });
      } else {
        await interaction.followUp({ content: '❌ Une erreur est survenue.', ephemeral: true });
      }
    }
  }

  if (customId === 'close_ticket') {
    console.log("📥 Interaction bouton : close_ticket");

    try {
      const ticketData = getTicketDataByChannelId(channel.id);
      if (!ticketData) {
        return await interaction.reply({ content: '❌ Ce ticket n\'est pas enregistré.', ephemeral: true });
      }

      // 🔁 Réponse immédiate AVANT les opérations longues
      await interaction.reply({ content: '⏳ Fermeture du ticket en cours...', ephemeral: true });

      const ticketNumber = ticketData.ticket_number;
      const fileName = `ticket-${ticketNumber}.html`;
      const filePath = join(process.cwd(), 'transcripts', fileName);

      console.log("⏳ Génération transcript...");
      const transcript = await generateTranscript(channel);
      fs.writeFileSync(filePath, transcript, 'utf8');

      console.log("⏳ Upload vers Supabase...");
      const publicUrl = await uploadTranscriptToSupabase(filePath, fileName);
      console.log("✅ URL :", publicUrl);

      if (!publicUrl) {
        return await interaction.followUp({
          content: '❌ Une erreur est survenue lors de l’upload du transcript.',
          ephemeral: true,
        });
      }

      await interaction.followUp({
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
    } catch (err) {
      console.error("❌ Erreur interaction close_ticket :", err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '❌ Une erreur est survenue.', ephemeral: true });
      } else {
        await interaction.followUp({ content: '❌ Une erreur est survenue.', ephemeral: true });
      }
    }
  }
}