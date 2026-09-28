// =====================================================================
// index.js — punto de entrada: prepara la BD y arranca el servidor HTTP
// =====================================================================

// Carga las variables de server/.env (DATABASE_URL...) en process.env.
// process.loadEnvFile viene incluido en Node (≥ 20.12), sin librerías.
// En Render no hay archivo .env (las variables se ponen en su panel), así
// que si no existe simplemente seguimos.
try {
  process.loadEnvFile();
} catch {
  /* sin .env: usamos las variables de entorno del sistema */
}

// Import dinámico: db.js lee DATABASE_URL al cargarse, así que debe
// importarse DESPUÉS de cargar el .env (los `import` normales se ejecutan
// antes que cualquier otra línea del archivo).
const { app } = await import('./app.js');
const { initDb } = await import('./db.js');

// process.env.PORT: Render nos dice en qué puerto escuchar. En local, 3001.
const PORT = Number(process.env.PORT) || 3001;

try {
  await initDb(); // crea tablas y datos de práctica si hace falta
} catch (err) {
  console.error('✖ No se pudo conectar a la base de datos:', err.message);
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});
