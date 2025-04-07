import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// Crée le dossier transcripts s'il n'existe pas
const transcriptsDir = join(__dirname, '../transcripts');
if (!fs.existsSync(transcriptsDir)) {
  fs.mkdirSync(transcriptsDir, { recursive: true });
}

// Middleware pour les logs de requêtes
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Configuration CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Route pour les transcripts
app.get('/transcripts/:guildId/:filename', (req, res) => {
  try {
    const { guildId, filename } = req.params;
    const filePath = join(transcriptsDir, guildId, filename);
    
    // Vérifie si le fichier existe
    if (!fs.existsSync(filePath)) {
      console.error(`Fichier non trouvé: ${filePath}`);
      return res.status(404).send('Transcript non trouvé');
    }

    // Vérifie si le fichier est lisible
    try {
      fs.accessSync(filePath, fs.constants.R_OK);
    } catch (error) {
      console.error(`Erreur d'accès au fichier: ${error}`);
      return res.status(500).send('Erreur d\'accès au fichier');
    }

    // Lit et envoie le fichier
    const content = fs.readFileSync(filePath, 'utf8');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.send(content);
  } catch (error) {
    console.error(`Erreur lors de la lecture du transcript: ${error}`);
    res.status(500).send('Erreur lors de la lecture du transcript');
  }
});

// Route de test
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    transcriptsPath: transcriptsDir
  });
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).send('Page non trouvée');
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(500).send('Erreur interne du serveur');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Serveur de transcripts démarré sur le port ${port}`);
});

export default app;