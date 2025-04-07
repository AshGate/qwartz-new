import express from 'express';
import { Client, GatewayIntentBits } from 'discord.js';
import 'dotenv/config';

const app = express();
const port = 3000;
const host = '217.65.144.70';

// Vérification du token
const token = process.env.DISCORD_TOKEN;
if (!token) {
  throw new Error('Le token Discord est manquant dans le fichier .env');
}

app.use(express.json());

// Add CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Handle OPTIONS requests
app.options('*', (req, res) => {
  res.sendStatus(200);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log('Webhook bot is ready!');
});

app.post('/webhook', async (req, res) => {
  try {
    const { message, channelId } = req.body;
    
    if (!message || !channelId) {
      return res.status(400).json({ error: 'Message et channelId requis' });
    }

    const channel = await client.channels.fetch(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Canal non trouvé' });
    }

    await channel.send(message);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur webhook:', error);
    res.status(500).json({ error: 'Erreur interne' });
  }
});

// Add a test route
app.get('/test', (req, res) => {
  res.json({ status: 'Webhook server is running' });
});

app.listen(port, host, () => {
  console.log(`Webhook server running on http://${host}:${port}`);
});

client.login(token);