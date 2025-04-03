import { EmbedBuilder } from 'discord.js';
import { isWhitelisted } from './whitelist.js';

const userCommands = [
  { 
    name: '!help', 
    description: 'Affiche la liste des commandes disponibles' 
  },
  { 
    name: '!ticket', 
    description: 'Crée un message pour générer des tickets de support' 
  },
  { 
    name: '!embed "titre" "description" #salon lien: URL :crédit texte couleur: #hexcode', 
    description: 'Crée un embed personnalisé avec titre, description, image, crédit et couleur' 
  },
  { 
    name: '!pic ID_DISCORD', 
    description: 'Affiche l\'avatar d\'un utilisateur en grand format' 
  },
  { 
    name: '!send message #salon', 
    description: 'Envoie un message dans le salon spécifié' 
  },
  {
    name: '!ajoutannuaire nom prénom numéro',
    description: 'Ajoute un contact dans l\'annuaire du serveur'
  },
  {
    name: '!recherche nom_ou_numero',
    description: 'Recherche un contact dans l\'annuaire par nom ou numéro'
  },
  {
    name: '!wliste',
    description: 'Affiche la liste des utilisateurs whitelistés'
  },
  {
    name: '!theme <couleur>',
    description: 'Change la couleur des embeds (rouge, vert, bleu, jaune, cyan, rose, violet, orange, etc)'
  },
  {
    name: '!recrutement <ouvrir/fermer> @role #salon',
    description: 'Ouvre ou ferme les candidatures dans un salon spécifique avec mention du rôle (Whitelist requis)'
  },
  {
    name: '!clear',
    description: 'Supprime les 10 derniers messages du salon'
  }
];

const adminCommands = [
  {
    name: '!addwl @utilisateur ou ID',
    description: 'Ajoute un utilisateur à la whitelist de façon permanente (Admin uniquement)'
  },
  {
    name: '!addwlday @utilisateur ou ID nombre_de_jours',
    description: 'Ajoute un utilisateur à la whitelist pour un nombre de jours spécifié (Admin uniquement)'
  },
  {
    name: '!addwltime @utilisateur ou ID nombre_d_heures',
    description: 'Ajoute un utilisateur à la whitelist pour un nombre d\'heures spécifié (Admin uniquement)'
  },
  {
    name: '!delwl @utilisateur ou ID',
    description: 'Retire un utilisateur de la whitelist (Admin uniquement)'
  },
  {
    name: '!messagelog on #salon',
    description: 'Active les logs des messages supprimés et édités dans un salon (Admin uniquement)'
  },
  {
    name: '!messagelog off',
    description: 'Désactive les logs de messages (Admin uniquement)'
  }
];

export async function handleHelpCommand(message) {
  const isAdmin = message.author.id === '619551502272561152';
  const commands = isAdmin ? [...userCommands, ...adminCommands] : userCommands;

  const embed = new EmbedBuilder()
    .setTitle('📚 Liste des commandes disponibles')
    .setColor('#2b2d31')
    .setDescription(
      commands
        .map(cmd => `**${cmd.name}**\n${cmd.description}`)
        .join('\n\n')
    )
    .setFooter({ text: 'Développé avec ❤️ créé par H-Gate' })
    .setTimestamp();

  await message.channel.send({ embeds: [embed] });
}