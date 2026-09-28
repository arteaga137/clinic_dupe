// =====================================================================
// routes/appointments.js — la AGENDA
// =====================================================================
// Un Router de Express es un "mini-servidor" con sus propias rutas. En
// index.js lo montamos en '/api/appointments', así que aquí '/' significa
// '/api/appointments' y '/:id' significa '/api/appointments/5', etc.
//
//   GET    /api/appointments?fecha=AAAA-MM-DD   → citas de un día
//   POST   /api/appointments                    → crear una cita
//   PATCH  /api/appointments/:id                → cambiar el estado
// =====================================================================

import { Router } from 'express';
import { db } from '../db.js';
import { HttpError, requireFields } from '../errors.js';
import { todayISO } from '../seed.js';

export const appointmentsRouter = Router();

const STATUSES = ['citado', 'sala', 'consulta', 'atendido'];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const HOUR = /^\d{2}:\d{2}$/;

// Hacemos un JOIN con patients para devolver el nombre y la edad en la misma
// respuesta: así el frontend no tiene que pedir cada paciente por separado.
const SELECT_WITH_PATIENT = `
  SELECT a.id, a.fecha, a.hora, a.ticket, a.nota, a.medico, a.hc,
         a.prestacion, a.status, a.urgente,
         p.nombre, p.nacimiento, p.sociedad
  FROM appointments a
  JOIN patients p ON p.hc = a.hc`;

// SQLite devuelve urgente como 0/1; lo convertimos en booleano real.
const toJSON = (row) => ({ ...row, urgente: Boolean(row.urgente) });

appointmentsRouter.get('/', (req, res) => {
  const fecha = req.query.fecha || todayISO();
  if (!ISO_DATE.test(fecha)) throw new HttpError(400, 'fecha debe tener formato AAAA-MM-DD');

  // Los "?" son parámetros: better-sqlite3 los rellena de forma segura.
  // NUNCA construyas SQL concatenando texto del usuario: eso abre la puerta
  // a "inyección SQL", uno de los ataques más comunes.
  const rows = db.prepare(`${SELECT_WITH_PATIENT} WHERE a.fecha = ? ORDER BY a.hora`).all(fecha);
  res.json(rows.map(toJSON));
});

appointmentsRouter.post('/', (req, res) => {
  const b = req.body;
  requireFields(b, ['fecha', 'hora', 'hc', 'medico', 'prestacion']);
  if (!ISO_DATE.test(b.fecha)) throw new HttpError(400, 'fecha debe tener formato AAAA-MM-DD');
  if (!HOUR.test(b.hora)) throw new HttpError(400, 'hora debe tener formato HH:MM');

  const patient = db.prepare('SELECT hc FROM patients WHERE hc = ?').get(b.hc);
  if (!patient) throw new HttpError(404, `No existe el paciente con HC ${b.hc}`);

  const info = db
    .prepare(
      `INSERT INTO appointments (fecha, hora, ticket, nota, medico, hc, prestacion, urgente)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(b.fecha, b.hora, b.ticket || '', b.nota || '', b.medico, b.hc, b.prestacion, b.urgente ? 1 : 0);

  // lastInsertRowid = el id que SQLite acaba de asignar a la nueva fila.
  const row = db.prepare(`${SELECT_WITH_PATIENT} WHERE a.id = ?`).get(info.lastInsertRowid);
  res.status(201).json(toJSON(row)); // 201 = "Created"
});

appointmentsRouter.patch('/:id', (req, res) => {
  const { status } = req.body ?? {};
  if (!STATUSES.includes(status)) {
    throw new HttpError(400, `status debe ser uno de: ${STATUSES.join(', ')}`);
  }
  const info = db.prepare('UPDATE appointments SET status = ? WHERE id = ?').run(status, req.params.id);
  // `changes` = cuántas filas se modificaron. 0 → ese id no existe.
  if (info.changes === 0) throw new HttpError(404, 'Cita no encontrada');

  const row = db.prepare(`${SELECT_WITH_PATIENT} WHERE a.id = ?`).get(req.params.id);
  res.json(toJSON(row));
});
