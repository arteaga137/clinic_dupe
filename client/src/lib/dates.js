// Utilidades de fechas. La BD guarda fechas ISO (AAAA-MM-DD) porque se
// ordenan bien como texto; en pantalla las mostramos al estilo español.

const pad = (n) => String(n).padStart(2, '0');

/** Date → 'AAAA-MM-DD' (en hora local, no UTC). */
export function toISO(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 'AAAA-MM-DD' → 'DD/MM/AAAA' (o con otro separador). */
export function isoToDMY(iso, sep = '/') {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return [d, m, y].join(sep);
}

/** Suma (o resta) días a una fecha ISO. */
export function addDays(iso, days) {
  const [y, m, d] = iso.split('-').map(Number);
  return toISO(new Date(y, m - 1, d + days));
}

/** 'AAAA-MM-DD' → 'lunes, 28 de septiembre de 2026'. */
export function longDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

/** Edad en años a partir de la fecha de nacimiento ISO. */
export function age(isoBirth) {
  if (!isoBirth) return '';
  const [y, m, d] = isoBirth.split('-').map(Number);
  const t = new Date();
  let a = t.getFullYear() - y;
  // Si aún no ha cumplido años este año, restamos uno.
  if (t.getMonth() + 1 < m || (t.getMonth() + 1 === m && t.getDate() < d)) a--;
  return a;
}

/** 'DD/MM/AAAA HH:MM:SS' del momento actual (para "Validar datos"). */
export function nowStamp() {
  const d = new Date();
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
