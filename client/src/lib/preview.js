// =====================================================================
// preview.js — genera la "Vista previa de historia clínica"
// =====================================================================
// Es una FUNCIÓN PURA: recibe datos y devuelve una lista de bloques
// ({ type: 'kv', label, text }, { type: 'table', ... }...). No toca React
// ni el DOM. Eso la hace fácil de entender y de probar, y el componente
// <Preview> solo tiene que "pintar" cada tipo de bloque.
// =====================================================================

import { GRIDS, GRID_ORDER, GENERIC, SECTIONS, TEN_KEYS, EYE_LABEL, eyesOf, gridKey, hasValue } from './fields.js';
import { age, isoToDMY } from './dates.js';

/** Tabla de refracción para la vista previa, o null si está vacía. */
function gridTable(g, d) {
  const def = GRIDS[g];
  const filled = (eye) => def.cols.some((c) => hasValue(d[gridKey(g, eye, c.id)]));
  const eyes = eyesOf(g).filter(filled);
  if (!eyes.length) return null;
  return {
    type: 'table',
    // En el programa real, las "Gafas 1" aparecen como "Corrección Actual".
    label: g === 'cp1' ? 'Corrección Actual' : def.title,
    header: ['', ...def.cols.map((c) => c.l)],
    rows: eyes.map((e) => [EYE_LABEL[e], ...def.cols.map((c) => d[gridKey(g, e, c.id)] || '')]),
  };
}

/** Bloques de UNA visita (guardada o en curso). */
function visitBlocks(v) {
  const d = v.data;
  const has = (k) => hasValue(d[k]);
  const B = [];
  const H = (text) => B.push({ type: 'h', text });
  const KV = (label, text) => B.push({ type: 'kv', label, text });

  B.push({ type: 'date', text: `Fecha: ${v.fechaLabel}` });
  if (v.profesional) B.push({ type: 'plain', text: v.profesional });

  if (has('mot') || v.prestacion) {
    H('Motivo de consulta:');
    if (v.prestacion) B.push({ type: 'sub', text: v.prestacion });
    if (has('mot')) B.push({ type: 'plain', text: d.mot });
  }
  if (has('obs')) KV('Observaciones:', d.obs);
  if (d.derivado) KV('Derivado óptico:', d.derivadoA || 'SÍ');

  // Refracción: el título solo aparece si hay al menos un dato.
  let refTitle = false;
  const needRef = () => { if (!refTitle) { H('Refracción:'); refTitle = true; } };
  if (has('ref_por')) { needRef(); KV('Realizado por:', d.ref_por); }
  for (const g of GRID_ORDER) {
    const t = gridTable(g, d);
    if (t) { needRef(); B.push(t); }
    if (has(`${g}_obs`)) { needRef(); KV(`${GRIDS[g].title} · obs.:`, d[`${g}_obs`]); }
  }
  if (has('obsint')) KV('Observaciones internas:', d.obsint);

  if (TEN_KEYS.some(has)) {
    H('Tensión ocular/Paquimetría:');
    const pair = (a, b, unit) => [has(a) && `OD ${d[a]}`, has(b) && `OI ${d[b]}`].filter(Boolean).join('  ·  ') + unit;
    if (has('ten_ton')) KV('Tonómetro:', d.ten_ton);
    if (has('ten1_od') || has('ten1_oi')) KV('PIO 1:', pair('ten1_od', 'ten1_oi', ' mmHg'));
    if (has('ten1_obs')) KV('Notas PIO 1:', d.ten1_obs);
    if (has('ten2_od') || has('ten2_oi')) KV('PIO 2:', pair('ten2_od', 'ten2_oi', ' mmHg'));
    if (has('ten2_obs')) KV('Notas PIO 2:', d.ten2_obs);
    if (has('dia_od') || has('dia_oi')) KV('Diana:', pair('dia_od', 'dia_oi', has('dia_hora') ? ` (${d.dia_hora})` : ''));
    if (has('paq_od') || has('paq_oi')) KV('Paquimetría:', pair('paq_od', 'paq_oi', ' µm') + (has('paq_fecha') ? ` · ${isoToDMY(d.paq_fecha)}` : ''));
    if (has('paq_obs')) KV('Notas paquimetría:', d.paq_obs);
    if (has('gonio')) KV('Gonioscopia:', d.gonio);
  }

  for (const s of SECTIONS) {
    const fields = GENERIC[s.id];
    if (!fields || !fields.some((f) => has(f.k))) continue;
    H(`${s.label}:`);
    for (const f of fields) if (has(f.k)) KV(`${f.l}:`, d[f.k]);
  }
  return B;
}

/**
 * @param patient  ficha del paciente (con visits)
 * @param form     formulario actual (antecedentes + consulta en curso)
 * @param draft    datos de la consulta en curso que tienen valor
 * @param mode     'all' (F2, todo el historial) | 'last' (F3, última visita)
 */
export function buildPreview({ patient, form, draft, draftMeta, mode }) {
  const B = [];
  const KV = (label, text) => B.push({ type: 'kv', label, text });

  B.push({ type: 'head', text: `PACIENTE: ${patient.nombre}` });
  B.push({ type: 'head', text: `Nº HC: ${patient.hc}` });
  B.push({ type: 'head', text: `FECHA NACIMIENTO: ${isoToDMY(patient.nacimiento)} (${age(patient.nacimiento)} años)` });

  // Antecedentes: se leen del formulario, así se ven en vivo al escribir.
  B.push({ type: 'h', text: 'Antecedentes médicos:' });
  if (form.validar && form.validarTs) KV('Fecha Validar Datos:', form.validarTs);
  if (form.profesion) KV('Profesión:', form.profesion);
  const checks = (pairs) => pairs.filter(([k]) => form[k]).map(([, l]) => l).join(', ');
  const cronicas = checks([['diabetes', 'DIABETES'], ['hta', 'HTA'], ['anticoag', 'ANTICOAGULADO']]);
  if (cronicas) KV('Enf. crónicas:', cronicas);
  const riesgo = checks([['vih', 'VIH'], ['tbc', 'TBC'], ['vhb', 'VHB'], ['vhc', 'VHC']]);
  if (riesgo) KV('Factores de riesgo:', riesgo);
  for (const [k, l] of [['ap', 'Personales:'], ['aof', 'Oftalmológicos:'], ['afam', 'Familiares:'], ['aqx', 'Quirúrgicos:']]) {
    if (hasValue(form[k])) KV(l, form[k]);
  }
  if (hasValue(form.alergias)) KV('Alergias:', form.alergias);
  else if (form.alNoC) KV('Alergias:', 'NO CONOCIDAS');
  for (const [k, l] of [['med', 'Medicación:'], ['medsis', 'Medicación sistémica:'], ['diag', 'Diagnósticos:'], ['opera', 'Opera:']]) {
    if (hasValue(form[k])) KV(l, form[k]);
  }

  // Consulta en curso (sin guardar) arriba del todo.
  if (Object.keys(draft).length) {
    B.push(...visitBlocks({ ...draftMeta, data: draft }));
  }

  const visits = mode === 'last' ? patient.visits.slice(0, 1) : patient.visits;
  for (const v of visits) {
    B.push(...visitBlocks({ ...v, fechaLabel: isoToDMY(v.fecha, '-') }));
  }
  if (!patient.visits.length && !Object.keys(draft).length) {
    B.push({ type: 'plain', text: '\nSin visitas registradas. Rellena la consulta y pulsa Guardar.' });
  }
  return B;
}
