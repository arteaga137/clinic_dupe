// =====================================================================
// helpers.js — piezas comunes para escribir las plantillas clínicas
// =====================================================================
// Las plantillas (templates.js) construyen los datos de cada visita con
// estas funciones pequeñas. Todas devuelven objetos { clave: valor } que
// se combinan con el operador "spread" (...) en un único objeto `data`.
// =====================================================================

export const PROF = {
  'DRA. SANZ': 'Sanz Molina, Laura',
  'DR. MOLINA': 'Molina Pardo, Andrés',
  'OPTOMETRÍA': 'Ortega Gil, Pablo',
};

const AV_VALUES = ['0.05', '0.1', '0.16', '0.2', '0.25', '0.3', '0.4', '0.5', '0.6', '0.7', '0.8', '0.9', '1.0', '1.2'];

/** Número → la opción de agudeza visual más cercana ('0.8', '1.0'...). */
export function av(x) {
  let best = AV_VALUES[0];
  for (const v of AV_VALUES) if (Math.abs(Number(v) - x) < Math.abs(Number(best) - x)) best = v;
  return best;
}
/** Redondea a cuartos de dioptría (así se gradúan las lentes). */
export const q = (x) => Math.round(x * 4) / 4;
/** Dioptrías con signo y 2 decimales: 1.5 → '+1.50', -2 → '-2.00', 0 → '0.00'. */
export const dpt = (x) => (x > 0 ? '+' : '') + q(x).toFixed(2);
/** Excavación papilar E/P como opción del desplegable ('0.1' ... '1.0'). */
export const ep = (x) => Math.min(1, Math.max(0.1, Math.round(x * 10) / 10)).toFixed(1);
export const clamp = (x, min, max) => Math.min(max, Math.max(min, x));

/** Fila por ojo: E('fo', 'ep', '0.7', '0.6') → { fo_ep_od: '0.7', fo_ep_oi: '0.6' } */
export const E = (sec, field, od, oi) => ({ [`${sec}_${field}_od`]: od, [`${sec}_${field}_oi`]: oi });
/** Mismo valor en los dos ojos. */
export const B = (sec, field, value) => E(sec, field, value, value);
/** Valor "afectado" en el ojo enfermo del paciente y "sano" en el otro. */
export const S = (p, sec, field, affected, healthy) =>
  (p.ojo === 'OD' ? E(sec, field, affected, healthy) : E(sec, field, healthy, affected));
export const otro = (ojo) => (ojo === 'OD' ? 'OI' : 'OD');

/** Refracción en una tabla (cp1, man, rx, ciclo...) a partir del perfil del paciente. */
export function refr(p, grid, { avOD, avOI, add = null, esfShift = 0 } = {}) {
  const out = {};
  for (const [eye, a] of [['od', avOD], ['oi', avOI]]) {
    const r = p.refr[eye];
    out[`${grid}_${eye}_esf`] = dpt(r.esf + esfShift);
    if (r.cil !== 0) {
      out[`${grid}_${eye}_cil`] = dpt(r.cil);
      out[`${grid}_${eye}_eje`] = String(r.eje);
    }
    if (a !== undefined) out[`${grid}_${eye}_av`] = av(a);
    if (add) out[`${grid}_${eye}_add`] = dpt(add);
  }
  return out;
}

/** Autorrefractómetro: parecido a la refracción, con pequeñas diferencias. */
export function auto(p, r) {
  const out = {};
  for (const eye of ['od', 'oi']) {
    const x = p.refr[eye];
    out[`auto_${eye}_esf`] = dpt(x.esf + r.pick([0, -0.25, 0.25]));
    out[`auto_${eye}_cil`] = dpt(x.cil - r.pick([0, 0.25]));
    out[`auto_${eye}_eje`] = String((x.eje + r.int(-5, 5) + 180) % 180 || 180);
  }
  return out;
}

/** Agudeza visual de lejos sin corrección. */
export const avsc = (od, oi) => ({ avl_od_esp: av(od), avl_oi_esp: av(oi) });

/** Tensión ocular (PIO) con el tonómetro indicado. */
export const pio = (od, oi, ton = 'Aire (NCT)') => ({ ten_ton: ton, ten1_od: String(Math.round(od)), ten1_oi: String(Math.round(oi)) });

/** Biomicroscopía sin hallazgos, con el cristalino que se indique. */
export const bmcNormal = (cristOD = 'Transparente', cristOI = cristOD) => ({
  ...B('bmc', 'parp', 'Normales'), ...B('bmc', 'conj', 'Normal'), ...B('bmc', 'cornea', 'Transparente'),
  ...B('bmc', 'ca', 'Formada y profunda'), ...E('bmc', 'crist', cristOD, cristOI),
});

/** Fondo de ojo normal (se pueden sobrescribir campos después con spread). */
export const foNormal = (r, epOD = 0.3, epOI = epOD) => ({
  fo_dil: r.pick(['No', 'Tropicamida 1%']), fo_met: r.pick(['Lente 90D', 'Lente 78D']),
  ...B('fo', 'pap', 'Bordes nítidos, coloración normal'), ...E('fo', 'ep', ep(epOD), ep(epOI)),
  ...B('fo', 'mac', 'Brillo foveal conservado'), ...B('fo', 'vas', 'Normales'),
});

/** Bloque de diagnóstico y plan. */
export const dx = (texto, cie, ojo, extra = {}) => ({ dx_dx: texto, dx_cie: cie, dx_ojo: ojo, ...extra });

/** Edad cumplida en una fecha dada. */
export function ageAt(birthISO, dateISO) {
  const [y, m, d] = birthISO.split('-').map(Number);
  const [Y, M, D] = dateISO.split('-').map(Number);
  let a = Y - y;
  if (M < m || (M === m && D < d)) a--;
  return a;
}
