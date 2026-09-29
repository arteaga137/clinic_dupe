// =====================================================================
// seed.js — carga inicial de la base de datos de práctica
// =====================================================================
// Pacientes = 36 casos escritos a mano (seedData.js) + ~380 generados a
// partir de plantillas (generator/). Todos con su historial de visitas.
//
// Las CITAS de cada día NO se crean aquí: las crea agenda.js la primera
// vez que alguien abre ese día en la agenda. Así la agenda nunca se queda
// vacía, pasen los días que pasen.
// =====================================================================

import { CASES } from './seedData.js';
import { createRng } from './generator/random.js';
import { makePatient, makeHistory, addDays, isWeekend, toWeekday, SLOTS } from './generator/index.js';

/** Súbelo cuando cambien los datos de práctica: el servidor recargará la BD sola al arrancar. */
export const SEED_VERSION = 4;
const GENERATED_PATIENTS = 380;

/**
 * Fecha de hoy (AAAA-MM-DD) según la zona horaria del servidor. Los
 * servidores de Render usan UTC; por eso en render.yaml fijamos
 * TZ=Europe/Madrid, para que "hoy" cambie a medianoche en España.
 */
export function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Fecha a `n` días LABORABLES de `from` (n negativo = hacia atrás, 0 = el mismo día). */
function workdays(from, n) {
  let d = from;
  const step = n < 0 ? -1 : 1;
  for (let left = Math.abs(n); left > 0;) {
    d = addDays(d, step);
    if (!isWeekend(d)) left--;
  }
  return d;
}

const MEDICO_DE = { 'Sanz Molina, Laura': 'DRA. SANZ', 'Molina Pardo, Andrés': 'DR. MOLINA', 'Ortega Gil, Pablo': 'OPTOMETRÍA' };

function ticketFor(c) {
  const [apellidos, nombre = ''] = c.nombre.split(',').map((t) => t.trim());
  return `${(apellidos.split(' ').map((w) => w[0]).join('') + (nombre[0] || '')).toUpperCase()}-${(Number(c.hc) % 9) + 1}`;
}

/** Convierte casos + generador en filas listas para insertar. Función pura (se prueba sin BD). */
export function buildSeed(today = todayISO()) {
  const patients = [];
  const visits = [];
  const appointments = [];
  const taken = new Set(); // "fecha|médico|hora" ocupados
  const slot = (fecha, medico, start) => {
    for (let i = 0; i < SLOTS.length; i++) {
      const hora = SLOTS[(start + i) % SLOTS.length];
      if (!taken.has(`${fecha}|${medico}|${hora}`)) { taken.add(`${fecha}|${medico}|${hora}`); return hora; }
    }
    throw new Error(`Sin huecos: ${medico} ${fecha}`);
  };

  // 1) Casos escritos a mano.
  CASES.forEach((c, i) => {
    patients.push({ hc: c.hc, nombre: c.nombre, nacimiento: c.nacimiento, sociedad: c.sociedad, mutua: c.mutua || '',
      caso: c.caso, antecedentes: c.antecedentes || {} });
    for (const v of c.visitas || []) {
      const fecha = v.haceLab !== undefined ? workdays(today, -v.haceLab) : toWeekday(addDays(today, -v.hace));
      visits.push({ hc: c.hc, fecha, profesional: v.prof, prestacion: v.prest, data: v.data });
      if (v.haceLab !== undefined) {
        const medico = MEDICO_DE[v.prof] || 'DRA. SANZ';
        appointments.push({ fecha, hora: slot(fecha, medico, i * 3), ticket: ticketFor(c), nota: '', medico, hc: c.hc,
          prestacion: v.prest, status: 'atendido', urgente: Boolean(v.urgente) });
      }
    }
    if (c.proxima) {
      const fecha = workdays(today, c.proxima.en);
      appointments.push({ fecha, hora: slot(fecha, c.proxima.medico, i * 3), ticket: ticketFor(c), nota: c.proxima.nota || '',
        medico: c.proxima.medico, hc: c.hc, prestacion: c.proxima.prest, status: fecha < today ? 'atendido' : 'citado',
        urgente: Boolean(c.proxima.urgente) });
    }
  });

  // 2) Pacientes generados, con su historial.
  const rng = createRng('semilla-base'); // misma semilla → mismos pacientes en cada reinicio
  const usedNames = new Set(patients.map((p) => p.nombre));
  for (let i = 0; i < GENERATED_PATIENTS; i++) {
    const p = makePatient(700137 + i, rng, usedNames, today);
    patients.push(p);
    for (const v of makeHistory(p, today, rng)) {
      visits.push({ hc: p.hc, fecha: v.fecha, profesional: v.profesional, prestacion: v.prestacion, data: v.data });
    }
  }
  return { patients, appointments, visits };
}

// ---------------------------------------------------------------------
// Inserción por lotes
// ---------------------------------------------------------------------
// Insertar 1.500 filas una a una son 1.500 viajes de ida y vuelta a
// Supabase (varios segundos). Con json_to_recordset enviamos TODAS las
// filas en un único parámetro JSON y Postgres las convierte en una tabla
// temporal dentro de la misma consulta: un solo viaje.
export async function insertMany(client, table, columns, rows, returning = '') {
  if (!rows.length) return [];
  const names = Object.keys(columns).join(', ');
  const types = Object.entries(columns).map(([c, t]) => `${c} ${t}`).join(', ');
  const { rows: out } = await client.query(
    `INSERT INTO ${table} (${names}) SELECT ${names} FROM json_to_recordset($1) AS x(${types}) ${returning}`,
    [JSON.stringify(rows)]
  );
  return out;
}

export const PATIENT_COLS = { hc: 'text', nombre: 'text', nacimiento: 'date', sociedad: 'text', mutua: 'text', antecedentes: 'jsonb', caso: 'text' };
export const APPT_COLS = { fecha: 'date', hora: 'text', ticket: 'text', nota: 'text', medico: 'text', hc: 'text', prestacion: 'text', status: 'text', urgente: 'boolean' };
export const VISIT_COLS = { hc: 'text', appointment_id: 'int', fecha: 'date', profesional: 'text', prestacion: 'text', data: 'jsonb' };

/**
 * Borra todo y vuelve a cargar los datos de práctica, en una TRANSACCIÓN:
 * o se ejecuta todo, o nada (si algo falla, ROLLBACK y la BD queda como estaba).
 * Recibe el `pool` como parámetro para evitar una importación circular con db.js.
 */
export async function seedDatabase(pool) {
  const { patients, appointments, visits } = buildSeed();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // TRUNCATE vacía las tablas de golpe; RESTART IDENTITY reinicia los ids.
    await client.query('TRUNCATE visits, appointments, patients, agenda_days RESTART IDENTITY CASCADE');
    await insertMany(client, 'patients', PATIENT_COLS, patients);
    const ids = await insertMany(client, 'appointments', APPT_COLS, appointments, 'RETURNING id, hc, fecha');
    // Enlazamos cada visita con la cita de ese paciente ese día (si la hay).
    const idOf = new Map(ids.map((a) => [`${a.hc}|${a.fecha}`, a.id]));
    await insertMany(client, 'visits', VISIT_COLS, visits.map((v) => ({ ...v, appointment_id: idOf.get(`${v.hc}|${v.fecha}`) ?? null })));
    await client.query(
      `INSERT INTO meta (key, value) VALUES ('seed_version', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [String(SEED_VERSION)]
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
