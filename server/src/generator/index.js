// =====================================================================
// generator/index.js — fabrica pacientes, historiales y agendas
// =====================================================================
// Todo lo de este archivo son FUNCIONES PURAS: reciben datos y devuelven
// datos, sin tocar la base de datos. Así se pueden probar con tests sin
// Postgres, y quien las usa (seed.js, agenda.js) decide cuándo guardar.
// =====================================================================

import { createRng } from './random.js';
import { SURNAMES, MALE, FEMALE, SOCIEDADES, MUTUAS } from './names.js';
import { TEMPLATES, TEMPLATE_BY_ID, makeProfile } from './templates.js';
import { PROF, ageAt } from './helpers.js';

// ---------------------------------------------------------------------
// Fechas (siempre texto 'AAAA-MM-DD' para no liarnos con zonas horarias)
// ---------------------------------------------------------------------
const pad = (n) => String(n).padStart(2, '0');
const fromISO = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const addDays = (iso, n) => { const d = fromISO(iso); d.setDate(d.getDate() + n); return toISO(d); };
export const isWeekend = (iso) => [0, 6].includes(fromISO(iso).getDay());
export const daysBetween = (a, b) => Math.round((fromISO(b) - fromISO(a)) / 86400000);
/** Si cae en sábado o domingo, lo mueve al viernes anterior. */
export const toWeekday = (iso) => { let x = iso; while (isWeekend(x)) x = addDays(x, -1); return x; };

// Horario: 09:00–13:40 y 16:00–18:40, cada 20 minutos (24 huecos por médico).
export const SLOTS = [];
for (const [from, to] of [[540, 840], [960, 1140]]) {
  for (let m = from; m < to; m += 20) SLOTS.push(`${pad(Math.floor(m / 60))}:${pad(m % 60)}`);
}
const toMinutes = (hora) => { const [h, m] = hora.split(':').map(Number); return h * 60 + m; };

// Plantillas agrupadas por médico (para rellenar la agenda de cada uno).
const BY_MEDICO = {};
for (const t of TEMPLATES) (BY_MEDICO[t.medico] ||= []).push(t);

/** Quita campos vacíos ('' o false): el formulario no los necesita. */
const clean = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== '' && v !== false && v !== undefined && v !== null));

// ---------------------------------------------------------------------
// Pacientes
// ---------------------------------------------------------------------
/**
 * Inventa un paciente nuevo. `usedNames` es un Set para no repetir nombres.
 * `onlyTemplates` permite forzar el tipo de caso (p. ej. urgencias).
 */
export function makePatient(hc, rng, usedNames, refDate, onlyTemplates = TEMPLATES) {
  const t = rng.weighted(onlyTemplates.map((x) => [x, x.weight]));
  const female = rng.chance(t.sexo ?? 0.55);
  let nombre;
  do {
    nombre = `${rng.pick(SURNAMES)} ${rng.pick(SURNAMES)}, ${rng.pick(female ? FEMALE : MALE)}`;
  } while (usedNames.has(nombre));
  usedNames.add(nombre);

  const edad = rng.int(t.age[0], t.age[1]);
  const nacimiento = addDays(refDate, -(edad * 365 + rng.int(20, 340)));
  const profile = makeProfile(createRng(`perfil-${hc}`), t);
  const antecedentes = clean(t.ant(createRng(`ant-${hc}`), profile));
  if (!antecedentes.profesion) {
    antecedentes.profesion = edad < 18 ? 'Estudiante' : edad >= 67 ? 'Jubilado/a' : rng.pick(['Empleado/a', 'Empleado/a', 'Autónomo/a', 'Desempleado/a']);
  }
  if (!antecedentes.alergias && antecedentes.alNoC === undefined && rng.chance(0.5)) antecedentes.alNoC = true;

  return {
    hc: String(hc), nombre, nacimiento, caso: t.id,
    sociedad: rng.weighted(SOCIEDADES), mutua: rng.weighted(MUTUAS), antecedentes,
  };
}

/** Datos de UNA visita de un paciente en una fecha. n = nº de visita (0 = primera). */
export function makeVisit(patient, fecha, n) {
  const t = TEMPLATE_BY_ID[patient.caso] || TEMPLATE_BY_ID.revision_general;
  const profile = makeProfile(createRng(`perfil-${patient.hc}`), t); // siempre el mismo perfil
  const age = ageAt(patient.nacimiento, fecha);
  const r = createRng(`${patient.hc}-${fecha}`);
  return {
    data: clean(t.visit(r, { ...profile, age }, { n, age, fecha })),
    prestacion: t.prest(n),
    profesional: PROF[t.medico],
    medico: t.medico,
  };
}

/** Historial inicial: fechas de visitas pasadas, de la más antigua a la más reciente. */
export function makeHistory(patient, today, rng) {
  const t = TEMPLATE_BY_ID[patient.caso] || TEMPLATE_BY_ID.revision_general;
  const count = rng.int(t.visits[0], t.visits[1]);
  const fechas = [];
  let d = t.acute ? addDays(today, -rng.int(20, 700)) : addDays(today, -rng.int(20, Math.max(40, t.interval)));
  for (let i = 0; i < count; i++) {
    fechas.unshift(toWeekday(d));
    d = addDays(d, -Math.round(t.interval * (0.8 + rng() * 0.5)));
  }
  return fechas.map((fecha, n) => ({ fecha, ...makeVisit(patient, fecha, n) }));
}

// ---------------------------------------------------------------------
// Agenda de un día
// ---------------------------------------------------------------------
function ticketFor(nombre, hc) {
  const [apellidos, n = ''] = nombre.split(',').map((x) => x.trim());
  const ini = apellidos.split(' ').map((w) => w[0]).join('') + (n[0] || '');
  return `${ini.toUpperCase()}-${(Number(hc) % 9) + 1}`;
}

function notaFor(rng, t, prestacion) {
  if (prestacion === 'PREVIO CATARATA') return rng.chance(0.6) ? 'Carpeta ok' : 'Falta analítica';
  if (['dmae_humeda', 'rd_diabetica', 'ovr', 'dvp'].includes(t.id)) return rng.chance(0.5) ? 'Dilatar' : '';
  if (t.id === 'glaucoma_caa' && rng.chance(0.3)) return 'Campo visual previo';
  if (prestacion === 'PRIMERA CONSULTA' && rng.chance(0.15)) return 'Trae informe';
  return '';
}

/**
 * Planifica las citas de un día SIN tocar la base de datos.
 *
 * @param fecha     día a rellenar ('AAAA-MM-DD')
 * @param now       { date: 'AAAA-MM-DD', minutes: minutos desde 00:00 }
 * @param patients  [{ hc, nombre, nacimiento, caso, fechas: [fechas de visitas] }]
 * @param existing  citas que ya hay ese día [{ hc, medico, hora }]
 * @param nextHc    primer nº de HC libre (para pacientes nuevos)
 * @returns { newPatients, appointments }  (las citas atendidas llevan `visit`)
 */
export function planDay({ fecha, now, patients, existing, nextHc }) {
  const rng = createRng(`agenda-${fecha}`); // misma fecha → misma agenda
  const usedNames = new Set(patients.map((p) => p.nombre));
  const booked = new Set(existing.map((a) => a.hc));
  const taken = new Set(existing.map((a) => `${a.medico}|${a.hora}`));
  const newPatients = [];
  const appointments = [];
  let hc = nextHc;

  const targets = { 'DRA. SANZ': rng.int(11, 14), 'DR. MOLINA': rng.int(8, 11), 'OPTOMETRÍA': rng.int(8, 11) };

  for (const [medico, target] of Object.entries(targets)) {
    const already = existing.filter((a) => a.medico === medico).length;
    let need = target - already;
    if (need <= 0) continue;

    const free = SLOTS.filter((h) => !taken.has(`${medico}|${h}`));
    const chosen = [];

    // 1) Pacientes nuevos (primeras consultas y urgencias).
    const templates = BY_MEDICO[medico];
    const nuevos = Math.min(need, rng.int(1, 3));
    for (let i = 0; i < nuevos; i++) {
      const acute = templates.filter((t) => t.acute);
      const pool = acute.length && rng.chance(0.35) ? acute : templates;
      const p = makePatient(hc++, rng, usedNames, fecha, pool);
      newPatients.push(p);
      chosen.push({ patient: p, n: 0 });
    }
    need -= nuevos;

    // 2) Pacientes ya conocidos a los que "les toca" revisión.
    const ids = new Set(templates.map((t) => t.id));
    const candidates = patients.filter((p) => {
      if (booked.has(p.hc) || !ids.has(p.caso)) return false;
      const t = TEMPLATE_BY_ID[p.caso];
      if (t.acute) return false;
      const prev = p.fechas.filter((f) => f < fecha);
      if (prev.length === 0) return false; // aún no era paciente ese día
      // Ni una visita en las 2 semanas anteriores ni en las posteriores.
      return !p.fechas.some((f) => Math.abs(daysBetween(f, fecha)) < 14);
    });
    // Peso: más probable cuanto más se acerque el tiempo desde la última visita a su intervalo habitual.
    const weighted = candidates.map((p) => {
      const t = TEMPLATE_BY_ID[p.caso];
      const last = p.fechas.filter((f) => f < fecha).at(-1);
      const gap = daysBetween(last, fecha);
      return [p, 1 / (1 + Math.abs(gap - t.interval) / t.interval)];
    });
    while (need > 0 && weighted.length) {
      const p = rng.weighted(weighted);
      weighted.splice(weighted.findIndex(([x]) => x === p), 1);
      chosen.push({ patient: p, n: p.fechas.filter((f) => f < fecha).length });
      need--;
    }

    // 3) Horas: huecos libres al azar, ordenados.
    const horas = rng.shuffle(free).slice(0, chosen.length).sort();
    chosen.forEach(({ patient, n }, i) => {
      const hora = horas[i];
      if (!hora) return; // agenda llena
      const t = TEMPLATE_BY_ID[patient.caso];
      const prestacion = t.prest(n);
      booked.add(patient.hc);
      taken.add(`${medico}|${hora}`);

      // Estado según si el día (y la hora) ya pasó.
      let status = 'citado';
      if (fecha < now.date) status = 'atendido';
      else if (fecha === now.date) {
        const m = toMinutes(hora);
        if (m < now.minutes - 30) status = 'atendido';
        else if (m < now.minutes) status = rng.pick(['consulta', 'sala']);
        else if (m < now.minutes + 40 && rng.chance(0.5)) status = 'sala';
      }
      appointments.push({
        hc: patient.hc, medico, hora, prestacion, status,
        urgente: prestacion === 'CONSULTA URGENCIAS', nota: notaFor(rng, t, prestacion),
        ticket: ticketFor(patient.nombre, patient.hc),
        visit: status === 'atendido' ? makeVisit(patient, fecha, n) : null,
      });
    });
  }
  return { newPatients, appointments };
}
