// =====================================================================
// agenda.js — la agenda que se rellena sola
// =====================================================================
// La primera vez que alguien abre un día laborable en la agenda, este
// módulo genera las citas de ese día (y, si el día ya pasó, también las
// visitas con su exploración). Es "generación perezosa" (lazy): no se crea
// nada hasta que hace falta, así que la agenda funciona hoy, mañana y
// dentro de un año sin tener que recargar los datos.
//
// Para no generar un día dos veces usamos la tabla agenda_days:
//   INSERT ... ON CONFLICT DO NOTHING devuelve 0 filas si el día ya
//   estaba. Si dos peticiones llegan a la vez, Postgres hace esperar a la
//   segunda hasta que la primera termine su transacción, y entonces ve
//   que el día ya existe. Es una forma sencilla de evitar "carreras".
// =====================================================================

import { pool } from './db.js';
import { planDay, isWeekend, addDays } from './generator/index.js';
import { insertMany, PATIENT_COLS, APPT_COLS, VISIT_COLS, todayISO } from './seed.js';

// Solo rellenamos días en este margen alrededor de hoy (evita generar
// datos sin fin si alguien navega años hacia delante).
const DAYS_BACK = 400;
const DAYS_AHEAD = 180;

export async function ensureAgenda(fecha) {
  const today = todayISO();
  if (isWeekend(fecha) || fecha < addDays(today, -DAYS_BACK) || fecha > addDays(today, DAYS_AHEAD)) return;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Candado de toda la base (dura hasta el COMMIT): si se generan dos días
    // a la vez, van uno detrás de otro y no se asigna dos veces el mismo HC.
    await client.query('SELECT pg_advisory_xact_lock(4242)');
    const marked = await client.query('INSERT INTO agenda_days (fecha) VALUES ($1) ON CONFLICT DO NOTHING', [fecha]);
    if (marked.rowCount === 0) { // ya generado
      await client.query('ROLLBACK');
      return;
    }

    // Lo que el planificador necesita saber: pacientes (con sus fechas de
    // visita) y las citas que ya existan ese día.
    const { rows: patients } = await client.query(
      `SELECT p.hc, p.nombre, p.nacimiento, p.caso,
              COALESCE(array_agg(v.fecha::text ORDER BY v.fecha) FILTER (WHERE v.fecha IS NOT NULL), '{}') AS fechas
       FROM patients p LEFT JOIN visits v ON v.hc = p.hc
       WHERE p.caso IS NOT NULL
       GROUP BY p.hc`
    );
    const { rows: existing } = await client.query('SELECT hc, medico, hora FROM appointments WHERE fecha = $1', [fecha]);
    const { rows: [{ maxhc }] } = await client.query('SELECT MAX(hc::int) AS maxhc FROM patients');

    const d = new Date();
    const { newPatients, appointments } = planDay({
      fecha, now: { date: today, minutes: d.getHours() * 60 + d.getMinutes() },
      patients, existing, nextHc: (maxhc || 700100) + 1,
    });

    await insertMany(client, 'patients', PATIENT_COLS, newPatients);
    const ids = await insertMany(client, 'appointments', APPT_COLS,
      appointments.map(({ visit, ...a }) => ({ ...a, fecha })), 'RETURNING id, hc');
    const idOf = new Map(ids.map((a) => [a.hc, a.id]));
    const visits = appointments.filter((a) => a.visit).map((a) => ({
      hc: a.hc, appointment_id: idOf.get(a.hc), fecha,
      profesional: a.visit.profesional, prestacion: a.prestacion, data: a.visit.data,
    }));
    await insertMany(client, 'visits', VISIT_COLS, visits);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
