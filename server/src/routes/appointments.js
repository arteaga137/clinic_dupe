// =====================================================================
// routes/appointments.js — la AGENDA
// =====================================================================
// Un Router de Express es un "mini-servidor" con sus propias rutas. En
// app.js lo montamos en '/api/appointments', así que aquí '/' significa
// '/api/appointments' y '/:id' significa '/api/appointments/5', etc.
//
//   GET    /api/appointments?fecha=AAAA-MM-DD   → citas de un día
//   POST   /api/appointments                    → crear una cita
//   PATCH  /api/appointments/:id                → cambiar estado, o MOVER la cita
//                                                 (fecha, hora, médico, nota)
//   DELETE /api/appointments/:id                → anular una cita
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

/**
 * ¿Ese médico ya tiene una cita ese día a esa hora? Devuelve la cita que
 * choca (o undefined). `exceptId` excluye la propia cita cuando la movemos.
 * La comprobación se hace en el servidor, no solo en el navegador: el
 * servidor es la única fuente de verdad (el navegador se puede saltar).
 */
async function findClash({ fecha, hora, medico }, exceptId = null) {
  return queryOne(
    `SELECT a.id, p.nombre FROM appointments a JOIN patients p ON p.hc = a.hc
     WHERE a.fecha = $1 AND a.hora = $2 AND a.medico = $3 AND ($4::int IS NULL OR a.id <> $4)`,
    [fecha, hora, medico, exceptId]
  );
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
  const clash = await findClash(b);
  // 409 = "Conflict": la petición es correcta, pero choca con el estado actual.
  if (clash) throw new HttpError(409, `${b.medico} ya tiene una cita a las ${b.hora} (${clash.nombre})`);

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
  const b = req.body ?? {};
  const current = await queryOne('SELECT * FROM appointments WHERE id = $1', [id]);
  if (!current) throw new HttpError(404, 'Cita no encontrada');

  // Partimos de la cita actual y aplicamos solo lo que venga en la petición.
  const next = {
    fecha: b.fecha ?? current.fecha,
    hora: b.hora ?? current.hora,
    medico: b.medico ?? current.medico,
    nota: b.nota ?? current.nota,
    status: b.status ?? current.status,
  };
  if (!STATUSES.includes(next.status)) throw new HttpError(400, `status debe ser uno de: ${STATUSES.join(', ')}`);
  if (!ISO_DATE.test(next.fecha)) throw new HttpError(400, 'fecha debe tener formato AAAA-MM-DD');
  if (!HOUR.test(next.hora)) throw new HttpError(400, 'hora debe tener formato HH:MM');

  // ¿Se está MOVIENDO la cita (otro día, hora o médico)?
  const moving = next.fecha !== current.fecha || next.hora !== current.hora || next.medico !== current.medico;
  if (moving) {
    if (current.status === 'atendido') throw new HttpError(409, 'No se puede mover una cita ya atendida');
    const clash = await findClash(next, id);
    if (clash) throw new HttpError(409, `${next.medico} ya tiene una cita el ${next.fecha} a las ${next.hora} (${clash.nombre})`);
    // Si cambia de día, el paciente ya no está "en sala": vuelve a "citado".
    if (next.fecha !== current.fecha && b.status === undefined) next.status = 'citado';
  }

  await query(
    'UPDATE appointments SET fecha = $1, hora = $2, medico = $3, nota = $4, status = $5 WHERE id = $6',
    [next.fecha, next.hora, next.medico, next.nota, next.status, id]
  );
  res.json(await queryOne(`${SELECT_WITH_PATIENT} WHERE a.id = $1`, [id]));
});

appointmentsRouter.delete('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  const cita = await queryOne('SELECT status FROM appointments WHERE id = $1', [id]);
  if (!cita) throw new HttpError(404, 'Cita no encontrada');
  // Una cita atendida tiene una visita enlazada: no se borra, es historia clínica.
  if (cita.status === 'atendido') throw new HttpError(409, 'No se puede anular una cita ya atendida');
  await query('DELETE FROM appointments WHERE id = $1', [id]);
  res.status(204).end(); // 204 = "No Content": hecho, y no hay nada que devolver
});
