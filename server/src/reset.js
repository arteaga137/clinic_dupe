// Script de consola: `npm run seed` → vuelve a cargar los datos de práctica.
import { db } from './db.js';
import { seedDatabase } from './seed.js';

seedDatabase(db);
console.log('Datos de práctica recargados.');
db.close();
