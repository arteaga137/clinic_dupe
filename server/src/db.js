// =====================================================================
// db.js — conexión a PostgreSQL (Supabase en producción)
// =====================================================================
// Cambio importante respecto a SQLite: PostgreSQL es un SERVIDOR al que
// nos conectamos por red. Cada consulta tarda unos milisegundos en ir y
// volver, así que todo es ASÍNCRONO: las funciones devuelven Promesas y
// en las rutas escribimos `await query(...)`.
//
// Usamos un POOL de conexiones: abrir una conexión es lento, así que el
// pool mantiene unas cuantas abiertas y las reparte entre las peticiones.
// =====================================================================

import pg from 'pg';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { seedDatabase, SEED_VERSION } from './seed.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Por defecto, pg convierte las columnas DATE en objetos Date de JavaScript,
// que traen zona horaria y pueden "moverse" un día. Como solo queremos el
// texto 'AAAA-MM-DD', le decimos que lo devuelva tal cual.
// (1082 es el identificador interno del tipo DATE en Postgres.)
pg.types.setTypeParser(1082, (value) => value);

// La dirección de la base de datos llega por una VARIABLE DE ENTORNO.
// Nunca se escribe en el código: contiene la contraseña y el repositorio
// es público. En tu Mac va en server/.env; en Render, en su panel.
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('\n✖ Falta DATABASE_URL. Copia server/.env.example a server/.env y rellénala.\n');
  process.exit(1);
}

// Supabase exige conexión cifrada (SSL). Un Postgres en tu propio
// ordenador normalmente no la tiene, así que solo la activamos si la
// base de datos NO es local.
const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(connectionString);

export const pool = new pg.Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  max: 5, // el plan gratuito de Supabase limita las conexiones simultáneas
});

/** Ejecuta una consulta y devuelve las filas. Los valores van en `params` ($1, $2...). */
export async function query(text, params = []) {
  const result = await pool.query(text, params);
  return result.rows;
}

/** Igual que query() pero devuelve solo la primera fila (o undefined). */
export async function queryOne(text, params = []) {
  const rows = await query(text, params);
  return rows[0];
}

/**
 * Ejecuta `fn` dentro de una TRANSACCIÓN: o se aplican todos sus cambios o
 * ninguno. Todas las consultas de una transacción deben ir por la MISMA
 * conexión, por eso pedimos un `client` al pool y se lo pasamos a `fn`.
 */
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK'); // deshace todo lo hecho desde BEGIN
    throw err;
  } finally {
    client.release(); // devuelve la conexión al pool, haya error o no
  }
}

/**
 * Crea las tablas si faltan y carga los datos de práctica si la base está
 * vacía o si son de una versión anterior (SEED_VERSION en seed.js).
 * ⚠️ Al cambiar de versión se reemplazan TODOS los datos de práctica.
 */
export async function initDb() {
  await pool.query(readFileSync(join(__dirname, 'schema.sql'), 'utf8'));
  const { n } = await queryOne('SELECT COUNT(*)::int AS n FROM patients');
  const row = await queryOne("SELECT value FROM meta WHERE key = 'seed_version'");
  if (n === 0 || row?.value !== String(SEED_VERSION)) {
    await seedDatabase(pool);
    console.log(`[db] Datos de práctica cargados (versión ${SEED_VERSION}).`);
  }
}
