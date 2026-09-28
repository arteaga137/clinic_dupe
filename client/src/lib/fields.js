// =====================================================================
// fields.js — la "estructura" de la historia clínica, descrita como DATOS
// =====================================================================
// En lugar de escribir a mano cientos de <input>, describimos las tablas y
// secciones aquí. Los componentes leen estas descripciones y generan los
// campos. Si mañana quieres añadir una columna "DNP" a la refracción, solo
// añades una línea en GRIDS y aparece en el formulario, en la vista previa
// y se guarda en la BD, sin tocar nada más.
//
// Cada campo tiene una CLAVE única (p. ej. 'man_od_esf' = Manifiesta, ojo
// derecho, esfera). El formulario entero es un objeto { clave: valor }.
// =====================================================================

import { SECTION_FORMS, sectionKeys } from './sectionForms.js';

// ---------- listas de opciones de los desplegables ----------
export const AV_OPTIONS = ['', '0.05', '0.1', '0.16', '0.2', '0.25', '0.3', '0.4', '0.5', '0.6', '0.7', '0.8', '0.9', '1.0', '1.2', 'CD', 'MM', 'PL', 'NPL'];
export const JAEGER_OPTIONS = ['', 'J1', 'J2', 'J3', 'J4', 'J5', 'J6', 'J7', 'J8'];
export const MEDICOS = ['DRA. SANZ', 'DR. MOLINA', 'OPTOMETRÍA'];
export const PROFESIONALES = ['Rodrigues de Ortiz, Aaron Alessandro', 'Sanz Molina, Laura','Molina Pardo, Andrés', 'Ortega Gil, Pablo', 'Ruiz Nieto, Elena'];
export const PROFESIONES = ['', 'Empleado/a', 'Autónomo/a', 'Estudiante', 'Jubilado/a', 'Desempleado/a', 'Otra'];
export const TONOMETROS = ['', 'Goldmann', 'Aire (NCT)', 'iCare', 'Perkins', 'Tono-Pen'];
export const OPTICAS = ['', 'Óptica Centro', 'Óptica Norte', 'Óptica Sur', 'Otra óptica'];
export const SOCIEDADES = ['PRIVADO', 'SANITAS, S.A.', 'DKV SEGUROS, S.A.', 'SEGUR CAIXA ADESLAS', 'ASISA, S.A.', 'MAPFRE ESPAÑA, CIA.'];
export const PRESTACIONES = ['PRIMERA CONSULTA', 'REVISIÓN', 'CONSULTA URGENCIAS', 'REVISIÓN POSTOPERATORIA', 'LÁSER ARGÓN', 'PREVIO CATARATA', 'PREVIO REFRACTIVA', 'NOTA MÉDICA'];

// ---------- secciones del acordeón (en el orden del programa real) ----------
export const SECTIONS = [
  { id: 'ant', label: 'Antecedentes médicos' },
  { id: 'mot', label: 'Motivo de consulta' },
  { id: 'ref', label: 'Refracción' },
  { id: 'ten', label: 'Tensión ocular/Paquimetría' },
  { id: 'mo', label: 'Motilidad ocular' },
  { id: 'bmc', label: 'BMC anterior' },
  { id: 'fo', label: 'Fondo de ojo' },
  { id: 'dx', label: 'Diagnóstico y TTO' },
  { id: 'oct', label: 'OCT' },
  { id: 'ang', label: 'Angiografía' },
  { id: 'camp', label: 'Campimetría' },
  { id: 'topo', label: 'Topografía' },
  { id: 'eco', label: 'Ecografía' },
  { id: 'bio', label: 'Biometría' },
  { id: 'rec', label: 'Recuento' },
  { id: 'orb', label: 'Órbita párpados' },
  { id: 'ocp', label: 'Oculoplastia' },
  { id: 'est', label: 'Estética' },
];

// ---------- tablas de refracción ----------
// t: tipo de celda → 'inp' (texto), 'av' (agudeza visual), 'j' (Jaeger)
// ao: 1 → esa columna también existe en la fila A.O. (ambos ojos)
const FULL = [
  { id: 'esf', l: 'Esfera', t: 'inp' }, { id: 'cil', l: 'Cilindro', t: 'inp' }, { id: 'eje', l: 'Eje', t: 'inp' },
  { id: 'av', l: 'Av', t: 'av', ao: 1 }, { id: 'ce', l: 'con Eº', t: 'av', ao: 1 },
  { id: 'add', l: 'Adición', t: 'inp' }, { id: 'esfvp', l: 'Esf VP', t: 'inp' }, { id: 'avc', l: 'A.V.C.', t: 'av', ao: 1 },
  { id: 'pri', l: 'Prisma', t: 'inp' }, { id: 'base', l: 'Base', t: 'inp' }, { id: 'eje2', l: 'Eje', t: 'inp' },
];
const SCE = [{ id: 'esf', l: 'Esfera', t: 'inp' }, { id: 'cil', l: 'Cilindro', t: 'inp' }, { id: 'eje', l: 'Eje', t: 'inp' }];

export const GRIDS = {
  avl: { title: 'Av. Lejos sin corrección', cols: [{ id: 'esp', l: 'Esp.', t: 'av', ao: 1 }, { id: 'ce', l: 'con Eº', t: 'av', ao: 1 }], ao: true, obs: true },
  avc: { title: 'Av. Cerca sin corrección', cols: [{ id: 'esp', l: 'Esp.', t: 'j', ao: 1 }], ao: true, obs: true },
  auto: { title: 'Auto', cols: SCE, obs: true },
  ciclo: { title: 'Ciclo', cols: SCE, obs: true },
  ker: { title: 'Queratometría', cols: [{ id: 'k1', l: 'K1', t: 'inp' }, { id: 'e1', l: 'Eje1', t: 'inp' }, { id: 'k2', l: 'K2', t: 'inp' }, { id: 'e2', l: 'Eje2', t: 'inp' }, { id: 'ast', l: 'Astigma', t: 'inp' }, { id: 'eje', l: 'Eje', t: 'inp' }] },
  cp1: { title: 'Corrección previa · Gafas 1', cols: FULL, obs: true },
  cp2: { title: 'Corrección previa · Gafas 2', cols: FULL, obs: true },
  cp3: { title: 'Corrección previa · Gafas 3', cols: FULL, obs: true },
  man: { title: 'Manifiesta', cols: FULL, ao: true, obs: true },
  rx: { title: 'Receta de gafas', cols: FULL, obs: true },
  rcc: { title: 'Refracción con ciclo', cols: FULL, ao: true, obs: true },
  rcr: { title: 'Retinoscopia', cols: FULL, ao: true, obs: true },
  rcq: { title: 'Refracción quirúrgica', cols: FULL, ao: true, obs: true },
  rca: { title: 'Refracción CAP', cols: FULL, ao: true, obs: true },
};
export const GRID_ORDER = Object.keys(GRIDS);

export const eyesOf = (gridId) => (GRIDS[gridId].ao ? ['od', 'oi', 'ao'] : ['od', 'oi']);
export const EYE_LABEL = { od: 'O.D.', oi: 'O.I.', ao: 'A.O.' };
/** Clave de una celda: gridKey('man', 'od', 'esf') → 'man_od_esf'. */
export const gridKey = (g, eye, col) => `${g}_${eye}_${col}`;

// ---------- secciones de exploración y pruebas ----------
// Sus campos se describen en sectionForms.js. Aquí solo reunimos las claves.
export { SECTION_FORMS } from './sectionForms.js';
const STRUCTURED = Object.keys(SECTION_FORMS).map(sectionKeys);

// ---------- listas de claves ----------
// Antecedentes: pertenecen al PACIENTE (se mantienen entre visitas).
export const ANT_KEYS = ['profesion', 'validar', 'validarTs', 'diabetes', 'hta', 'anticoag', 'vih', 'tbc', 'vhb', 'vhc', 'ap', 'aof', 'afam', 'aqx', 'alergias', 'alNoC', 'alAct', 'med', 'medsis', 'diag', 'opera'];
export const TEN_KEYS = ['ten_ton', 'ten1_od', 'ten1_oi', 'ten1_obs', 'ten2_od', 'ten2_oi', 'ten2_obs', 'dia_od', 'dia_oi', 'dia_hora', 'paq_od', 'paq_oi', 'paq_obs', 'paq_fecha', 'gonio'];
const BOOL_KEYS = new Set([
  'validar', 'diabetes', 'hta', 'anticoag', 'vih', 'tbc', 'vhb', 'vhc', 'alNoC', 'alAct', 'derivado',
  ...STRUCTURED.flatMap((s) => s.bools), // casillas de las secciones (p. ej. "Consentimiento firmado")
]);

// flatMap = map + aplanar: convierte listas de listas en una sola lista.
const GRID_KEYS = GRID_ORDER.flatMap((g) => [
  ...eyesOf(g).flatMap((e) => GRIDS[g].cols.map((c) => gridKey(g, e, c.id))),
  ...(GRIDS[g].obs ? [`${g}_obs`] : []),
]);
const SECTION_KEYS = STRUCTURED.flatMap((s) => s.keys);

// Consulta: pertenecen a la VISITA de hoy (se vacían al guardar).
export const CONSULT_KEYS = ['mot', 'obs', 'derivado', 'derivadoA', 'ref_por', 'obsint', ...TEN_KEYS, ...GRID_KEYS, ...SECTION_KEYS];

/** ¿Tiene contenido este valor? ('' , false, null y undefined → no). */
export const hasValue = (v) => v !== '' && v !== false && v !== null && v !== undefined;

/**
 * Formulario vacío con TODAS las claves definidas. Es importante: en React,
 * un <input> cuyo value pasa de undefined a texto da un aviso ("uncontrolled
 * to controlled"). Inicializando todo a '' o false lo evitamos.
 */
export function emptyForm() {
  const f = {};
  for (const k of [...ANT_KEYS, ...CONSULT_KEYS]) f[k] = BOOL_KEYS.has(k) ? false : '';
  f.alAct = true;
  return f;
}

/** Copia solo las claves indicadas (y, opcionalmente, solo las que tienen valor). */
export function pick(obj, keys, onlyFilled = false) {
  const out = {};
  for (const k of keys) if (!onlyFilled || hasValue(obj[k])) out[k] = obj[k];
  return out;
}
