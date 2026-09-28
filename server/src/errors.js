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

/** Convierte un texto JSON guardado en la BD en objeto, sin romper si está mal. */
export function parseJSON(text, fallback = {}) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}
