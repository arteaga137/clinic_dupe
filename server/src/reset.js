// Script de consola: `npm run seed` → vuelve a cargar los datos de práctica.
// ⚠️ Borra todo lo que haya en la base de datos a la que apunta DATABASE_URL.
try { process.loadEnvFile(); } catch { /* sin .env */ }

const { pool, initDb } = await import('./db.js');
const { seedDatabase } = await import('./seed.js');

await initDb(); // por si las tablas aún no existen
await seedDatabase(pool);
console.log('Datos de práctica recargados.');
await pool.end(); // cierra las conexiones para que el script termine
