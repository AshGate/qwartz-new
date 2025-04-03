console.log("🧪 SUPABASE_URL =", process.env.SUPABASE_URL);
console.log("🧪 SUPABASE_ANON_KEY =", process.env.SUPABASE_ANON_KEY);
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

/**
 * Upload un transcript HTML sur Supabase Storage
 * @param {string} filePath - Chemin complet du fichier local
 * @param {string} fileName - Nom du fichier sur Supabase
 * @returns {string|null} URL publique du fichier
 */
export async function uploadTranscriptToSupabase(filePath, fileName) {
  try {
    const fileBuffer = fs.readFileSync(filePath);

// Ajoute ce champ quand tu uploades
const { data, error } = await supabase.storage
  .from('transcripts')
  .upload(`ticket-${ticketNumber}.html`, buffer, {
    cacheControl: '3600',
    upsert: true,
    contentType: 'text/html' // 👈 C’est ça la clé !
  });

    if (error) throw error;

    const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/transcripts/${fileName.replace(/^\/+/, '')}`;
    return publicUrl;
  } catch (err) {
    console.error('❌ Erreur Supabase transcript :', err.message);
    return null;
  }
}
