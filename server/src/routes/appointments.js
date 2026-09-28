// =====================================================================
// routes/appointments.js — la AGENDA
// =====================================================================
// Un Router de Express es un "mini-servidor" con sus propias rutas. En
// app.js lo montamos en '/api/appointments', así que aquí '/' significa
// '/api/appointments' y '/:id' significa '/api/appointments/5', etc.
//
//   GET    /api/appointments?fecha=AAAA-MM-DD   → citas de un día
//   POST   /api/appointments                    → crear una cita
//   PATCH  /api/appointments/:id                → cambiar el estado
//
// Todas las rutas son `async`: esperan (`await`) a que Postgres responda.
// Express 5 captura automáticamente los errores de las funciones async y
// los manda al manejador de errores de app.js.
// =====================================================================

import { Router } from 'express';
import { query, queryOne } from '../db.js';
import { HttpError, requireFields } from '../errors.js';
import { todayISO } from '../seed.js';

export const appointmentsRouter = Router();

const STATUSES = ['citado', 'sala', 'consulta', 'atendido'];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const HOUR = /^\d{2}:\d{2}$/;

// JOIN con patients para devolver nombre y nacimiento en la misma respuesta:
// así el frontend no tiene que pedir cada paciente por separado.
const SELECT_WITH_PATIENT = `
  SELECT a.id, a.fecha, a.hora, a.ticket, a.nota, a.medico, a.hc,
         a.prestacion, a.status, a.urgente,
         p.nombre, p.nacimiento, p.sociedad
  FROM appointments a
  JOIN patients p ON p.hc = a.hc`;

/** Valida que el id de la URL sea un número entero positivo. */
function parseId(raw) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'id de cita no válido');
  return id;
}

appointmentsRouter.get('/', async (req, res) => {
  const fecha = req.query.fecha || todayISO();
  if (!ISO_DATE.test(fecha)) throw new HttpError(400, 'fecha debe tener formato AAAA-MM-DD');

  // $1 es un PARÁMETRO: pg envía el valor por separado del SQL. NUNCA
  // construyas SQL pegando texto del usuario: eso permite "inyección SQL",
  // uno de los ataques más comunes.
  const rows = await query(`${SELECT_WITH_PATIENT} WHERE a.fecha = $1 ORDER BY a.hora`, [fecha]);
  res.json(rows);
});

appointmentsRouter.post('/', async (req, res) => {
  const b = req.body;
  requireFields(b, ['fecha', 'hora', 'hc', 'medico', 'prestacion']);
  if (!ISO_DATE.test(b.fecha)) throw new HttpError(400, 'fecha debe tener formato AAAA-MM-DD');
  if (!HOUR.test(b.hora)) throw new HttpError(400, 'hora debe tener formato HH:MM');

  const patient = await queryOne('SELECT hc FROM patients WHERE hc = $1', [b.hc]);
  if (!patient) throw new HttpError(404, `No existe el paciente con HC ${b.hc}`);

  // RETURNING id: Postgres nos devuelve el id que acaba de asignar.
  const { id } = await queryOne(
    `INSERT INTO appointments (fecha, hora, ticket, nota, medico, hc, prestacion, urgente)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [b.fecha, b.hora, b.ticket || '', b.nota || '', b.medico, b.hc, b.prestacion, Boolean(b.urgente)]
  );
  const row = await queryOne(`${SELECT_WITH_PATIENT} WHERE a.id = $1`, [id]);
  res.status(201).json(row); // 201 = "Created"
});

appointmentsRouter.patch('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  const { status } = req.body ?? {};
  if (!STATUSES.includes(status)) {
    throw new HttpError(400, `status debe ser uno de: ${STATUSES.join(', ')}`);
  }
  const updated = await queryOne('UPDATE appointments SET status = $1 WHERE id = $2 RETURNING id', [status, id]);
  // Si no devolvió ninguna fila, ese id no existe.
  if (!updated) throw new HttpError(404, 'Cita no encontrada');

  res.json(await queryOne(`${SELECT_WITH_PATIENT} WHERE a.id = $1`, [id]));
});
