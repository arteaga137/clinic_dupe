// =====================================================================
// routes/patients.js — PACIENTES e HISTORIA CLÍNICA
// =====================================================================
//   GET  /api/patients?q=texto            → buscar por nombre o nº de HC
//   POST /api/patients                    → alta de paciente nuevo
//   GET  /api/patients/:hc                → ficha + antecedentes + visitas
//   PUT  /api/patients/:hc/antecedentes   → guardar antecedentes médicos
//   POST /api/patients/:hc/visits         → guardar una consulta
// =====================================================================

import { Router } from 'express';
import { db } from '../db.js';
import { HttpError, requireFields, parseJSON } from '../errors.js';
import { todayISO } from '../seed.js';

export const patientsRouter = Router();

/** Busca un paciente o lanza 404. Lo usan varias rutas. */
function getPatientOr404(hc) {
  const p = db.prepare('SELECT * FROM patients WHERE hc = ?').get(hc);
  if (!p) throw new HttpError(404, `No existe el paciente con HC ${hc}`);
  return { ...p, antecedentes: parseJSON(p.antecedentes) };
}

function getVisits(hc) {
  // Orden descendente: la visita más reciente primero (como "F3-Última visita").
  return db
    .prepare('SELECT * FROM visits WHERE hc = ? ORDER BY fecha DESC, id DESC')
    .all(hc)
    .map((v) => ({ ...v, data: parseJSON(v.data) }));
}

/** Comprueba que el cuerpo sea un objeto plano ({...}), no un array ni texto. */
function assertPlainObject(value, name) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpError(400, `${name} debe ser un objeto JSON`);
  }
}

patientsRouter.get('/', (req, res) => {
  const q = (req.query.q || '').trim();
  // LIKE '%texto%' busca el texto en cualquier parte. El texto va como
  // parámetro (?), nunca pegado dentro del SQL.
  const like = `%${q}%`;
  const rows = db
    .prepare(
      `SELECT p.hc, p.nombre, p.nacimiento, p.sociedad,
              (SELECT COUNT(*) FROM visits v WHERE v.hc = p.hc) AS num_visitas
       FROM patients p
       WHERE p.nombre LIKE ? OR p.hc LIKE ?
       ORDER BY p.nombre`
    )
    .all(like, like);
  res.json(rows);
});

patientsRouter.post('/', (req, res) => {
  const b = req.body;
  requireFields(b, ['nombre', 'nacimiento']);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.nacimiento)) throw new HttpError(400, 'nacimiento debe ser AAAA-MM-DD');

  // Nuevo nº de HC = el mayor existente + 1. MAX(CAST(...)) compara como número.
  const { maxHc } = db.prepare('SELECT MAX(CAST(hc AS INTEGER)) AS maxHc FROM patients').get();
  const hc = String((maxHc || 700100) + 1);

  db.prepare(
    'INSERT INTO patients (hc, nombre, nacimiento, sociedad, mutua) VALUES (?, ?, ?, ?, ?)'
  ).run(hc, b.nombre.trim(), b.nacimiento, b.sociedad || 'PRIVADO', b.mutua || '');

  res.status(201).json(getPatientOr404(hc));
});

patientsRouter.get('/:hc', (req, res) => {
  const patient = getPatientOr404(req.params.hc);
  res.json({ ...patient, visits: getVisits(patient.hc) });
});

patientsRouter.put('/:hc/antecedentes', (req, res) => {
  getPatientOr404(req.params.hc);
  assertPlainObject(req.body, 'El cuerpo');
  db.prepare('UPDATE patients SET antecedentes = ? WHERE hc = ?').run(JSON.stringify(req.body), req.params.hc);
  res.json(getPatientOr404(req.params.hc));
});

// Guardar una consulta hace TRES cosas que deben ir juntas:
//   1. insertar la visita
//   2. actualizar los antecedentes (si vienen)
//   3. marcar la cita como "atendido"
// Por eso van en una transacción: si una falla, no se aplica ninguna.
patientsRouter.post('/:hc/visits', (req, res) => {
  const hc = req.params.hc;
  getPatientOr404(hc);

  const { data = {}, antecedentes, appointmentId = null, profesional = '', prestacion = '' } = req.body ?? {};
  assertPlainObject(data, 'data');
  if (antecedentes !== undefined) assertPlainObject(antecedentes, 'antecedentes');
  if (Object.keys(data).length === 0 && antecedentes === undefined) {
    throw new HttpError(400, 'No hay datos de consulta que guardar');
  }

  const save = db.transaction(() => {
    if (antecedentes !== undefined) {
      db.prepare('UPDATE patients SET antecedentes = ? WHERE hc = ?').run(JSON.stringify(antecedentes), hc);
    }
    let visitId = null;
    if (Object.keys(data).length > 0) {
      visitId = db
        .prepare(
          `INSERT INTO visits (hc, appointment_id, fecha, profesional, prestacion, data)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
        .run(hc, appointmentId, todayISO(), profesional, prestacion, JSON.stringify(data)).lastInsertRowid;

      if (appointmentId) {
        // Solo marcamos la cita si pertenece a ESTE paciente (evita errores).
        db.prepare("UPDATE appointments SET status = 'atendido' WHERE id = ? AND hc = ?").run(appointmentId, hc);
      }
    }
    return visitId;
  });

  const visitId = save();
  // Devolvemos la ficha completa actualizada: el frontend la pinta tal cual.
  res.status(201).json({ visitId, patient: { ...getPatientOr404(hc), visits: getVisits(hc) } });
});
