// =====================================================================
// Test de COHERENCIA de los datos de práctica (no necesita base de datos)
// =====================================================================
// Los casos clínicos (seedData.js) están escritos a mano, así que es fácil
// equivocarse: una clave mal escrita ('fo_papila' en vez de 'fo_pap') o un
// valor que no existe en un desplegable ('Tropicamida 1 %' con espacio).
// El formulario no lo mostraría y no daría ningún error: fallaría en
// silencio. Este test compara los datos con la definición de los campos
// del FRONTEND (client/src/lib), que es la "fuente de verdad".
// =====================================================================
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CASES } from '../src/seedData.js';
import { buildSeed } from '../src/seed.js';
import {
  CONSULT_KEYS, ANT_KEYS, GRIDS, eyesOf, gridKey, AV_OPTIONS, JAEGER_OPTIONS, TONOMETROS, PROFESIONES,
  PROFESIONALES, MEDICOS, PRESTACIONES, SOCIEDADES, OPTICAS,
} from '../../client/src/lib/fields.js';
import { SECTION_FORMS, fieldKey, eyeKey } from '../../client/src/lib/sectionForms.js';

// Mapa clave → opciones permitidas, solo para los campos que son desplegables.
const OPTIONS = { ten_ton: TONOMETROS, profesion: PROFESIONES, ref_por: PROFESIONALES, derivadoA: OPTICAS };
for (const g of Object.keys(GRIDS)) {
  for (const e of eyesOf(g)) {
    for (const c of GRIDS[g].cols) {
      if (c.t === 'av') OPTIONS[gridKey(g, e, c.id)] = AV_OPTIONS;
      if (c.t === 'j') OPTIONS[gridKey(g, e, c.id)] = JAEGER_OPTIONS;
    }
  }
}
for (const [sec, groups] of Object.entries(SECTION_FORMS)) {
  for (const grp of groups) {
    if (grp.kind === 'fields') {
      for (const f of grp.fields) if (f.t === 'select') OPTIONS[fieldKey(sec, f.id)] = f.opts;
    } else {
      for (const r of grp.rows) if (r.t === 'select') { OPTIONS[eyeKey(sec, r.id, 'od')] = r.opts; OPTIONS[eyeKey(sec, r.id, 'oi')] = r.opts; }
    }
  }
}
const CONSULT = new Set(CONSULT_KEYS);
const ANT = new Set(ANT_KEYS);

function checkValues(obj, where) {
  for (const [k, v] of Object.entries(obj)) {
    if (OPTIONS[k]) assert.ok(OPTIONS[k].includes(v), `${where}: "${v}" no es una opción de ${k}`);
  }
}

test('los números de HC son únicos', () => {
  const hcs = CASES.map((c) => c.hc);
  assert.equal(new Set(hcs).size, hcs.length);
});

test('antecedentes: claves y valores válidos', () => {
  for (const c of CASES) {
    for (const k of Object.keys(c.antecedentes || {})) assert.ok(ANT.has(k), `${c.hc}: clave de antecedentes desconocida "${k}"`);
    checkValues(c.antecedentes || {}, c.hc);
    assert.ok(SOCIEDADES.includes(c.sociedad), `${c.hc}: sociedad "${c.sociedad}" no está en la lista`);
  }
});

test('visitas: claves, valores de desplegables y profesionales válidos', () => {
  for (const c of CASES) {
    for (const v of c.visitas || []) {
      const where = `${c.hc} (${v.prest})`;
      for (const k of Object.keys(v.data)) assert.ok(CONSULT.has(k), `${where}: clave desconocida "${k}"`);
      checkValues(v.data, where);
      assert.ok(PROFESIONALES.includes(v.prof), `${where}: profesional desconocido`);
      assert.ok(PRESTACIONES.includes(v.prest), `${where}: prestación desconocida`);
    }
    if (c.proxima) {
      assert.ok(MEDICOS.includes(c.proxima.medico), `${c.hc}: médico desconocido`);
      assert.ok(PRESTACIONES.includes(c.proxima.prest), `${c.hc}: prestación desconocida`);
    }
  }
});

test('la agenda generada no tiene dos citas del mismo médico a la misma hora', () => {
  const { appointments } = buildSeed();
  const keys = appointments.map((a) => `${a.fecha}|${a.medico}|${a.hora}`);
  assert.equal(new Set(keys).size, keys.length);
  for (const a of appointments) assert.ok(MEDICOS.includes(a.medico) && PRESTACIONES.includes(a.prestacion));
});
