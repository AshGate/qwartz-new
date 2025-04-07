import { EmbedBuilder } from 'discord.js';
import db from '../database/db.js';

const ADMIN_ID = '619551502272561152';

function isAdmin(userId) {
  return userId === ADMIN_ID;
}

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export async function handleAddWhitelistCommand(message) {
  if (!isAdmin(message.author.id)) {
    return message.reply('Vous n\'avez pas la permission d\'utiliser cette commande.');
  }

  const args = message.content.split(' ');
  args.shift(); // Supprime la commande

  if (args.length < 1) {
    return message.reply('Format incorrect. Utilisez : !addwl @utilisateur ou ID');
  }

  let userId = args[0].replace(/[<@!>]/g, '');
  const guildId = message.guild.id;

  try {
    const stmt = db.prepare(`
      INSERT INTO whitelist (guild_id, user_id, added_by, expires_at)
      VALUES (?, ?, ?, NULL)
    `);

    try {
      stmt.run(guildId, userId, message.author.id);
    } catch (err) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return message.reply('Cet utilisateur est déjà dans la whitelist !');
      }
      throw err;
    }

    const embed = new EmbedBuilder()
      .setTitle('✅ Utilisateur ajouté à la whitelist')
      .setColor('#2b2d31')
      .addFields(
        { name: 'ID Utilisateur', value: userId },
        { name: 'Type', value: 'Permanent' }
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Erreur:', error);
    await message.reply('Une erreur est survenue lors de l\'ajout à la whitelist.');
  }
}

export async function handleAddWhitelistDayCommand(message) {
  if (!isAdmin(message.author.id)) {
    return message.reply('Vous n\'avez pas la permission d\'utiliser cette commande.');
  }

  const args = message.content.split(' ');
  args.shift(); // Supprime la commande

  if (args.length < 2) {
    return message.reply('Format incorrect. Utilisez : !addwlday @utilisateur ou ID nombre_de_jours');
  }

  let userId = args[0].replace(/[<@!>]/g, '');
  const days = parseInt(args[1]);
  const guildId = message.guild.id;

  if (isNaN(days) || days <= 0) {
    return message.reply('Le nombre de jours doit être un nombre positif.');
  }

  try {
    const expiresAt = addDays(new Date(), days);
    const stmt = db.prepare(`
      INSERT INTO whitelist (guild_id, user_id, added_by, expires_at)
      VALUES (?, ?, ?, ?)
    `);

    try {
      stmt.run(guildId, userId, message.author.id, expiresAt.toISOString());
    } catch (err) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return message.reply('Cet utilisateur est déjà dans la whitelist !');
      }
      throw err;
    }

    const embed = new EmbedBuilder()
      .setTitle('✅ Utilisateur ajouté à la whitelist')
      .setColor('#2b2d31')
      .addFields(
        { name: 'ID Utilisateur', value: userId },
        { name: 'Durée', value: `${days} jours` },
        { name: 'Expire le', value: expiresAt.toLocaleDateString() }
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Erreur:', error);
    await message.reply('Une erreur est survenue lors de l\'ajout à la whitelist.');
  }
}

export async function handleAddWhitelistTimeCommand(message) {
  if (!isAdmin(message.author.id)) {
    return message.reply('Vous n\'avez pas la permission d\'utiliser cette commande.');
  }

  const args = message.content.split(' ');
  args.shift(); // Supprime la commande

  if (args.length < 2) {
    return message.reply('Format incorrect. Utilisez : !addwltime @utilisateur ou ID nombre_d_heures');
  }

  let userId = args[0].replace(/[<@!>]/g, '');
  const hours = parseInt(args[1]);
  const guildId = message.guild.id;

  if (isNaN(hours) || hours <= 0) {
    return message.reply('Le nombre d\'heures doit être un nombre positif.');
  }

  try {
    const expiresAt = addHours(new Date(), hours);
    const stmt = db.prepare(`
      INSERT INTO whitelist (guild_id, user_id, added_by, expires_at)
      VALUES (?, ?, ?, ?)
    `);

    try {
      stmt.run(guildId, userId, message.author.id, expiresAt.toISOString());
    } catch (err) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return message.reply('Cet utilisateur est déjà dans la whitelist !');
      }
      throw err;
    }

    const embed = new EmbedBuilder()
      .setTitle('✅ Utilisateur ajouté à la whitelist')
      .setColor('#2b2d31')
      .addFields(
        { name: 'ID Utilisateur', value: userId },
        { name: 'Durée', value: `${hours} heures` },
        { name: 'Expire le', value: expiresAt.toLocaleString() }
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Erreur:', error);
    await message.reply('Une erreur est survenue lors de l\'ajout à la whitelist.');
  }
}

export async function handleRemoveWhitelistCommand(message) {
  if (!isAdmin(message.author.id)) {
    return message.reply('Vous n\'avez pas la permission d\'utiliser cette commande.');
  }

  const args = message.content.split(' ');
  args.shift(); // Supprime la commande

  if (args.length < 1) {
    return message.reply('Format incorrect. Utilisez : !delwl @utilisateur ou ID');
  }

  let userId = args[0].replace(/[<@!>]/g, '');
  const guildId = message.guild.id;

  try {
    const stmt = db.prepare(`
      DELETE FROM whitelist
      WHERE guild_id = ? AND user_id = ?
    `);

    const result = stmt.run(guildId, userId);

    if (result.changes === 0) {
      return message.reply('Cet utilisateur n\'est pas dans la whitelist.');
    }

    const embed = new EmbedBuilder()
      .setTitle('❌ Utilisateur retiré de la whitelist')
      .setColor('#2b2d31')
      .addFields(
        { name: 'ID Utilisateur', value: userId }
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Erreur:', error);
    await message.reply('Une erreur est survenue lors du retrait de la whitelist.');
  }
}

export function isWhitelisted(guildId, userId) {
  if (isAdmin(userId)) return true;
  
  const stmt = db.prepare(`
    SELECT expires_at FROM whitelist
    WHERE guild_id = ? AND user_id = ?
  `);
  
  const result = stmt.get(guildId, userId);
  
  if (!result) return false;
  
  // Si expires_at est NULL, c'est une whitelist permanente
  if (!result.expires_at) return true;
  
  // Vérifie si la whitelist n'a pas expiré
  const expiresAt = new Date(result.expires_at);
  const now = new Date();
  
  if (expiresAt > now) {
    return true;
  } else {
    // Supprime automatiquement la whitelist expirée
    const deleteStmt = db.prepare(`
      DELETE FROM whitelist
      WHERE guild_id = ? AND user_id = ?
    `);
    deleteStmt.run(guildId, userId);
    return false;
  }
}