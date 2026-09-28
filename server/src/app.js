// =====================================================================
// app.js — configuración de Express
// =====================================================================
// Separamos "crear la app" (este archivo) de "arrancar el servidor"
// (index.js). Así los tests pueden importar la app y probarla sin abrir
// un puerto real.
//
// Express funciona con MIDDLEWARES: funciones que se ejecutan en orden para
// cada petición. Cada una puede responder o pasar a la siguiente. El orden
// en que las registramos con app.use() es el orden en que se ejecutan.
// =====================================================================

import express from 'express';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './db.js';
import { seedDatabase } from './seed.js';
import { HttpError } from './errors.js';
import { appointmentsRouter } from './routes/appointments.js';
import { patientsRouter } from './routes/patients.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const app = express();

// 1) Convierte el cuerpo JSON de las peticiones en `req.body`.
app.use(express.json({ limit: '1mb' }));

// 2) Rutas de la API.
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/appointments', appointmentsRouter);
app.use('/api/patients', patientsRouter);

// Botón "Reiniciar práctica": vuelve a cargar los datos iniciales.
app.post('/api/reset', (req, res) => {
  seedDatabase(db);
  res.json({ ok: true });
});

// Cualquier otra ruta /api/... que no exista → 404 en JSON.
app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// 3) En producción, Express también sirve el frontend ya compilado
//    (client/dist). En desarrollo no hace falta: lo sirve Vite.
const distDir = join(__dirname, '..', '..', 'client', 'dist');
if (existsSync(distDir)) {
  app.use(express.static(distDir));
  // Cualquier ruta que no sea un archivo devuelve index.html (típico de
  // las "Single Page Applications": React decide qué pantalla mostrar).
  app.get('/{*splat}', (req, res) => res.sendFile(join(distDir, 'index.html')));
}

// 4) Manejador de errores: Express lo reconoce porque tiene 4 parámetros.
//    Express 5 también captura aquí los errores lanzados con `throw`.
app.use((err, req, res, next) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON mal formado' });
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});
