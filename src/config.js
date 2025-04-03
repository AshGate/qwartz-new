import dotenv from 'dotenv';
dotenv.config();

export const config = {
  TOKEN: process.env.DISCORD_TOKEN,
  prefix: process.env.PREFIX || '!',
};
