import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

// Crée le dossier transcripts s'il n'existe pas
const transcriptsDir = join(__dirname, '../transcripts');
if (!fs.existsSync(transcriptsDir)) {
  fs.mkdirSync(transcriptsDir, { recursive: true });
}

// Configuration CORS pour permettre l'accès depuis n'importe quelle origine
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Sert les fichiers statiques du dossier transcripts
app.use('/transcripts', express.static(transcriptsDir, {
  setHeaders: (res, path) => {
    res.setHeader('Content-Type', 'text/html');
  }
}));

// Route pour vérifier si le serveur est en ligne
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Serveur de transcripts démarré sur le port ${port}`);
});

export default app;