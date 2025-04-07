import 'dotenv/config';

export const config = {
  token: process.env.DISCORD_TOKEN || '',
  prefix: '!'
};

if (!config.token) {
  throw new Error('Le token Discord est manquant dans le fichier .env');
}