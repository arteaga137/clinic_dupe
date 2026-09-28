// =====================================================================
// routes/patients.js — PACIENTES e HISTORIA CLÍNICA
// =====================================================================
//   GET  /api/patients?q=texto            → buscar por nombre o nº de HC
//   POST /api/patients                    → alta de paciente nuevo
//   GET  /api/patients/:hc                → ficha + antecedentes + visitas
//   PUT  /api/patients/:hc                → editar nombre, nacimiento, sociedad, mutua
//   PUT  /api/patients/:hc/antecedentes   → guardar antecedentes médicos
//   POST /api/patients/:hc/visits         → guardar una consulta
//
// Nota sobre JSONB: al LEER, pg ya convierte las columnas JSONB en objetos
// de JavaScript (no hace falta JSON.parse). Al ESCRIBIR, pasamos el objeto
// con JSON.stringify para que Postgres reciba texto JSON válido.
// =====================================================================

import { Router } from 'express';
import { query, queryOne, withTransaction } from '../db.js';
import { HttpError, requireFields } from '../errors.js';
import { todayISO } from '../seed.js';

export const patientsRouter = Router();

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Busca un paciente o lanza 404. Lo usan varias rutas. */
async function getPatientOr404(hc) {
  const p = await queryOne('SELECT * FROM patients WHERE hc = $1', [hc]);
  if (!p) throw new HttpError(404, `No existe el paciente con HC ${hc}`);
  return p;
}

function getVisits(hc) {
  // Orden descendente: la visita más reciente primero (como "F3-Última visita").
  return query('SELECT * FROM visits WHERE hc = $1 ORDER BY fecha DESC, id DESC', [hc]);
}

/** Comprueba que el valor sea un objeto plano ({...}), no un array ni texto. */
function assertPlainObject(value, name) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpError(400, `${name} debe ser un objeto JSON`);
  }
}

patientsRouter.get('/', async (req, res) => {
  const q = (req.query.q || '').trim();
  // ILIKE = LIKE sin distinguir mayúsculas/minúsculas (propio de Postgres).
  // '%texto%' busca el texto en cualquier parte del nombre o del HC.
  // ::int convierte el COUNT (que Postgres da como número muy grande,
  // y pg como texto) en un entero normal.
  const rows = await query(
    `SELECT p.hc, p.nombre, p.nacimiento, p.sociedad,
            (SELECT COUNT(*)::int FROM visits v WHERE v.hc = p.hc) AS num_visitas
     FROM patients p
     WHERE p.nombre ILIKE $1 OR p.hc ILIKE $1
     ORDER BY p.nombre`,
    [`%${q}%`]
  );
  res.json(rows);
});

patientsRouter.post('/', async (req, res) => {
  const b = req.body;
  requireFields(b, ['nombre', 'nacimiento']);
  if (!ISO_DATE.test(b.nacimiento)) throw new HttpError(400, 'nacimiento debe ser AAAA-MM-DD');

  // Nuevo nº de HC = el mayor existente + 1. `hc::int` lo compara como número.
  const { maxhc } = await queryOne('SELECT MAX(hc::int) AS maxhc FROM patients');
  const hc = String((maxhc || 700100) + 1);

  await query(
    'INSERT INTO patients (hc, nombre, nacimiento, sociedad, mutua) VALUES ($1, $2, $3, $4, $5)',
    [hc, b.nombre.trim(), b.nacimiento, b.sociedad || 'PRIVADO', b.mutua || '']
  );
  res.status(201).json(await getPatientOr404(hc));
});

patientsRouter.get('/:hc', async (req, res) => {
  const patient = await getPatientOr404(req.params.hc);
  res.json({ ...patient, visits: await getVisits(patient.hc) });
});

// Editar los datos generales. El nº de HC NO se puede cambiar: es la clave
// primaria y lo usan las citas y visitas para enlazarse con el paciente.
// La EDAD tampoco se guarda: se calcula a partir de la fecha de nacimiento
// (si la guardáramos, dejaría de ser correcta en el siguiente cumpleaños).
patientsRouter.put('/:hc', async (req, res) => {
  const current = await getPatientOr404(req.params.hc);
  const b = req.body ?? {};
  // Si un campo no viene en la petición, se conserva el valor actual.
  const next = {
    nombre: String(b.nombre ?? current.nombre).trim(),
    nacimiento: b.nacimiento ?? current.nacimiento,
    sociedad: b.sociedad ?? current.sociedad,
    mutua: b.mutua ?? current.mutua,
  };
  if (!next.nombre) throw new HttpError(400, 'El nombre no puede estar vacío');
  if (!ISO_DATE.test(next.nacimiento)) throw new HttpError(400, 'nacimiento debe ser AAAA-MM-DD');
  if (next.nacimiento > todayISO()) throw new HttpError(400, 'La fecha de nacimiento no puede ser futura');

  const updated = await queryOne(
    `UPDATE patients SET nombre = $1, nacimiento = $2, sociedad = $3, mutua = $4
     WHERE hc = $5 RETURNING *`,
    [next.nombre, next.nacimiento, next.sociedad, next.mutua, current.hc]
  );
  res.json(updated);
});

patientsRouter.put('/:hc/antecedentes', async (req, res) => {
  await getPatientOr404(req.params.hc);
  assertPlainObject(req.body, 'El cuerpo');
  const updated = await queryOne(
    'UPDATE patients SET antecedentes = $1 WHERE hc = $2 RETURNING *',
    [JSON.stringify(req.body), req.params.hc]
  );
  res.json(updated);
});

// Guardar una consulta hace TRES cosas que deben ir juntas:
//   1. actualizar los antecedentes (si vienen)
//   2. insertar la visita
//   3. marcar la cita como "atendido"
// Por eso van en una transacción: si una falla, no se aplica ninguna.
patientsRouter.post('/:hc/visits', async (req, res) => {
  const hc = req.params.hc;
  await getPatientOr404(hc);

  const { data = {}, antecedentes, appointmentId = null, profesional = '', prestacion = '' } = req.body ?? {};
  // La fecha de la visita es opcional (por defecto, hoy). Permite registrar
  // una consulta de otro día, como el campo FECHA del programa real.
  const fecha = req.body?.fecha || todayISO();
  if (!ISO_DATE.test(fecha)) throw new HttpError(400, 'fecha debe ser AAAA-MM-DD');
  if (appointmentId !== null && !Number.isInteger(appointmentId)) throw new HttpError(400, 'appointmentId debe ser un número');
  assertPlainObject(data, 'data');
  if (antecedentes !== undefined) assertPlainObject(antecedentes, 'antecedentes');
  const hasData = Object.keys(data).length > 0;
  if (!hasData && antecedentes === undefined) {
    throw new HttpError(400, 'No hay datos de consulta que guardar');
  }

  // `client` es la conexión de la transacción: todas las consultas de
  // dentro deben usarla (no `query`, que podría coger otra conexión).
  const visitId = await withTransaction(async (client) => {
    if (antecedentes !== undefined) {
      await client.query('UPDATE patients SET antecedentes = $1 WHERE hc = $2', [JSON.stringify(antecedentes), hc]);
    }
    if (!hasData) return null;

    const { rows } = await client.query(
      `INSERT INTO visits (hc, appointment_id, fecha, profesional, prestacion, data)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [hc, appointmentId, fecha, profesional, prestacion, JSON.stringify(data)]
    );
    if (appointmentId) {
      // Solo marcamos la cita si pertenece a ESTE paciente (evita errores).
      await client.query("UPDATE appointments SET status = 'atendido' WHERE id = $1 AND hc = $2", [appointmentId, hc]);
    }
    return rows[0].id;
  });

  // Devolvemos la ficha completa actualizada: el frontend la pinta tal cual.
  const patient = await getPatientOr404(hc);
  res.status(201).json({ visitId, patient: { ...patient, visits: await getVisits(hc) } });
});
