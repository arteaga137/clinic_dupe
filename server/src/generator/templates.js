// =====================================================================
// templates.js — PLANTILLAS de casos clínicos (una por patología)
// =====================================================================
// Cada plantilla describe un tipo de paciente:
//   weight   → frecuencia relativa (una catarata es mucho más común que
//              una neuritis óptica, así que tiene más peso)
//   age      → rango de edad típico        medico → quién lo lleva
//   refr     → tipo de graduación          interval → días entre revisiones
//   visits   → [mín, máx] visitas en el historial inicial
//   acute    → urgencia puntual (1 visita, casi nunca vuelve)
//   ant(r,p)         → antecedentes del paciente
//   visit(r,p,v)     → datos de UNA visita. v.n = nº de visita (0 = la
//                      primera), v.age = edad ese día.
//
// `p` es el PERFIL del paciente (ojo afectado, graduación, PIO base,
// gravedad...). Se genera siempre igual a partir de su nº de HC, así que
// todas sus visitas son coherentes entre sí aunque se creen en días
// distintos. `r` es el generador aleatorio de ESA visita.
//
// ⚠️ Datos inventados para practicar el programa. No son una guía clínica.
// =====================================================================

import { E, B, S, otro, av, ep, dpt, clamp, refr, auto, avsc, pio, bmcNormal, foNormal, dx } from './helpers.js';

const REV = (n) => (n === 0 ? 'PRIMERA CONSULTA' : 'REVISIÓN');

export const TEMPLATES = [
  // =================== CRISTALINO ===================
  {
    id: 'catarata', label: 'Catarata senil', weight: 10, age: [62, 88], medico: 'DR. MOLINA', refr: 'hipermetrope',
    interval: 90, visits: [1, 3],
    prest: (n) => (n === 0 ? 'PRIMERA CONSULTA' : n === 1 ? 'PREVIO CATARATA' : 'REVISIÓN POSTOPERATORIA'),
    ant: (r) => ({ ...(r.chance(0.5) ? { ap: r.pick(['HTA', 'HTA, DISLIPEMIA', 'DM TIPO 2', 'HIPOTIROIDISMO']) } : {}), alNoC: r.chance(0.7) }),
    visit: (r, p, v) => {
      const grado = p.sev > 0.6 ? 'Catarata nuclear +++' : p.sev > 0.3 ? 'Catarata nuclear ++' : 'Esclerosis nuclear +';
      if (v.n >= 2) {
        return {
          mot: r.pick(['Revisión tras cirugía de catarata. Ve mucho mejor.', 'Primera semana tras la cirugía. Molestias leves.']),
          ...avsc(...(p.ojo === 'OD' ? [0.9, 0.5] : [0.5, 0.9])), ...pio(p.iop.od + 1, p.iop.oi + 1),
          ...S(p, 'bmc', 'crist', 'Pseudofaquia (LIO en saco)', grado), ...S(p, 'bmc', 'ca', 'Células +', 'Formada y profunda'),
          ...dx(`Pseudofaquia ${p.ojo}. Postoperatorio sin complicaciones.`, 'Z96.1', p.ojo, {
            dx_tto: 'Dexametasona + tobramicina colirio en pauta descendente', dx_pauta: '1 gota cada 6 h la primera semana, luego cada 8 h',
            dx_qx: `Facoemulsificación + LIO ${otro(p.ojo)}`, dx_rev: '1 mes' }),
        };
      }
      const data = {
        mot: r.pick(['Visión borrosa progresiva, peor de lejos.', 'Deslumbramiento al conducir de noche.', 'Ve "como a través de un cristal sucio".']),
        ...refr(p, 'cp1', { avOD: 0.5 - p.sev * 0.3, avOI: 0.6 - p.sev * 0.2, add: 2.5 }),
        ...pio(p.iop.od, p.iop.oi), ...bmcNormal(grado, p.sev > 0.5 ? 'Catarata nuclear ++' : 'Esclerosis nuclear +'),
        ...foNormal(r, 0.3),
        ...dx('Catarata nuclear senil AO.', 'H25.1', 'AO', { dx_qx: `Facoemulsificación + LIO ${p.ojo}`, dx_p_bio: true, dx_p_rec: true, dx_rev: '1 mes' }),
      };
      if (v.n === 1) {
        Object.assign(data, {
          mot: 'Pruebas preoperatorias de catarata.', bio_eq: r.pick(['IOLMaster 700', 'Lenstar LS 900']), bio_form: 'Barrett Universal II',
          bio_lio: r.pick(['Monofocal', 'Monofocal', 'Monofocal tórica', 'Rango extendido (EDOF)']),
          ...E('bio', 'la', (22.6 + p.k).toFixed(2), (22.7 + p.k).toFixed(2)), ...E('bio', 'k1', (43 + p.k).toFixed(2), (43.1 + p.k).toFixed(2)),
          ...E('bio', 'k2', (43.9 + p.k).toFixed(2), (44 + p.k).toFixed(2)), ...B('bio', 'acd', (2.9 + p.k / 3).toFixed(2)),
          ...E('bio', 'pot', dpt(22 - p.k * 2).replace('+', ''), dpt(21.5 - p.k * 2).replace('+', '')), ...B('bio', 'obj', '-0.25'),
          rec_eq: 'Microscopio especular (sin contacto)', ...E('rec', 'dens', String(2300 + Math.round(p.k * 400)), String(2350 + Math.round(p.k * 400))),
          ...B('rec', 'morf', 'Normal'),
        });
      }
      return data;
    },
  },
  {
    id: 'opacidad_capsular', label: 'Opacidad de cápsula posterior', weight: 3, age: [65, 90], medico: 'DRA. SANZ', refr: 'emetrope',
    interval: 30, visits: [1, 2], prest: REV,
    ant: () => ({ aqx: 'FACOEMULSIFICACIÓN + LIO AO', alNoC: true }),
    visit: (r, p, v) => (v.n === 0
      ? {
          mot: `Nota que vuelve a ver borroso con el ${p.ojo} desde hace meses, como tras la operación de catarata.`,
          ...refr(p, 'cp1', { avOD: p.ojo === 'OD' ? 0.4 : 0.9, avOI: p.ojo === 'OI' ? 0.4 : 0.9 }), ...pio(p.iop.od, p.iop.oi),
          ...bmcNormal(), ...S(p, 'bmc', 'crist', 'Opacidad de cápsula posterior', 'Pseudofaquia (LIO en saco)'),
          ...dx(`Opacidad de cápsula posterior ${p.ojo}.`, 'H26.4', p.ojo, { dx_qx: 'Capsulotomía YAG', dx_rev: '1 mes' }),
        }
      : {
          mot: 'Revisión tras capsulotomía YAG. Buena visión.', ...avsc(0.9, 0.9), ...pio(p.iop.od, p.iop.oi),
          ...B('bmc', 'crist', 'Pseudofaquia (LIO en saco)'),
          ...dx('Pseudofaquia AO. Capsulotomía YAG permeable.', 'Z96.1', 'AO', { dx_rev: '12 meses' }),
        }),
  },

  // =================== GLAUCOMA ===================
  {
    id: 'glaucoma_caa', label: 'Glaucoma crónico de ángulo abierto', weight: 9, age: [55, 86], medico: 'DRA. SANZ', refr: 'emetrope',
    interval: 120, visits: [2, 5], prest: REV,
    ant: (r) => ({ aof: 'GLAUCOMA CRÓNICO DE ÁNGULO ABIERTO AO', med: r.pick(['LATANOPROST 0,005 % 1 GOTA NOCHE AO', 'TIMOLOL 0,5 % C/12H AO', 'LATANOPROST NOCHE + BRIMONIDINA C/12H AO']),
      afam: r.chance(0.4) ? r.pick(['PADRE CON GLAUCOMA', 'MADRE CON GLAUCOMA']) : '', alNoC: true }),
    visit: (r, p, v) => {
      const tratado = v.n > 0;
      const base = tratado ? 15 : 22 + p.sev * 5;
      const epOD = 0.5 + p.sev * 0.35 + (p.ojo === 'OD' ? 0.1 : 0);
      const epOI = 0.5 + p.sev * 0.35 + (p.ojo === 'OI' ? 0.1 : 0);
      const data = {
        ...(v.n === 0 ? { mot: 'Remitido por PIO elevada en revisión de óptica.' } : {}),
        ...refr(p, 'cp1', { avOD: 0.9, avOI: 0.9 }), ...pio(base + r.int(0, 3), base + r.int(0, 3), 'Goldmann'),
        ...(v.n === 0 ? { paq_od: String(535 + r.int(-20, 20)), paq_oi: String(538 + r.int(-20, 20)), gonio: 'Ángulo abierto grado III-IV AO' } : {}),
        ...bmcNormal(v.age > 70 ? 'Esclerosis nuclear +' : 'Transparente'),
        fo_met: 'Lente 90D', ...E('fo', 'ep', ep(epOD), ep(epOI)), ...B('fo', 'isnt', 'No cumple'),
        ...S(p, 'fo', 'pap', 'Muesca inferior', 'Bordes nítidos, coloración normal'),
        ...dx(tratado ? 'Glaucoma crónico de ángulo abierto AO. PIO en objetivo.' : 'Glaucoma crónico de ángulo abierto AO.', 'H40.11', 'AO', {
          dx_tto: tratado ? 'Mantener tratamiento hipotensor' : 'Latanoprost 0,005 % colirio', dx_pauta: '1 gota por la noche en AO',
          dx_ind: 'No suspender las gotas aunque no note síntomas.', dx_p_oct: true, dx_p_camp: true, dx_rev: r.pick(['3 meses', '6 meses']) }),
      };
      if (v.n % 2 === 1) {
        const md = -(2 + p.sev * 7) - v.n * 0.2;
        Object.assign(data, {
          oct_tipo: 'Nervio óptico (CFNR)', oct_eq: 'Cirrus HD-OCT', ...B('oct', 'cal', String(r.int(7, 9))),
          ...S(p, 'oct', 'cfnr', String(Math.round(82 - p.sev * 22)), String(Math.round(90 - p.sev * 12))),
          ...S(p, 'oct', 'hall', 'Adelgazamiento CFNR', p.sev > 0.5 ? 'Adelgazamiento CFNR' : 'Normal'),
          camp_eq: 'Humphrey HFA3', camp_est: '24-2 SITA Standard', camp_fiab: 'Fiable',
          ...S(p, 'camp', 'md', md.toFixed(2), (md / 2).toFixed(2)), ...S(p, 'camp', 'vfi', String(Math.round(96 + md * 2)), String(Math.round(98 + md))),
          ...S(p, 'camp', 'ght', 'Fuera de límites normales', p.sev > 0.5 ? 'Límite' : 'Dentro de límites normales'),
          ...S(p, 'camp', 'def', r.pick(['Escalón nasal', 'Arcuato superior', 'Arcuato inferior']), 'Sin defectos'),
        });
      }
      return data;
    },
  },
  {
    id: 'hto', label: 'Hipertensión ocular', weight: 4, age: [40, 72], medico: 'OPTOMETRÍA', refr: 'emetrope',
    interval: 180, visits: [1, 3], prest: REV,
    ant: () => ({ alNoC: true }),
    visit: (r, p) => ({
      ...refr(p, 'cp1', { avOD: 1.0, avOI: 1.0 }), ...pio(23 + r.int(0, 3), 22 + r.int(0, 3), 'Goldmann'),
      paq_od: String(585 + r.int(0, 30)), paq_oi: String(582 + r.int(0, 30)), gonio: 'Ángulo abierto grado IV AO',
      ...bmcNormal(), ...foNormal(r, 0.3), ...B('fo', 'isnt', 'Cumple'),
      oct_tipo: 'Nervio óptico (CFNR)', oct_eq: 'Cirrus HD-OCT', ...E('oct', 'cfnr', String(r.int(92, 102)), String(r.int(92, 102))), ...B('oct', 'hall', 'Normal'),
      ...dx('Hipertensión ocular AO con paquimetría gruesa, sin daño glaucomatoso.', 'H40.05', 'AO', { dx_tto: 'Observación sin tratamiento', dx_rev: '6 meses' }),
    }),
  },
  {
    id: 'glaucoma_pex', label: 'Glaucoma pseudoexfoliativo', weight: 2, age: [68, 90], medico: 'DRA. SANZ', refr: 'hipermetrope',
    interval: 90, visits: [2, 4], prest: REV,
    ant: () => ({ aof: 'GLAUCOMA PSEUDOEXFOLIATIVO', med: 'LATANOPROST NOCHE AO; DORZOLAMIDA/TIMOLOL C/12H AO', alNoC: true }),
    visit: (r, p) => ({
      ...refr(p, 'cp1', { avOD: 0.6, avOI: 0.6 }), ...pio(p.iop.od + 6, p.iop.oi + 3, 'Goldmann'),
      ...bmcNormal('Catarata nuclear ++'), bmc_obs: 'Material pseudoexfoliativo en cápsula anterior AO.',
      fo_met: 'Lente 90D', ...E('fo', 'ep', ep(0.8 + p.sev * 0.15), ep(0.7 + p.sev * 0.1)), ...B('fo', 'pap', 'Palidez difusa'),
      ...dx('Glaucoma pseudoexfoliativo AO.', 'H40.14', 'AO', { dx_tto: 'Máximo tratamiento médico', dx_qx: r.pick(['Trabeculoplastia láser (SLT)', 'Trabeculectomía']), dx_rev: '1 mes' }),
    }),
  },
  {
    id: 'cierre_angular', label: 'Ángulo estrecho / cierre angular', weight: 2, age: [55, 82], medico: 'DRA. SANZ', refr: 'hipermetrope',
    interval: 60, visits: [1, 3], prest: (n) => (n === 0 ? 'CONSULTA URGENCIAS' : 'REVISIÓN'),
    ant: () => ({ alNoC: true }),
    visit: (r, p, v) => (v.n === 0
      ? {
          mot: `Dolor intenso en ${p.ojo}, halos alrededor de las luces y náuseas.`,
          ...avsc(p.ojo === 'OD' ? 0.1 : 0.6, p.ojo === 'OI' ? 0.1 : 0.6),
          ...pio(p.ojo === 'OD' ? 48 + r.int(0, 8) : 17, p.ojo === 'OI' ? 48 + r.int(0, 8) : 17, 'Goldmann'),
          ...S(p, 'bmc', 'cornea', 'Edema corneal', 'Transparente'), ...B('bmc', 'ca', 'Estrecha'), ...B('bmc', 'vh', 'Grado 1'),
          ...S(p, 'bmc', 'pupila', 'Midriática', 'Redonda y reactiva'),
          ...dx(`Cierre angular agudo primario ${p.ojo}.`, 'H40.21', 'AO', { dx_tto: 'Acetazolamida oral, pilocarpina 2 %, timolol 0,5 %', dx_qx: 'Iridotomía láser', dx_rev: '1 semana' }),
        }
      : {
          ...pio(p.iop.od, p.iop.oi, 'Goldmann'), ...B('bmc', 'pupila', 'Iridotomía permeable'), ...B('bmc', 'vh', 'Grado 2'),
          gonio: 'Ángulo abierto grado II-III tras iridotomía AO',
          ...dx('Iridotomías permeables AO. PIO controlada.', 'H40.21', 'AO', { dx_rev: '6 meses' }),
        }),
  },

  // =================== RETINA ===================
  {
    id: 'dmae_seca', label: 'DMAE seca', weight: 5, age: [65, 90], medico: 'DRA. SANZ', refr: 'hipermetrope',
    interval: 180, visits: [1, 3], prest: REV,
    ant: (r) => ({ ap: r.chance(0.4) ? 'FUMADOR' : 'HTA', hta: r.chance(0.5), afam: r.chance(0.3) ? 'MADRE CON DMAE' : '' }),
    visit: (r, p) => ({
      mot: r.pick(['Revisión de DMAE. Sin cambios en la rejilla de Amsler.', 'Le cuesta leer la letra pequeña.']),
      ...refr(p, 'cp1', { avOD: 0.7 - p.sev * 0.3, avOI: 0.7 - p.sev * 0.2, add: 3 }), ...pio(p.iop.od, p.iop.oi),
      ...bmcNormal('Esclerosis nuclear +'), ...foNormal(r, 0.3), ...B('fo', 'mac', p.sev > 0.5 ? 'Drusas blandas' : 'Drusas duras'),
      oct_tipo: 'Mácula', oct_eq: 'Spectralis', ...E('oct', 'gmc', String(r.int(235, 265)), String(r.int(235, 265))), ...B('oct', 'hall', 'Drusas'),
      ...dx('Degeneración macular asociada a la edad, forma seca, AO.', 'H35.31', 'AO', {
        dx_tto: 'Suplementos AREDS2', dx_ind: 'Rejilla de Amsler semanal. Acudir si ve líneas torcidas.', dx_rev: '6 meses' }),
    }),
  },
  {
    id: 'dmae_humeda', label: 'DMAE exudativa', weight: 4, age: [68, 92], medico: 'DRA. SANZ', refr: 'hipermetrope',
    interval: 35, visits: [2, 6], prest: REV,
    ant: (r) => ({ aof: 'DMAE EXUDATIVA EN TRATAMIENTO CON ANTI-VEGF', ap: 'HTA', hta: true, alNoC: r.chance(0.7) }),
    visit: (r, p, v) => {
      const activa = v.n === 0 || r.chance(0.35);
      return {
        mot: v.n === 0 ? `Ve las líneas rectas torcidas con el ${p.ojo} desde hace unos días.` : `Revisión e inyección ${p.ojo} (${v.n + 1}.ª).`,
        ...refr(p, 'cp1', { avOD: p.ojo === 'OD' ? 0.3 + v.n * 0.03 : 0.7, avOI: p.ojo === 'OI' ? 0.3 + v.n * 0.03 : 0.7 }),
        fo_dil: 'Tropicamida 1%', fo_met: 'Lente 90D', ...S(p, 'fo', 'mac', 'Neovascularización coroidea', 'Drusas blandas'),
        oct_tipo: 'Mácula', oct_eq: 'Spectralis',
        ...S(p, 'oct', 'gmc', String(activa ? r.int(360, 460) : r.int(270, 310)), String(r.int(240, 270))),
        ...S(p, 'oct', 'hall', activa ? 'Líquido subretiniano' : 'Desprendimiento del EPR', 'Drusas'),
        ...dx(`DMAE exudativa ${p.ojo} ${activa ? 'activa' : 'sin actividad'}.`, 'H35.32', p.ojo, {
          dx_tto: activa ? 'Inyección intravítrea anti-VEGF: acortar intervalo' : 'Inyección intravítrea anti-VEGF: ampliar intervalo 2 semanas',
          dx_qx: 'Inyección intravítrea', dx_rev: '1 mes' }),
      };
    },
  },
  {
    id: 'rd_diabetica', label: 'Retinopatía diabética', weight: 6, age: [45, 82], medico: 'DRA. SANZ', refr: 'emetrope',
    interval: 120, visits: [1, 4], prest: REV,
    ant: (r) => ({ diabetes: true, ap: r.pick(['DM TIPO 2', 'DM TIPO 2, HTA', 'DM TIPO 1']), hta: r.chance(0.6),
      medsis: r.pick(['METFORMINA 850 MG', 'METFORMINA + INSULINA GLARGINA', 'INSULINA BASAL-BOLO', 'METFORMINA + SITAGLIPTINA']) }),
    visit: (r, p) => {
      const nivel = p.sev > 0.75 ? 'RDNP severa' : p.sev > 0.45 ? 'RDNP moderada' : 'RDNP leve';
      const edema = p.sev > 0.55;
      return {
        mot: r.pick(['Control de diabetes.', 'Revisión de retinopatía diabética.', 'Nota la visión algo borrosa.']),
        ...refr(p, 'cp1', { avOD: edema && p.ojo === 'OD' ? 0.5 : 0.9, avOI: edema && p.ojo === 'OI' ? 0.5 : 0.9 }), ...pio(p.iop.od, p.iop.oi),
        ...bmcNormal(p.age > 65 ? 'Esclerosis nuclear +' : 'Transparente'),
        fo_dil: 'Tropicamida 1% + fenilefrina 10%', fo_met: 'Oftalmoscopía indirecta (BIO)', ...B('fo', 'vas', 'Microaneurismas'),
        ...S(p, 'fo', 'mac', edema ? 'Edema macular' : 'Brillo foveal conservado', 'Brillo foveal conservado'), fo_rd: nivel,
        ...(edema ? { oct_tipo: 'Mácula', oct_eq: 'Cirrus HD-OCT', ...S(p, 'oct', 'gmc', String(r.int(340, 430)), String(r.int(250, 280))),
          ...S(p, 'oct', 'hall', 'Líquido intrarretiniano', 'Perfil foveal conservado') } : {}),
        ...dx(`Retinopatía diabética no proliferativa ${nivel.replace('RDNP ', '')} AO${edema ? `. Edema macular diabético ${p.ojo}` : ''}.`, 'E11.3', 'AO', {
          dx_tto: edema ? `Inyección intravítrea anti-VEGF ${p.ojo}` : 'Control metabólico', ...(edema ? { dx_qx: 'Inyección intravítrea' } : {}),
          dx_ind: 'Buen control de glucosa, tensión y colesterol.', dx_rev: edema ? '1 mes' : r.pick(['6 meses', '12 meses']) }),
      };
    },
  },
  {
    id: 'diabetes_sin_rd', label: 'Diabetes sin retinopatía (cribado)', weight: 5, age: [40, 80], medico: 'OPTOMETRÍA', refr: 'emetrope',
    interval: 365, visits: [1, 3], prest: REV,
    ant: (r) => ({ diabetes: true, ap: 'DM TIPO 2', medsis: r.pick(['METFORMINA 850 MG', 'METFORMINA 1000 MG', 'METFORMINA + EMPAGLIFLOZINA']) }),
    visit: (r, p) => ({
      mot: 'Revisión anual de fondo de ojo por diabetes.', ...refr(p, 'cp1', { avOD: 1.0, avOI: 1.0, add: p.age > 45 ? 2 : null }),
      ...pio(p.iop.od, p.iop.oi), ...bmcNormal(p.age > 65 ? 'Esclerosis nuclear +' : 'Transparente'), ...foNormal(r, 0.3),
      fo_met: 'Retinografía', fo_rd: 'No',
      ...dx('Diabetes mellitus tipo 2 sin retinopatía.', 'E11.9', 'AO', { dx_rev: '12 meses' }),
    }),
  },
  {
    id: 'ovr', label: 'Oclusión venosa retiniana', weight: 2, age: [55, 85], medico: 'DRA. SANZ', refr: 'emetrope',
    interval: 40, visits: [1, 4], prest: (n) => (n === 0 ? 'CONSULTA URGENCIAS' : 'REVISIÓN'),
    ant: (r) => ({ ap: 'HTA', hta: true, medsis: r.pick(['ENALAPRIL 20 MG', 'LOSARTÁN 50 MG', 'AMLODIPINO 5 MG']) }),
    visit: (r, p, v) => ({
      mot: v.n === 0 ? `Pérdida de visión brusca e indolora en ${p.ojo}.` : `Control de oclusión venosa ${p.ojo}.`,
      ...avsc(p.ojo === 'OD' ? 0.3 + v.n * 0.1 : 0.9, p.ojo === 'OI' ? 0.3 + v.n * 0.1 : 0.9), ...pio(p.iop.od, p.iop.oi),
      fo_dil: 'Tropicamida 1%', fo_met: 'Oftalmoscopía indirecta (BIO)', ...S(p, 'fo', 'vas', 'Hemorragias en llama', 'Cruces AV patológicos'),
      ...S(p, 'fo', 'mac', 'Edema macular', 'Brillo foveal conservado'),
      oct_tipo: 'Mácula', oct_eq: 'Spectralis', ...S(p, 'oct', 'gmc', String(Math.max(280, 500 - v.n * 60)), String(r.int(245, 270))),
      ...S(p, 'oct', 'hall', 'Líquido intrarretiniano', 'Normal'),
      ...dx(`Oclusión de rama venosa ${p.ojo} con edema macular.`, 'H34.83', p.ojo, { dx_tto: `Inyección intravítrea anti-VEGF ${p.ojo}`, dx_qx: 'Inyección intravítrea', dx_ind: 'Control de la tensión arterial.', dx_rev: '1 mes' }),
    }),
  },
  {
    id: 'mer', label: 'Membrana epirretiniana', weight: 2, age: [60, 85], medico: 'DR. MOLINA', refr: 'emetrope',
    interval: 120, visits: [1, 2], prest: REV,
    ant: () => ({ aqx: 'FACOEMULSIFICACIÓN + LIO AO', alNoC: true }),
    visit: (r, p) => ({
      mot: `Ve las líneas torcidas con el ${p.ojo}.`, ...refr(p, 'cp1', { avOD: p.ojo === 'OD' ? 0.5 : 0.9, avOI: p.ojo === 'OI' ? 0.5 : 0.9 }),
      ...B('bmc', 'crist', 'Pseudofaquia (LIO en saco)'), fo_met: 'Lente 90D', ...S(p, 'fo', 'mac', 'Membrana epirretiniana', 'Brillo foveal conservado'),
      oct_tipo: 'Mácula', oct_eq: 'Topcon Triton', ...S(p, 'oct', 'gmc', String(r.int(400, 480)), String(r.int(240, 260))),
      ...S(p, 'oct', 'hall', 'Membrana epirretiniana', 'Perfil foveal conservado'),
      ...dx(`Membrana epirretiniana macular ${p.ojo}.`, 'H35.37', p.ojo, { dx_qx: p.sev > 0.5 ? 'Vitrectomía' : 'No', dx_rev: '6 meses' }),
    }),
  },
  {
    id: 'dvp', label: 'Desprendimiento vítreo posterior', weight: 4, age: [45, 78], medico: 'DRA. SANZ', refr: 'miope',
    interval: 45, visits: [1, 2], acute: true, prest: (n) => (n === 0 ? 'CONSULTA URGENCIAS' : 'REVISIÓN'),
    ant: () => ({ alNoC: true }),
    visit: (r, p, v) => ({
      mot: v.n === 0 ? `Ve "moscas volantes" y destellos de luz en el ${p.ojo} desde hace 2 días.` : 'Revisión de moscas volantes. Han disminuido.',
      ...avsc(0.9, 0.9), ...pio(p.iop.od, p.iop.oi), ...bmcNormal(),
      fo_dil: 'Tropicamida 1% + fenilefrina 10%', fo_met: 'Oftalmoscopía indirecta (BIO)', ...S(p, 'fo', 'vit', 'Desprendimiento vítreo posterior', 'Transparente'),
      ...B('fo', 'per', r.chance(0.3) ? 'Degeneración en empalizada' : 'Retina aplicada 360°'), ...B('fo', 'mac', 'Brillo foveal conservado'),
      ...dx(`Desprendimiento vítreo posterior ${p.ojo} sin desgarros.`, 'H43.81', p.ojo, {
        dx_ind: 'Acudir de urgencia si aumentan las moscas, los destellos o ve una cortina.', dx_rev: v.n === 0 ? '1 mes' : 'Alta' }),
    }),
  },
  {
    id: 'csc', label: 'Coriorretinopatía serosa central', weight: 1.5, age: [28, 55], medico: 'DRA. SANZ', refr: 'hipermetrope', sexo: 0.2,
    interval: 45, visits: [1, 3], prest: REV,
    ant: (r) => ({ ap: r.chance(0.4) ? 'ESTRÉS LABORAL' : '', profesion: 'Empleado/a', alNoC: true }),
    visit: (r, p, v) => ({
      mot: v.n === 0 ? `Mancha central y ve los objetos más pequeños con el ${p.ojo}.` : 'Control de la mancha. Mejor.',
      ...avsc(p.ojo === 'OD' ? 0.6 + v.n * 0.15 : 1.0, p.ojo === 'OI' ? 0.6 + v.n * 0.15 : 1.0),
      oct_tipo: 'Mácula', oct_eq: 'Spectralis', ...S(p, 'oct', 'gmc', String(Math.max(260, 430 - v.n * 80)), String(r.int(250, 270))),
      ...S(p, 'oct', 'hall', v.n < 2 ? 'Líquido subretiniano' : 'Perfil foveal conservado', 'Normal'),
      ...dx(`Coriorretinopatía serosa central ${p.ojo}.`, 'H35.71', p.ojo, { dx_tto: 'Observación', dx_ind: 'Evitar corticoides y reducir el estrés.', dx_rev: '1 mes' }),
    }),
  },

  // =================== CÓRNEA Y SUPERFICIE ===================
  {
    id: 'ojo_seco', label: 'Ojo seco', weight: 7, age: [35, 82], medico: 'DR. MOLINA', refr: 'emetrope', sexo: 0.75,
    interval: 120, visits: [1, 3], prest: REV,
    ant: (r) => ({ ap: r.pick(['', 'MENOPAUSIA', 'SÍNDROME DE SJÖGREN', 'ARTRITIS REUMATOIDE']), alNoC: r.chance(0.6),
      medsis: r.chance(0.3) ? r.pick(['ANTIDEPRESIVOS', 'ANTIHISTAMÍNICOS']) : '' }),
    visit: (r, p) => ({
      mot: r.pick(['Sensación de arenilla y quemazón, peor por la tarde.', 'Ojos rojos y cansados con el ordenador.', 'Lagrimeo paradójico y picor.']),
      ...refr(p, 'cp1', { avOD: 1.0, avOI: 1.0, add: p.age > 45 ? 2 : null }),
      ...B('bmc', 'parp', 'Disfunción de glándulas de Meibomio'), ...B('bmc', 'conj', 'Hiperemia leve'),
      ...B('bmc', 'cornea', p.sev > 0.4 ? 'Queratitis punteada superficial' : 'Transparente'), ...B('bmc', 'fluo', p.sev > 0.4 ? 'Punteado inferior' : 'Negativa'),
      ...E('bmc', 'but', String(r.int(3, 7)), String(r.int(3, 7))), ...E('bmc', 'schir', String(r.int(3, 9)), String(r.int(3, 9))),
      ...dx(`Síndrome de ojo seco ${p.sev > 0.6 ? 'moderado-severo' : 'leve-moderado'} AO.`, 'H04.12', 'AO', {
        dx_tto: 'Lágrimas artificiales sin conservantes; higiene palpebral', dx_pauta: '1 gota 4-6 veces al día en AO',
        dx_ind: 'Pausas cada 20 minutos frente a pantallas. Beber agua.', dx_rev: '3 meses' }),
    }),
  },
  {
    id: 'blefaritis', label: 'Blefaritis', weight: 4, age: [20, 80], medico: 'DR. MOLINA', refr: 'emetrope',
    interval: 90, visits: [1, 2], prest: REV,
    ant: (r) => ({ ap: r.chance(0.3) ? 'ROSÁCEA' : '', alNoC: true }),
    visit: (r) => ({
      mot: 'Picor y párpados rojos por las mañanas, con legañas.', ...avsc(1.0, 1.0),
      ...B('bmc', 'parp', r.pick(['Blefaritis anterior', 'Disfunción de glándulas de Meibomio'])), ...B('bmc', 'conj', 'Hiperemia leve'),
      ...B('bmc', 'cornea', 'Transparente'), ...E('bmc', 'but', String(r.int(5, 8)), String(r.int(5, 8))),
      ...dx('Blefaritis crónica AO.', 'H01.0', 'AO', { dx_tto: 'Higiene palpebral con toallitas; calor local', dx_pauta: 'Mañana y noche, de forma continuada', dx_rev: '3 meses' }),
    }),
  },
  {
    id: 'conj_alergica', label: 'Conjuntivitis alérgica', weight: 4, age: [6, 45], medico: 'DR. MOLINA', refr: 'miope',
    interval: 180, visits: [1, 2], prest: REV,
    ant: (r) => ({ ap: r.pick(['ASMA', 'RINITIS ALÉRGICA', 'DERMATITIS ATÓPICA']), alergias: r.pick(['POLEN DE GRAMÍNEAS', 'ÁCAROS DEL POLVO', 'PELO DE GATO', 'POLEN DE OLIVO']) }),
    visit: (r) => ({
      mot: 'Picor intenso en ambos ojos y lagrimeo, sobre todo en primavera.', ...avsc(1.0, 1.0),
      ...B('bmc', 'conj', 'Reacción papilar'), ...B('bmc', 'cornea', 'Transparente'), ...B('bmc', 'fluo', 'Negativa'),
      ...dx('Conjuntivitis alérgica estacional AO.', 'H10.1', 'AO', { dx_tto: 'Olopatadina colirio; lágrimas artificiales frías', dx_pauta: '1 gota cada 12 h en AO', dx_ind: 'No frotarse los ojos.', dx_rev: '12 meses' }),
    }),
  },
  {
    id: 'conj_viral', label: 'Conjuntivitis vírica', weight: 3, age: [16, 65], medico: 'DRA. SANZ', refr: 'emetrope', acute: true,
    interval: 10, visits: [1, 2], prest: (n) => (n === 0 ? 'CONSULTA URGENCIAS' : 'REVISIÓN'),
    ant: () => ({ alNoC: true }),
    visit: (r, p, v) => ({
      mot: v.n === 0 ? `Ojo rojo en ${p.ojo} desde hace 3 días, ahora también en el otro. Lagrimeo y arenilla.` : 'Revisión de conjuntivitis. Mucho mejor.',
      ...avsc(1.0, 1.0), ...B('bmc', 'conj', v.n === 0 ? 'Reacción folicular' : 'Hiperemia leve'), ...B('bmc', 'cornea', 'Transparente'),
      ...(v.n === 0 ? { bmc_obs: 'Adenopatía preauricular palpable.' } : {}),
      ...dx('Queratoconjuntivitis adenovírica AO.', 'B30.1', 'AO', { dx_tto: 'Lágrimas artificiales frías; compresas frías',
        dx_ind: 'Muy contagiosa: lavado de manos y toalla propia.', dx_rev: v.n === 0 ? '1 semana' : 'Alta' }),
    }),
  },
  {
    id: 'cuerpo_extrano', label: 'Cuerpo extraño corneal', weight: 2.5, age: [22, 62], medico: 'DRA. SANZ', refr: 'emetrope', sexo: 0.15, acute: true,
    interval: 3, visits: [1, 1], prest: () => 'CONSULTA URGENCIAS',
    ant: (r) => ({ profesion: r.pick(['Autónomo/a', 'Empleado/a']), ap: r.pick(['TRABAJA EN UN TALLER MECÁNICO', 'TRABAJA CON RADIAL SIN GAFAS', 'CARPINTERO']) }),
    visit: (r, p) => ({
      mot: `Le saltó algo al ${p.ojo} trabajando. Dolor y lagrimeo.`, ...avsc(p.ojo === 'OD' ? 0.8 : 1.0, p.ojo === 'OI' ? 0.8 : 1.0),
      ...S(p, 'bmc', 'conj', 'Hiperemia moderada', 'Normal'), ...S(p, 'bmc', 'cornea', 'Cuerpo extraño metálico con anillo de óxido', 'Transparente'),
      ...S(p, 'bmc', 'fluo', 'Defecto epitelial', 'Negativa'),
      ...dx(`Cuerpo extraño corneal ${p.ojo}. Extraído en consulta.`, 'T15.0', p.ojo, {
        dx_tto: 'Pomada antibiótica y oclusión 24 h', dx_ind: 'Usar gafas de protección en el trabajo.', dx_rev: 'Alta' }),
    }),
  },
  {
    id: 'queratitis_lc', label: 'Queratitis por lentes de contacto', weight: 1.5, age: [17, 45], medico: 'DRA. SANZ', refr: 'miope', acute: true,
    interval: 7, visits: [1, 2], prest: (n) => (n === 0 ? 'CONSULTA URGENCIAS' : 'REVISIÓN'),
    ant: () => ({ aof: 'PORTADOR/A DE LENTES DE CONTACTO BLANDAS', alNoC: true }),
    visit: (r, p, v) => ({
      mot: v.n === 0 ? `Dolor, fotofobia y ojo rojo en ${p.ojo}. Duerme con las lentillas.` : 'Control de la úlcera. Menos dolor.',
      ...avsc(p.ojo === 'OD' ? 0.4 + v.n * 0.3 : 1.0, p.ojo === 'OI' ? 0.4 + v.n * 0.3 : 1.0),
      ...S(p, 'bmc', 'conj', 'Hiperemia moderada', 'Normal'), ...S(p, 'bmc', 'cornea', v.n === 0 ? 'Úlcera corneal' : 'Leucoma', 'Transparente'),
      ...S(p, 'bmc', 'fluo', v.n === 0 ? 'Defecto epitelial' : 'Negativa', 'Negativa'),
      ...dx(`Úlcera corneal ${p.ojo} asociada a lentes de contacto.`, 'H16.0', p.ojo, {
        dx_tto: 'Moxifloxacino colirio', dx_pauta: v.n === 0 ? '1 gota cada hora las primeras 48 h' : '1 gota cada 6 h',
        dx_ind: 'Suspender las lentes de contacto.', dx_rev: '1 semana' }),
    }),
  },
  {
    id: 'queratocono', label: 'Queratocono', weight: 2, age: [15, 35], medico: 'OPTOMETRÍA', refr: 'miope',
    interval: 180, visits: [1, 3], prest: REV,
    ant: (r) => ({ aof: 'QUERATOCONO', ap: r.chance(0.5) ? 'DERMATITIS ATÓPICA' : '', alergias: r.chance(0.4) ? 'ÁCAROS DEL POLVO' : '' }),
    visit: (r, p, v) => {
      const k = 46 + p.sev * 5 + v.n * 0.3;
      return {
        ...refr(p, 'man', { avOD: 0.8 - p.sev * 0.3, avOI: 0.7 - p.sev * 0.3 }), topo_eq: 'Pentacam',
        ...E('topo', 'k1', k.toFixed(1), (k + 1).toFixed(1)), ...E('topo', 'k2', (k + 3).toFixed(1), (k + 4).toFixed(1)),
        ...E('topo', 'kmax', (k + 6).toFixed(1), (k + 8).toFixed(1)), ...E('topo', 'paq', String(Math.round(480 - p.sev * 40)), String(Math.round(470 - p.sev * 40))),
        ...B('topo', 'pat', 'Pajarita asimétrica'), topo_concl: 'Queratocono',
        ...dx('Queratocono AO.', 'H18.61', 'AO', { dx_tto: v.n > 0 && p.sev > 0.5 ? 'Crosslinking corneal (progresión)' : 'Lentes de contacto rígidas',
          dx_ind: 'No frotarse los ojos.', dx_rev: '6 meses' }),
      };
    },
  },
  {
    id: 'pterigion', label: 'Pterigión', weight: 2.5, age: [30, 78], medico: 'DR. MOLINA', refr: 'emetrope',
    interval: 180, visits: [1, 2], prest: REV,
    ant: (r) => ({ ap: r.pick(['TRABAJA AL AIRE LIBRE', 'AGRICULTOR', 'VIVIÓ EN CANARIAS']), alNoC: true }),
    visit: (r, p) => ({
      mot: `Carnosidad en el lado nasal del ${p.ojo} que se enrojece con el sol.`, ...avsc(0.9, 1.0),
      ...S(p, 'bmc', 'conj', 'Pterigión', 'Pinguécula'), ...B('bmc', 'cornea', 'Transparente'),
      ...dx(`Pterigión nasal ${p.ojo} grado ${p.sev > 0.5 ? 'II' : 'I'}.`, 'H11.0', p.ojo, { dx_tto: 'Lágrimas artificiales; gafas de sol con filtro UV', dx_rev: '6 meses' }),
    }),
  },
  {
    id: 'fuchs', label: 'Distrofia endotelial de Fuchs', weight: 1, age: [55, 82], medico: 'DR. MOLINA', refr: 'hipermetrope', sexo: 0.7,
    interval: 120, visits: [1, 3], prest: REV,
    ant: () => ({ alNoC: true }),
    visit: (r, p) => ({
      mot: 'Visión borrosa al despertar que mejora durante el día.', ...refr(p, 'cp1', { avOD: 0.6, avOI: 0.7 }),
      ...B('bmc', 'cornea', 'Guttas endoteliales'), ...B('bmc', 'crist', 'Catarata nuclear ++'),
      rec_eq: 'Microscopio especular (sin contacto)', ...E('rec', 'dens', String(Math.round(1500 - p.sev * 500)), String(Math.round(1650 - p.sev * 400))),
      ...E('rec', 'paq', String(r.int(590, 630)), String(r.int(580, 610))), ...B('rec', 'morf', 'Guttas'),
      ...dx('Distrofia endotelial de Fuchs AO.', 'H18.51', 'AO', { dx_tto: 'Cloruro sódico 5 % colirio por la mañana', dx_rev: '6 meses' }),
    }),
  },

  // =================== INFLAMACIÓN / NEURO / ÓRBITA ===================
  {
    id: 'uveitis', label: 'Uveítis anterior', weight: 1.5, age: [22, 58], medico: 'DRA. SANZ', refr: 'emetrope',
    interval: 14, visits: [1, 3], prest: (n) => (n === 0 ? 'CONSULTA URGENCIAS' : 'REVISIÓN'),
    ant: (r) => ({ ap: r.pick(['ESPONDILITIS ANQUILOSANTE (HLA-B27 +)', 'HLA-B27 POSITIVO', '']), alNoC: true }),
    visit: (r, p, v) => ({
      mot: v.n === 0 ? `Dolor, ojo rojo y fotofobia en ${p.ojo}.` : 'Revisión de uveítis. Mejor.',
      ...avsc(p.ojo === 'OD' ? 0.6 + v.n * 0.15 : 1.0, p.ojo === 'OI' ? 0.6 + v.n * 0.15 : 1.0), ...pio(p.iop.od, p.iop.oi, 'Goldmann'),
      ...S(p, 'bmc', 'conj', 'Hiperemia moderada', 'Normal'), ...S(p, 'bmc', 'cornea', 'Precipitados queráticos', 'Transparente'),
      ...S(p, 'bmc', 'ca', v.n === 0 ? 'Células ++' : 'Células +', 'Formada y profunda'),
      ...dx(`Uveítis anterior aguda ${p.ojo}.`, 'H20.0', p.ojo, { dx_tto: 'Prednisolona acetato 1 % + ciclopentolato 1 %',
        dx_pauta: v.n === 0 ? 'Prednisolona cada 2 h; ciclopentolato cada 8 h' : 'Bajar prednisolona a cada 6 h', dx_rev: '15 días' }),
    }),
  },
  {
    id: 'neuritis', label: 'Neuritis óptica', weight: 0.7, age: [18, 45], medico: 'DR. MOLINA', refr: 'emetrope', sexo: 0.7,
    interval: 45, visits: [1, 3], prest: (n) => (n === 0 ? 'CONSULTA URGENCIAS' : 'REVISIÓN'),
    ant: () => ({ alNoC: true }),
    visit: (r, p, v) => ({
      mot: v.n === 0 ? `Pérdida de visión en ${p.ojo} con dolor al mover el ojo.` : 'Revisión de neuritis óptica.',
      ...avsc(p.ojo === 'OD' ? 0.3 + v.n * 0.25 : 1.0, p.ojo === 'OI' ? 0.3 + v.n * 0.25 : 1.0), mo_pup: `DPAR ${p.ojo}`,
      ...S(p, 'fo', 'pap', v.n > 0 ? 'Palidez temporal' : 'Bordes nítidos, coloración normal', 'Bordes nítidos, coloración normal'),
      ...dx(`Neuritis óptica retrobulbar ${p.ojo}.`, 'H46.1', p.ojo, { dx_ind: 'Valoración por Neurología (resonancia magnética).', dx_rev: '1 mes' }),
    }),
  },
  {
    id: 'orbitopatia', label: 'Orbitopatía tiroidea', weight: 1, age: [30, 65], medico: 'DR. MOLINA', refr: 'emetrope', sexo: 0.8,
    interval: 90, visits: [1, 3], prest: REV,
    ant: () => ({ ap: 'ENFERMEDAD DE GRAVES', medsis: 'TIAMAZOL 5 MG' }),
    visit: (r, p) => ({
      mot: 'Ojos saltones y sensación de ojo seco.', mo_vers: 'Limitadas', mo_dipl: p.sev > 0.5 ? 'Vertical' : 'No',
      orb_base: '100', ...E('orb', 'hertel', String(20 + Math.round(p.sev * 4)), String(19 + Math.round(p.sev * 4))),
      ...B('orb', 'pos', 'Retracción palpebral'), ...B('bmc', 'fluo', 'Punteado inferior'),
      ...dx('Orbitopatía tiroidea AO.', 'H06.2', 'AO', { dx_tto: 'Lágrimas artificiales; selenio', dx_ind: 'No fumar. Seguimiento con Endocrinología.', dx_rev: '3 meses' }),
    }),
  },

  // =================== PÁRPADOS / ESTÉTICA ===================
  {
    id: 'chalazion', label: 'Chalazión', weight: 3, age: [12, 60], medico: 'DR. MOLINA', refr: 'emetrope',
    interval: 30, visits: [1, 2], prest: REV,
    ant: () => ({ alNoC: true }),
    visit: (r, p, v) => ({
      mot: v.n === 0 ? `Bulto en el párpado del ${p.ojo} desde hace unas semanas, no duele.` : 'Revisión tras extirpación del chalazión.',
      ...S(p, 'bmc', 'parp', v.n === 0 ? 'Chalazión' : 'Normales', 'Blefaritis anterior'),
      ...(v.n === 0 ? { ocp_dx: `Chalazión en párpado ${r.pick(['superior', 'inferior'])} ${p.ojo}.`, ocp_proc: 'Extirpación de chalazión', ocp_ojo: p.ojo, ocp_anest: 'Local', ocp_cons: true } : {}),
      ...dx(`Chalazión ${p.ojo}.`, 'H00.1', p.ojo, { dx_tto: 'Calor local y masaje palpebral', dx_rev: v.n === 0 ? '1 mes' : 'Alta' }),
    }),
  },
  {
    id: 'ptosis', label: 'Ptosis / dermatocalasia', weight: 2.5, age: [58, 86], medico: 'DR. MOLINA', refr: 'hipermetrope',
    interval: 60, visits: [1, 3], prest: (n) => (n === 0 ? 'PRIMERA CONSULTA' : n === 1 ? 'NOTA MÉDICA' : 'REVISIÓN POSTOPERATORIA'),
    ant: (r) => ({ anticoag: r.chance(0.25), ...(r.chance(0.25) ? { medsis: 'APIXABÁN 5 MG' } : {}), alNoC: true }),
    visit: (r, p, v) => ({
      mot: v.n === 0 ? 'Los párpados le tapan la visión al final del día.' : v.n === 1 ? 'Preoperatorio de blefaroplastia.' : 'Revisión tras la cirugía de párpados.',
      ...E('orb', 'mrd1', v.n >= 2 ? '3.5' : (1 + p.k).toFixed(1), v.n >= 2 ? '3.5' : (1.5 + p.k).toFixed(1)), ...B('orb', 'fe', String(r.int(12, 15))),
      ...B('orb', 'pos', v.n >= 2 ? 'Normal' : r.pick(['Ptosis', 'Dermatocalasia'])),
      ocp_dx: 'Ptosis aponeurótica y dermatocalasia AO.', ocp_proc: r.pick(['Blefaroplastia superior', 'Cirugía de ptosis']), ocp_ojo: 'AO',
      ocp_anest: 'Local + sedación', ocp_fotos: true, ocp_cons: v.n > 0,
      ...dx('Ptosis aponeurótica AO. Dermatocalasia.', 'H02.4', 'AO', { dx_qx: 'Blefaroplastia', dx_rev: '1 mes' }),
    }),
  },
  {
    id: 'estetica', label: 'Estética periocular', weight: 2, age: [30, 62], medico: 'DR. MOLINA', refr: 'emetrope', sexo: 0.8,
    interval: 120, visits: [1, 4], prest: REV,
    ant: () => ({ alNoC: true, profesion: 'Autónomo/a' }),
    visit: (r) => ({
      mot: 'Tratamiento estético periocular.',
      est_trat: r.pick(['Toxina botulínica', 'Toxina botulínica', 'Ácido hialurónico']), est_zona: r.pick(['Patas de gallo', 'Entrecejo', 'Surco lagrimal / ojera']),
      est_dosis: r.pick(['12 U por lado', '20 U', '0,5 ml por lado']), est_lote: `LT-${r.int(1000, 9999)}`, est_cons: true, est_fotos: true,
      est_prox: r.pick(['4 meses', '6 meses']),
    }),
  },

  // =================== REFRACCIÓN / INFANTIL ===================
  {
    id: 'miopia_infantil', label: 'Miopía infantil progresiva', weight: 4, age: [6, 15], medico: 'OPTOMETRÍA', refr: 'miope_infantil',
    interval: 180, visits: [1, 4], prest: REV,
    ant: (r) => ({ afam: r.pick(['PADRE MIOPE', 'MADRE MIOPE', 'PADRE Y MADRE MIOPES']), profesion: 'Estudiante', alNoC: true }),
    visit: (r, p, v) => {
      const shift = -0.25 * v.n;
      return {
        mot: v.n === 0 ? 'No ve bien la pizarra del colegio.' : 'Revisión de miopía.',
        ...refr(p, 'ciclo', { esfShift: shift }), ...refr(p, 'rx', { avOD: 1.0, avOI: 1.0, esfShift: shift }),
        bio_eq: 'IOLMaster 700', ...E('bio', 'la', (24 + p.sev + v.n * 0.12).toFixed(2), (24.1 + p.sev + v.n * 0.12).toFixed(2)),
        ...dx('Miopía progresiva AO.', 'H52.1', 'AO', { dx_tto: 'Atropina 0,01 % por la noche; gafas de desenfoque periférico',
          dx_ind: 'Dos horas al día al aire libre. Pausas con las pantallas.', dx_rev: '6 meses' }),
      };
    },
  },
  {
    id: 'ambliopia', label: 'Ambliopía / estrabismo infantil', weight: 2.5, age: [3, 9], medico: 'OPTOMETRÍA', refr: 'hipermetrope_infantil',
    interval: 90, visits: [1, 4], prest: REV,
    ant: (r) => ({ afam: r.chance(0.4) ? 'PADRE CON ESTRABISMO' : '', profesion: 'Estudiante', alNoC: true }),
    visit: (r, p, v) => {
      const amb = otro(p.ojo); // el ojo "vago"
      const mejora = Math.min(0.9, 0.3 + v.n * 0.15);
      return {
        mot: v.n === 0 ? 'En el colegio notan que tuerce un ojo.' : 'Revisión de oclusión. Lleva bien el parche.',
        ...avsc(amb === 'OD' ? mejora : 1.0, amb === 'OI' ? mejora : 1.0), ...refr(p, 'ciclo'),
        mo_ctl: v.n === 0 ? 'Endotropia' : 'Endoforia', mo_ctc: v.n === 0 ? 'Endotropia' : 'Endoforia',
        ...(v.n === 0 ? { mo_ctl_dp: String(r.int(10, 20)), mo_ctc_dp: String(r.int(15, 25)) } : {}), mo_estt: 'TNO', mo_este: String(v.n === 0 ? 480 : 120),
        ...dx(`Ambliopía ${amb}. Endotropía acomodativa.`, 'H53.0', amb, { dx_tto: `Gafa con corrección total. Oclusión ${p.ojo} ${v.n < 2 ? 3 : 2} h al día.`, dx_rev: '3 meses' }),
      };
    },
  },
  {
    id: 'presbicia', label: 'Presbicia', weight: 8, age: [42, 68], medico: 'OPTOMETRÍA', refr: 'emetrope',
    interval: 540, visits: [1, 2], prest: REV,
    ant: (r) => ({ alNoC: r.chance(0.8), profesion: r.pick(['Empleado/a', 'Autónomo/a', 'Jubilado/a']) }),
    visit: (r, p, v) => {
      const add = Math.min(2.5, 0.75 + (v.age - 42) * 0.1);
      return {
        mot: r.pick(['Necesita alejar el móvil para leer.', 'Le cuesta leer con poca luz.', 'Quiere graduarse para gafas progresivas.']),
        ...auto(p, r), ...refr(p, 'man', { avOD: 1.0, avOI: 1.0, add }), ...refr(p, 'rx', { avOD: 1.0, avOI: 1.0, add }),
        avc_od_esp: 'J4', avc_oi_esp: 'J4', ...pio(p.iop.od, p.iop.oi), ...bmcNormal(),
        ...dx('Presbicia.', 'H52.4', 'AO', { dx_tto: 'Gafas progresivas', dx_rev: '12 meses' }),
      };
    },
  },
  {
    id: 'ametropia', label: 'Revisión de graduación (miopía / astigmatismo)', weight: 8, age: [16, 45], medico: 'OPTOMETRÍA', refr: 'miope',
    interval: 400, visits: [1, 3], prest: REV,
    ant: (r) => ({ alNoC: r.chance(0.8), profesion: r.pick(['Estudiante', 'Empleado/a', 'Empleado/a', 'Autónomo/a']),
      aof: r.chance(0.4) ? 'PORTADOR/A DE LENTES DE CONTACTO' : '' }),
    visit: (r, p, v) => ({
      mot: r.pick(['Revisión de la graduación.', 'Ve peor de lejos, sobre todo conduciendo de noche.', 'Dolor de cabeza con el ordenador.']),
      ...refr(p, 'cp1', { avOD: 0.8, avOI: 0.8, esfShift: 0.25 }), ...auto(p, r), ...refr(p, 'man', { avOD: 1.0, avOI: 1.0, esfShift: -0.25 * v.n }),
      ...refr(p, 'rx', { avOD: 1.0, avOI: 1.0, esfShift: -0.25 * v.n }), ...pio(p.iop.od, p.iop.oi), ...bmcNormal(),
      ...dx(p.refr.od.cil < -0.75 ? 'Astigmatismo miópico AO.' : 'Miopía AO.', p.refr.od.cil < -0.75 ? 'H52.2' : 'H52.1', 'AO', { dx_tto: 'Nueva graduación de gafas', dx_rev: '12 meses' }),
    }),
  },
  {
    id: 'previo_refractiva', label: 'Estudio de cirugía refractiva', weight: 2.5, age: [21, 42], medico: 'OPTOMETRÍA', refr: 'miope',
    interval: 30, visits: [1, 2], prest: (n) => (n === 0 ? 'PREVIO REFRACTIVA' : 'NOTA MÉDICA'),
    ant: () => ({ aof: 'PORTADOR/A DE LENTES DE CONTACTO', alNoC: true, profesion: 'Empleado/a' }),
    visit: (r, p) => {
      const apto = p.sev < 0.8;
      return {
        mot: 'Quiere operarse para dejar las gafas.', ...auto(p, r), ...refr(p, 'man', { avOD: 1.0, avOI: 1.0 }),
        ...E('bmc', 'but', String(r.int(7, 12)), String(r.int(7, 12))), topo_eq: 'Pentacam',
        ...E('topo', 'k1', (42.5 + p.k * 2).toFixed(1), (42.6 + p.k * 2).toFixed(1)), ...E('topo', 'k2', (43.4 + p.k * 2).toFixed(1), (43.5 + p.k * 2).toFixed(1)),
        ...E('topo', 'paq', String(apto ? r.int(530, 575) : r.int(470, 495)), String(apto ? r.int(530, 575) : r.int(470, 495))),
        ...B('topo', 'pat', apto ? 'Pajarita simétrica' : 'Encurvamiento inferior'),
        topo_concl: apto ? 'Apto para cirugía refractiva' : 'No apto para cirugía refractiva',
        ...dx(apto ? 'Miopía AO. Apto/a para cirugía refractiva.' : 'Miopía AO. Córnea fina: no apto/a para LASIK.', 'H52.1', 'AO', {
          dx_qx: apto ? 'Cirugía refractiva' : 'No', dx_rev: '1 mes' }),
      };
    },
  },
  {
    id: 'revision_general', label: 'Revisión oftalmológica sin hallazgos', weight: 6, age: [20, 78], medico: 'DRA. SANZ', refr: 'emetrope',
    interval: 365, visits: [1, 2], prest: REV,
    ant: (r) => ({ alNoC: r.chance(0.7), ...(r.chance(0.2) ? { alergias: r.pick(['PENICILINA', 'AINES', 'SULFAMIDAS', 'LÁTEX']) } : {}) }),
    visit: (r, p, v) => ({
      mot: r.pick(['Revisión rutinaria.', 'Revisión anual, sin molestias.', 'Quiere revisarse porque su padre tiene glaucoma.']),
      ...refr(p, 'cp1', { avOD: 1.0, avOI: 1.0, add: v.age > 45 ? Math.min(2.5, 0.75 + (v.age - 42) * 0.1) : null }),
      ...pio(p.iop.od, p.iop.oi), ...bmcNormal(v.age > 65 ? 'Esclerosis nuclear +' : 'Transparente'), ...foNormal(r, 0.3),
      ...dx('Exploración oftalmológica dentro de la normalidad.', 'Z01.0', 'AO', { dx_rev: '12 meses' }),
    }),
  },
];

export const TEMPLATE_BY_ID = Object.fromEntries(TEMPLATES.map((t) => [t.id, t]));

/**
 * Perfil estable del paciente: SIEMPRE el mismo para el mismo HC.
 * `rng` debe estar sembrado con el HC (lo hace generator/index.js).
 */
export function makeProfile(rng, template) {
  const t = template;
  const esfBase = {
    miope: -rng.float(0.75, 6),
    miope_infantil: -rng.float(0.75, 3.5),
    hipermetrope: rng.float(0.5, 3),
    hipermetrope_infantil: rng.float(2, 5),
    emetrope: rng.float(-0.75, 1),
  }[t.refr] ?? 0;
  const eye = (delta) => {
    const cil = rng.chance(0.55) ? -rng.pick([0.25, 0.5, 0.75, 1, 1.25, 1.75]) : 0;
    return { esf: esfBase + delta, cil, eje: cil ? rng.pick([5, 10, 15, 90, 165, 170, 175, 180, 85, 95]) : 0 };
  };
  return {
    ojo: rng.pick(['OD', 'OI']),
    sev: rng(), // gravedad 0..1
    k: rng(), // otra variable 0..1 para dar variedad (curvaturas, longitudes...)
    iop: { od: rng.int(12, 18), oi: rng.int(12, 18) },
    refr: { od: eye(0), oi: eye(rng.pick([0, 0.25, -0.25, 0.5, -0.5])) },
  };
}
