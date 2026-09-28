// =====================================================================
// db.js — conexión a la base de datos
// =====================================================================
// Este módulo se ejecuta UNA vez (Node cachea los módulos importados), así
// que todos los archivos que hagan `import { db } from './db.js'` comparten
// la misma conexión. Es un patrón muy habitual llamado "singleton".
//
// Usamos better-sqlite3 porque es SÍNCRONO: `db.prepare(...).all()` devuelve
// el resultado directamente, sin callbacks ni await. Para SQLite (un archivo
// local, rapidísimo) esto simplifica mucho el código.
// =====================================================================

import Database from 'better-sqlite3';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { seedDatabase } from './seed.js';

// En los módulos ES no existe __dirname; lo reconstruimos a partir de la URL
// del propio archivo. Así las rutas funcionan lancemos el servidor desde
// donde lo lancemos.
const __dirname = dirname(fileURLToPath(import.meta.url));

// La ruta del archivo .db se puede cambiar con una variable de entorno
// (útil para los tests, que usan ':memory:', una BD que vive solo en RAM).
const DB_PATH = process.env.DB_PATH || join(__dirname, '..', 'data', 'clinic.db');

if (DB_PATH !== ':memory:') mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);

// WAL ("write-ahead log") permite leer mientras se escribe: mejor rendimiento.
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Crea las tablas si no existen (el SQL está en schema.sql).
db.exec(readFileSync(join(__dirname, 'schema.sql'), 'utf8'));

// Si la base de datos está vacía (primer arranque), la rellenamos con
// pacientes y citas ficticias para poder practicar.
const { n } = db.prepare('SELECT COUNT(*) AS n FROM patients').get();
if (n === 0) {
  seedDatabase(db);
  console.log('[db] Base de datos vacía: cargados datos de práctica.');
}
