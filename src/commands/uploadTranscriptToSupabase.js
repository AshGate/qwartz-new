import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Initialise Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

/**
 * Upload un transcript HTML sur Supabase Storage
 * @param {string} filePath - Chemin complet du fichier local
 * @param {string} fileName - Nom du fichier sur Supabase
 * @returns {string|null} URL publique du fichier
 */
export async function uploadTranscriptToSupabase(filePath, fileName) {
  try {
    const fileBuffer = fs.readFileSync(filePath);

    const { error } = await supabase
      .storage
      .from('transcripts') // nom du bucket Supabase
      .upload(fileName, fileBuffer, {
        contentType: 'text/html',
        upsert: true,
      });

    if (error) throw error;

    const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/transcripts/${fileName}`;
    return publicUrl;
  } catch (err) {
    console.error('❌ Erreur Supabase transcript :', err.message);
    return null;
  }
}
