import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

console.log("🧪 SUPABASE_URL =", process.env.SUPABASE_URL);
console.log("🧪 SUPABASE_SERVICE_ROLE =", process.env.SUPABASE_SERVICE_ROLE);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

/**
 * Upload un transcript HTML sur Supabase Storage
 * @param {string} filePath - Chemin complet du fichier local
 * @param {string} fileName - Nom du fichier sur Supabase (ex: ticket-123.html)
 * @returns {string|null} URL publique du fichier
 */
export async function uploadTranscriptToSupabase(filePath, fileName) {
  try {
    const fileBuffer = fs.readFileSync(filePath);

    const { error } = await supabase.storage
      .from('transcripts')
      .upload(fileName, fileBuffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'text/html',
      });

    if (error) throw error;

    const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/transcripts/${fileName.replace(/^\/+/, '')}`;
    return publicUrl;
  } catch (err) {
    console.error('❌ Erreur Supabase transcript :', err.message);
    return null;
  }
}
