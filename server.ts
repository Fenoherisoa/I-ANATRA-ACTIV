/**
 * I-ANATRA Ecosystem - RFC OFFICE
 * Serveur Full-Stack Express (REST API + Vite Middleware)
 * Port: 3000
 * © 2026 RFC OFFICE — Tous droits réservés
 */

import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import licenseRoutes from './license-server/src/routes/licenseRoutes';
import adminRoutes from './license-server/src/routes/adminRoutes';
import { db } from './license-server/src/database/db';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log minimal de sécurité
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    // console.log(`[API ${req.method}] ${req.path}`);
  }
  next();
});

// Endpoint officiel Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'I-ANATRA LICENSE SERVER',
    version: '1.0.0',
    crypto: 'Ed25519',
    timestamp: new Date().toISOString(),
  });
});

// Endpoint public pour récupérer la clé publique Ed25519 officielle
app.get('/api/v1/public-key', (req, res) => {
  res.status(200).json({
    publicKey: db.keys.publicKey,
    algorithm: 'Ed25519',
    organization: 'RFC OFFICE',
    product: 'I-ANATRA',
  });
});

// Routes API REST
app.use('/api/v1/license', licenseRoutes);
app.use('/api/v1/admin', adminRoutes);

// Servir les assets statiques publics (comme ianatra.png)
app.use(express.static(path.resolve(process.cwd(), 'public')));
app.use('/assets', express.static(path.resolve(process.cwd(), 'assets')));

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Montage de Vite en mode développement
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    // En production, servir le build dist
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(` I-ANATRA LICENSE SERVER & ADMIN — RFC OFFICE`);
    console.log(` Version : 1.0.0`);
    console.log(` Port    : ${PORT}`);
    console.log(` Health  : http://localhost:${PORT}/health`);
    console.log(` API     : http://localhost:${PORT}/api/v1/license`);
    console.log(` Admin   : http://localhost:${PORT}/api/v1/admin`);
    console.log(` © 2026 RFC OFFICE — Tous droits réservés`);
    console.log(`=======================================================`);
  });
}

startServer().catch((err) => {
  console.error('Erreur démarrage serveur :', err);
  process.exit(1);
});
