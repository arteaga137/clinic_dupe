// =====================================================================
// errors.js — errores con código HTTP
// =====================================================================
// Cuando una ruta detecta un problema (p. ej. "paciente no encontrado")
// lanza un HttpError con el código adecuado. El manejador de errores de
// index.js lo atrapa y responde con ese código y un JSON { error: '...' }.
// Así cada ruta no tiene que repetir `res.status(404).json(...)`.
// =====================================================================

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Lanza un 400 si falta alguno de los campos obligatorios en `body`. */
export function requireFields(body, fields) {
  const missing = fields.filter((f) => body?.[f] === undefined || body[f] === '');
  if (missing.length) throw new HttpError(400, `Faltan campos obligatorios: ${missing.join(', ')}`);
}

/**
 * Traduce errores de PostgreSQL a códigos HTTP. Postgres identifica cada
 * error con un código de 5 caracteres (SQLSTATE). Por ejemplo, la fecha
 * '2026-02-31' pasa nuestra expresión regular, pero Postgres la rechaza:
 * es un error del USUARIO (400), no del servidor (500).
 */
export function fromPgError(err) {
  if (typeof err.code !== 'string') return null;
  if (err.code.startsWith('22')) return new HttpError(400, 'Dato no válido (revisa fechas y formatos)'); // "data exception"
  if (err.code === '23503') return new HttpError(400, 'Referencia a un registro que no existe');       // clave foránea
  if (err.code === '23505') return new HttpError(409, 'Ya existe un registro con ese identificador');  // duplicado
  if (err.code === '23514') return new HttpError(400, 'Valor no permitido');                         // CHECK
  return null;
}
