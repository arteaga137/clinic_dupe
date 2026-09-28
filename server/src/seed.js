// =====================================================================
// seed.js — datos de práctica (100 % ficticios)
// =====================================================================
// "Seed" (semilla) es el nombre habitual para los datos iniciales de una
// aplicación. Todos los nombres, números de historia y datos clínicos son
// inventados: nunca metas datos reales de pacientes en un repositorio.
// =====================================================================

/**
 * Fecha de hoy en formato ISO (AAAA-MM-DD) según la zona horaria del
 * servidor. Los servidores de Render usan UTC; por eso en render.yaml
 * fijamos TZ=Europe/Madrid, para que "hoy" cambie a medianoche en España.
 */
import { CASES, TODAY_APPOINTMENTS } from './seedData.js';

export function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// ---------------------------------------------------------------------
// Fechas relativas a hoy
// ---------------------------------------------------------------------
const pad = (n) => String(n).padStart(2, '0');
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const isWeekend = (d) => d.getDay() === 0 || d.getDay() === 6; // 0 = domingo, 6 = sábado

/** Fecha de hace `days` días naturales; si cae en fin de semana, el viernes anterior. */
function daysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  while (isWeekend(d)) d.setDate(d.getDate() - 1);
  return toISO(d);
}

/**
 * Fecha a `n` días LABORABLES de hoy (n negativo = pasado, 0 = hoy).
 * Avanza día a día y solo cuenta los que no son sábado ni domingo.
 */
function workdays(n) {
  const d = new Date();
  const step = n < 0 ? -1 : 1;
  let left = Math.abs(n);
  while (left > 0) {
    d.setDate(d.getDate() + step);
    if (!isWeekend(d)) left--;
  }
  return toISO(d);
}

// ---------------------------------------------------------------------
// Reparto de huecos en la agenda
// ---------------------------------------------------------------------
// Horario de consulta: mañana 09:00–13:40 y tarde 16:00–18:40, cada 20 min.
const SLOTS = [];
for (const [from, to] of [[9 * 60, 14 * 60], [16 * 60, 19 * 60]]) {
  for (let m = from; m < to; m += 20) SLOTS.push(`${pad(Math.floor(m / 60))}:${pad(m % 60)}`);
}

/** Guarda qué huecos (fecha + médico + hora) ya están ocupados. */
function createSlotBook() {
  const used = new Set(); // un Set no admite duplicados y busca muy rápido
  return {
    take(fecha, medico, hora) { used.add(`${fecha}|${medico}|${hora}`); },
    /** Primer hueco libre, empezando en una posición que depende del paciente
     *  (así no se amontonan todas las citas a las 09:00). */
    next(fecha, medico, startIndex) {
      for (let i = 0; i < SLOTS.length; i++) {
        const hora = SLOTS[(startIndex + i) % SLOTS.length];
        const key = `${fecha}|${medico}|${hora}`;
        if (!used.has(key)) { used.add(key); return hora; }
      }
      throw new Error(`Agenda llena: ${medico} el ${fecha}`);
    },
  };
}

const MEDICO_DE = {
  'Sanz Molina, Laura': 'DRA. SANZ',
  'Molina Pardo, Andrés': 'DR. MOLINA',
  'Ortega Gil, Pablo': 'OPTOMETRÍA',
};

/** Ticket tipo "NGT-4": iniciales de apellidos y nombre + un número. */
function ticketFor(c) {
  const [apellidos, nombre = ''] = c.nombre.split(',').map((t) => t.trim());
  const ini = apellidos.split(' ').map((w) => w[0]).join('') + (nombre[0] || '');
  return `${ini.toUpperCase()}-${(Number(c.hc) % 9) + 1}`;
}

/**
 * Convierte los casos de seedData.js en filas listas para insertar:
 * pacientes, citas (pasadas, de hoy y futuras) y visitas.
 */
export function buildSeed() {
  const book = createSlotBook();
  const appointments = []; // cada cita lleva `ref` si hay que enlazarle una visita
  const visits = [];
  const hoy = todayISO();

  // 1) Citas fijas de hoy.
  for (const [hora, ticket, nota, medico, hc, prestacion, status, urgente = false] of TODAY_APPOINTMENTS) {
    book.take(hoy, medico, hora);
    appointments.push({ fecha: hoy, hora, ticket, nota, medico, hc, prestacion, status, urgente });
  }

  const patients = CASES.map((c) => ({
    hc: c.hc, nombre: c.nombre, nacimiento: c.nacimiento, sociedad: c.sociedad, mutua: c.mutua || '',
    antecedentes: c.antecedentes || {},
  }));

  CASES.forEach((c, index) => {
    const start = (index * 3) % SLOTS.length;
    // 2) Visitas anteriores. Las recientes (haceLab) generan su cita atendida.
    for (const v of c.visitas || []) {
      const medico = v.medico || MEDICO_DE[v.prof] || 'DRA. SANZ';
      const fecha = v.haceLab !== undefined ? workdays(-v.haceLab) : daysAgo(v.hace);
      const visit = { hc: c.hc, fecha, profesional: v.prof, prestacion: v.prest, data: v.data, appointmentRef: null };
      if (v.haceLab !== undefined) {
        const ref = { fecha, hora: book.next(fecha, medico, start), ticket: ticketFor(c), nota: '', medico,
          hc: c.hc, prestacion: v.prest, status: 'atendido', urgente: Boolean(v.urgente) };
        appointments.push(ref);
        visit.appointmentRef = ref; // se enlaza con el id real al insertar
      }
      visits.push(visit);
    }
    // 3) Próxima cita (futura o de hoy).
    if (c.proxima) {
      const p = c.proxima;
      const fecha = workdays(p.en);
      appointments.push({ fecha, hora: book.next(fecha, p.medico, start), ticket: ticketFor(c), nota: p.nota || '',
        medico: p.medico, hc: c.hc, prestacion: p.prest, status: 'citado', urgente: Boolean(p.urgente) });
    }
  });

  // 4) Relleno: que los próximos 10 días laborables tengan al menos 7 citas,
  //    como una agenda real. Usamos un generador pseudoaleatorio con semilla
  //    fija: "aleatorio" pero IGUAL en cada reinicio (reproducible).
  let seed = 42;
  const rand = (n) => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
  const FILL = [['REVISIÓN', 'DRA. SANZ'], ['PRIMERA CONSULTA', 'DR. MOLINA'], ['REVISIÓN', 'OPTOMETRÍA'],
    ['PRIMERA CONSULTA', 'DRA. SANZ'], ['REVISIÓN', 'DR. MOLINA'], ['PREVIO REFRACTIVA', 'OPTOMETRÍA']];
  for (let day = 1; day <= 10; day++) {
    const fecha = workdays(day);
    const booked = new Set(appointments.filter((a) => a.fecha === fecha).map((a) => a.hc));
    while (booked.size < 7) {
      const c = CASES[rand(CASES.length)];
      if (booked.has(c.hc)) continue; // un paciente, una cita por día
      booked.add(c.hc);
      const [prestacion, medico] = FILL[rand(FILL.length)];
      appointments.push({ fecha, hora: book.next(fecha, medico, rand(SLOTS.length)), ticket: ticketFor(c), nota: '',
        medico, hc: c.hc, prestacion, status: 'citado', urgente: false });
    }
  }

  // Ordenamos las citas por fecha y hora: así los ids siguen el orden de la agenda.
  appointments.sort((a, b) => (a.fecha + a.hora + a.medico).localeCompare(b.fecha + b.hora + b.medico));
  return { patients, appointments, visits };
}

/**
 * Borra todo y vuelve a cargar los datos de práctica.
 * Va dentro de una TRANSACCIÓN: o se ejecuta todo, o nada. Si algo falla a
 * mitad, Postgres deshace los cambios (ROLLBACK) y la BD no queda a medias.
 *
 * Recibe el `pool` de conexiones como parámetro (en vez de importarlo de
 * db.js) para evitar una importación circular: db.js ya importa este archivo.
 */
export async function seedDatabase(pool) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // TRUNCATE vacía las tablas de golpe. RESTART IDENTITY hace que los ids
    // vuelvan a empezar en 1, y CASCADE respeta las claves foráneas.
    await client.query('TRUNCATE visits, appointments, patients RESTART IDENTITY CASCADE');

    const { patients, appointments, visits } = buildSeed();

    // En pg, los valores van como $1, $2... y se pasan en un array aparte.
    for (const p of patients) {
      await client.query(
        `INSERT INTO patients (hc, nombre, nacimiento, sociedad, mutua, antecedentes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        // JSON.stringify: convertimos el objeto en texto JSON para la columna JSONB.
        [p.hc, p.nombre, p.nacimiento, p.sociedad, p.mutua, JSON.stringify(p.antecedentes)]
      );
    }
    for (const a of appointments) {
      const { rows } = await client.query(
        `INSERT INTO appointments (fecha, hora, ticket, nota, medico, hc, prestacion, status, urgente)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [a.fecha, a.hora, a.ticket, a.nota, a.medico, a.hc, a.prestacion, a.status, a.urgente]
      );
      a.id = rows[0].id; // lo guardamos para enlazar la visita de ese día
    }
    for (const v of visits) {
      await client.query(
        `INSERT INTO visits (hc, appointment_id, fecha, profesional, prestacion, data) VALUES ($1, $2, $3, $4, $5, $6)`,
        [v.hc, v.appointmentRef?.id ?? null, v.fecha, v.profesional, v.prestacion, JSON.stringify(v.data)]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
