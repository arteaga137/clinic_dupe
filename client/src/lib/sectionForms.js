// =====================================================================
// sectionForms.js — campos de las secciones de exploración y pruebas
// =====================================================================
// Motilidad, BMC anterior, Fondo de ojo, Diagnóstico y TTO, OCT,
// Angiografía, Campimetría, Topografía, Ecografía, Biometría, Recuento,
// Órbita/párpados, Oculoplastia y Estética.
//
// Igual que las tablas de refracción (GRIDS en fields.js), cada sección se
// DESCRIBE como datos y un solo componente (StructuredSection.jsx) la
// dibuja. Cada sección es una lista de "grupos" de dos tipos:
//
//   fields(título, ...campos) → campos sueltos (tipo de prueba, equipo,
//                               conclusión...). Clave: `${sección}_${id}`
//   eyes(título, ...filas)    → tabla con una fila por estructura y dos
//                               columnas, O.D. y O.I.
//                               Clave: `${sección}_${id}_od` / `_oi`
//
// Tipos de campo:
//   text     → texto corto          num     → número (con unidad)
//   select   → desplegable cerrado  suggest → texto libre CON sugerencias
//   area     → texto largo          check   → casilla sí/no
//
// "suggest" usa <datalist>: el navegador ofrece las opciones habituales,
// pero deja escribir cualquier otra cosa, como en la consulta real.
//
// ⚠️ Los valores son orientativos para PRACTICAR el manejo del programa.
//    No son una referencia clínica.
// =====================================================================

// ---- pequeñas funciones "fábrica" para escribir menos ----
const T = (id, l, o = {}) => ({ id, l, t: 'text', ...o });
const N = (id, l, unit = '', o = {}) => ({ id, l, t: 'num', unit, ...o });
const S = (id, l, opts, o = {}) => ({ id, l, t: 'select', opts: ['', ...opts], ...o });
const G = (id, l, opts, o = {}) => ({ id, l, t: 'suggest', opts, ...o });
const A = (id, l, o = {}) => ({ id, l, t: 'area', ...o });
const C = (id, l) => ({ id, l, t: 'check' });
const fields = (title, ...list) => ({ kind: 'fields', title, fields: list });
const eyes = (title, ...rows) => ({ kind: 'eyes', title, rows });

const OJO = ['OD', 'OI', 'AO'];
const REVISION = ['1 semana', '15 días', '1 mes', '3 meses', '6 meses', '12 meses', 'Alta'];
const CONSENT = 'Consentimiento informado firmado';

export const SECTION_FORMS = {
  // ------------------------------------------------------------------
  mo: [
    fields('Cover test',
      S('ctl', 'Cover test lejos', ['Ortoforia', 'Exoforia', 'Endoforia', 'Exotropia', 'Endotropia', 'Hipertropia OD', 'Hipertropia OI']),
      N('ctl_dp', 'Magnitud lejos', 'Δ'),
      S('ctc', 'Cover test cerca', ['Ortoforia', 'Exoforia', 'Endoforia', 'Exotropia', 'Endotropia', 'Hipertropia OD', 'Hipertropia OI']),
      N('ctc_dp', 'Magnitud cerca', 'Δ'),
    ),
    fields('Motilidad y visión binocular',
      S('vers', 'Versiones', ['Normales', 'Limitadas', 'Hiperfunción oblicuo inferior', 'Hipofunción recto lateral', 'Patrón en A', 'Patrón en V']),
      T('ducc', 'Ducciones', { placeholder: 'Completas en todas las posiciones' }),
      N('ppc', 'PPC (punto próximo de convergencia)', 'cm'),
      S('estt', 'Test de estereopsis', ['TNO', 'Titmus', 'Lang', 'Randot']),
      N('este', 'Estereopsis', '″ arco'),
      S('nist', 'Nistagmo', ['No', 'Horizontal', 'Vertical', 'Rotatorio', 'Latente']),
      S('dipl', 'Diplopía', ['No', 'Horizontal', 'Vertical', 'Oblicua', 'Monocular']),
      S('pup', 'Reflejos pupilares', ['Isocóricas y normorreactivas', 'Anisocoria', 'DPAR OD', 'DPAR OI', 'Arreactivas']),
      A('obs', 'Comentarios'),
    ),
  ],

  // ------------------------------------------------------------------
  bmc: [
    eyes('Biomicroscopía (lámpara de hendidura)',
      G('parp', 'Párpados / anejos', ['Normales', 'Blefaritis anterior', 'Disfunción de glándulas de Meibomio', 'Chalazión', 'Orzuelo', 'Dermatocalasia', 'Triquiasis']),
      G('conj', 'Conjuntiva', ['Normal', 'Hiperemia leve', 'Hiperemia moderada', 'Pinguécula', 'Pterigión', 'Hemorragia subconjuntival', 'Reacción folicular', 'Reacción papilar']),
      G('cornea', 'Córnea', ['Transparente', 'Queratitis punteada superficial', 'Úlcera corneal', 'Leucoma', 'Edema corneal', 'Guttas endoteliales', 'Precipitados queráticos']),
      S('fluo', 'Tinción fluoresceína', ['Negativa', 'Punteado inferior', 'Punteado difuso', 'Defecto epitelial', 'Seidel +']),
      N('but', 'BUT (tiempo de rotura lagrimal)', 's'),
      N('schir', 'Schirmer', 'mm/5 min'),
      G('ca', 'Cámara anterior', ['Formada y profunda', 'Estrecha', 'Tyndall +', 'Células +', 'Células ++', 'Hipopion', 'Hifema']),
      S('vh', 'Van Herick', ['Grado 4', 'Grado 3', 'Grado 2', 'Grado 1', 'Grado 0']),
      G('iris', 'Iris', ['Normal', 'Atrofia sectorial', 'Rubeosis', 'Sinequias posteriores', 'Transiluminación', 'Nevus']),
      G('pupila', 'Pupila', ['Redonda y reactiva', 'Midriática', 'Miótica', 'Discoria', 'Iridotomía permeable']),
      S('crist', 'Cristalino', ['Transparente', 'Esclerosis nuclear +', 'Catarata nuclear ++', 'Catarata nuclear +++', 'Catarata cortical', 'Catarata subcapsular posterior', 'Pseudofaquia (LIO en saco)', 'Opacidad de cápsula posterior', 'Afaquia']),
    ),
    fields('', A('obs', 'Comentarios')),
  ],

  // ------------------------------------------------------------------
  fo: [
    fields('Exploración',
      S('dil', 'Dilatación', ['No', 'Tropicamida 1%', 'Tropicamida 1% + fenilefrina 10%', 'Ciclopentolato 1%']),
      S('met', 'Método', ['Oftalmoscopía indirecta (BIO)', 'Lente 90D', 'Lente 78D', 'Lente de 3 espejos', 'Retinografía']),
    ),
    eyes('Fondo de ojo',
      G('vit', 'Vítreo', ['Transparente', 'Desprendimiento vítreo posterior', 'Miodesopsias', 'Hemorragia vítrea', 'Hialosis asteroide']),
      G('pap', 'Papila', ['Bordes nítidos, coloración normal', 'Palidez temporal', 'Palidez difusa', 'Edema de papila', 'Muesca inferior', 'Papila inclinada', 'Hemorragia en astilla']),
      S('ep', 'Excavación (E/P)', ['0.1', '0.2', '0.3', '0.4', '0.5', '0.6', '0.7', '0.8', '0.9', '1.0']),
      S('isnt', 'Regla ISNT', ['Cumple', 'No cumple']),
      G('mac', 'Mácula', ['Brillo foveal conservado', 'Drusas duras', 'Drusas blandas', 'Alteración pigmentaria', 'Membrana epirretiniana', 'Edema macular', 'Agujero macular', 'Cicatriz disciforme']),
      G('vas', 'Vasos', ['Normales', 'Cruces AV patológicos', 'Estrechamiento arteriolar', 'Tortuosidad venosa', 'Microaneurismas', 'Hemorragias en llama', 'Exudados duros']),
      G('per', 'Periferia', ['Retina aplicada 360°', 'Degeneración en empalizada', 'Desgarro retiniano', 'Desprendimiento de retina', 'Láser previo', 'Blanco sin presión']),
    ),
    fields('',
      S('rd', 'Retinopatía diabética', ['No', 'RDNP leve', 'RDNP moderada', 'RDNP severa', 'RD proliferativa', 'No valorable']),
      A('obs', 'Comentarios'),
    ),
  ],

  // ------------------------------------------------------------------
  dx: [
    fields('Diagnóstico',
      A('dx', 'Diagnóstico principal'),
      T('cie', 'Código CIE-10', { placeholder: 'p. ej. H40.1' }),
      S('ojo', 'Ojo', OJO),
      A('dx2', 'Diagnósticos secundarios'),
    ),
    fields('Tratamiento',
      A('tto', 'Tratamiento'),
      A('pauta', 'Posología / pauta', { placeholder: '1 gota cada 12 h en AO' }),
      A('ind', 'Indicaciones al paciente'),
    ),
    fields('Pruebas solicitadas',
      C('p_oct', 'OCT'), C('p_camp', 'Campimetría'), C('p_topo', 'Topografía'), C('p_bio', 'Biometría'),
      C('p_ang', 'Angiografía'), C('p_eco', 'Ecografía'), C('p_rec', 'Recuento endotelial'), C('p_ret', 'Retinografía'),
    ),
    fields('Plan',
      S('qx', 'Propuesta quirúrgica', ['No', 'Facoemulsificación + LIO OD', 'Facoemulsificación + LIO OI', 'Capsulotomía YAG', 'Iridotomía láser', 'Trabeculoplastia láser (SLT)', 'Trabeculectomía', 'Inyección intravítrea', 'Vitrectomía', 'Cirugía refractiva', 'Blefaroplastia']),
      S('rev', 'Próxima revisión', REVISION),
    ),
  ],

  // ------------------------------------------------------------------
  oct: [
    fields('Prueba',
      S('tipo', 'Tipo de OCT', ['Mácula', 'Nervio óptico (CFNR)', 'Mácula + nervio óptico', 'Segmento anterior', 'OCT-angiografía']),
      S('eq', 'Equipo', ['Cirrus HD-OCT', 'Spectralis', 'Topcon Triton', 'Topcon Maestro']),
    ),
    eyes('Resultados',
      N('cal', 'Calidad de señal', '/10'),
      N('gmc', 'Grosor macular central', 'µm'),
      N('vol', 'Volumen macular', 'mm³'),
      N('cfnr', 'CFNR medio', 'µm'),
      N('cfnrs', 'CFNR superior', 'µm'),
      N('cfnri', 'CFNR inferior', 'µm'),
      N('ep', 'Relación E/P (vertical)', ''),
      N('ccg', 'Complejo de células ganglionares', 'µm'),
      G('hall', 'Hallazgos', ['Normal', 'Perfil foveal conservado', 'Líquido subretiniano', 'Líquido intrarretiniano', 'Membrana epirretiniana', 'Tracción vitreomacular', 'Adelgazamiento CFNR', 'Desprendimiento del EPR', 'Drusas']),
    ),
    fields('', A('interp', 'Interpretación')),
  ],

  // ------------------------------------------------------------------
  ang: [
    fields('Prueba',
      S('tipo', 'Tipo', ['Angiografía fluoresceínica (AGF)', 'Verde de indocianina (ICG)', 'AGF + ICG', 'OCT-angiografía']),
      T('contr', 'Contraste / dosis', { placeholder: 'Fluoresceína sódica 10 %, 5 ml i.v.' }),
      S('reac', 'Reacciones adversas', ['Ninguna', 'Náuseas', 'Vómitos', 'Urticaria', 'Reacción vasovagal']),
      C('cons', CONSENT),
    ),
    eyes('Resultados',
      N('tbr', 'Tiempo brazo-retina', 's'),
      G('art', 'Fase arterial / venosa', ['Llenado normal', 'Retraso de llenado arterial', 'Retraso de llenado venoso']),
      G('mac', 'Mácula', ['Normal', 'Fuga en petaloide', 'Neovascularización coroidea', 'Efecto ventana', 'Hipofluorescencia por bloqueo']),
      G('hall', 'Otros hallazgos', ['Sin alteraciones', 'Áreas de no perfusión', 'Neovasos retinianos', 'Microaneurismas', 'Fuga papilar', 'Tinción de pared vascular']),
    ),
    fields('', A('concl', 'Conclusión')),
  ],

  // ------------------------------------------------------------------
  camp: [
    fields('Prueba',
      S('eq', 'Perímetro', ['Humphrey HFA3', 'Octopus 900', 'Easyfield']),
      S('est', 'Estrategia', ['24-2 SITA Standard', '24-2 SITA Fast', '24-2C SITA Faster', '30-2 SITA Standard', '10-2 SITA Standard', 'Esterman binocular']),
      T('corr', 'Corrección utilizada', { placeholder: '+1.50 esf. (cerca)' }),
    ),
    eyes('Resultados',
      T('pf', 'Pérdidas de fijación', { placeholder: '0/15' }),
      N('fp', 'Falsos positivos', '%'),
      N('fn', 'Falsos negativos', '%'),
      N('md', 'DM (desviación media)', 'dB'),
      N('psd', 'DSM (desviación estándar del patrón)', 'dB'),
      N('vfi', 'VFI', '%'),
      S('ght', 'GHT', ['Dentro de límites normales', 'Límite', 'Fuera de límites normales', 'Sensibilidad general reducida']),
      G('def', 'Defectos', ['Sin defectos', 'Escalón nasal', 'Arcuato superior', 'Arcuato inferior', 'Defecto paracentral', 'Constricción concéntrica', 'Hemianopsia']),
    ),
    fields('',
      S('fiab', 'Fiabilidad', ['Fiable', 'Poco fiable', 'No valorable']),
      A('interp', 'Interpretación'),
    ),
  ],

  // ------------------------------------------------------------------
  topo: [
    fields('Prueba', S('eq', 'Equipo', ['Pentacam', 'Orbscan', 'Sirius', 'Galilei', 'Topógrafo de Plácido'])),
    eyes('Resultados',
      N('k1', 'K1 (plano)', 'D'),
      N('k2', 'K2 (curvo)', 'D'),
      N('kmax', 'Kmáx', 'D'),
      N('ast', 'Astigmatismo corneal', 'D'),
      N('eje', 'Eje', '°'),
      N('paq', 'Paquimetría mínima', 'µm'),
      N('q', 'Asfericidad (Q)', ''),
      N('bad', 'Índice BAD-D', ''),
      S('pat', 'Patrón', ['Redondo', 'Oval', 'Pajarita simétrica', 'Pajarita asimétrica', 'Encurvamiento inferior', 'Irregular']),
    ),
    fields('',
      S('concl', 'Conclusión', ['Normal', 'Sospecha de queratocono', 'Queratocono', 'Apto para cirugía refractiva', 'No apto para cirugía refractiva']),
      A('obs', 'Comentarios'),
    ),
  ],

  // ------------------------------------------------------------------
  eco: [
    fields('Prueba',
      S('modo', 'Modo', ['Modo B', 'Modo A', 'Modo A + B', 'Biomicroscopía ultrasónica (BMU)']),
      T('ind', 'Indicación', { placeholder: 'Opacidad de medios / hemorragia vítrea' }),
    ),
    eyes('Resultados',
      G('vit', 'Vítreo', ['Anecoico', 'Ecos puntiformes móviles', 'Hemorragia vítrea', 'DVP completo', 'DVP incompleto']),
      G('ret', 'Retina', ['Aplicada', 'Desprendimiento de retina', 'Desgarro con opérculo']),
      G('cor', 'Coroides', ['Normal', 'Desprendimiento coroideo', 'Masa sólida', 'Engrosamiento']),
      G('no', 'Nervio óptico', ['Normal', 'Drusas papilares', 'Ensanchamiento de vaina']),
      N('la', 'Longitud axial', 'mm'),
    ),
    fields('', A('concl', 'Conclusión')),
  ],

  // ------------------------------------------------------------------
  bio: [
    fields('Prueba',
      S('eq', 'Biómetro', ['IOLMaster 700', 'Lenstar LS 900', 'Argos', 'Biometría de contacto (modo A)']),
      S('form', 'Fórmula', ['Barrett Universal II', 'Kane', 'SRK/T', 'Haigis', 'Hoffer Q', 'Holladay 1']),
      S('lio', 'Tipo de LIO', ['Monofocal', 'Monofocal tórica', 'Rango extendido (EDOF)', 'Trifocal', 'Trifocal tórica']),
    ),
    eyes('Medidas y cálculo',
      N('la', 'Longitud axial', 'mm'),
      N('k1', 'K1', 'D'),
      N('k2', 'K2', 'D'),
      N('acd', 'Profundidad de cámara anterior (ACD)', 'mm'),
      N('lt', 'Grosor del cristalino', 'mm'),
      N('wtw', 'Blanco-blanco (WTW)', 'mm'),
      N('pot', 'Potencia de LIO elegida', 'D'),
      N('obj', 'Refracción objetivo', 'D'),
    ),
    fields('', A('obs', 'Comentarios')),
  ],

  // ------------------------------------------------------------------
  rec: [
    fields('Prueba', S('eq', 'Equipo', ['Microscopio especular (sin contacto)', 'Microscopio confocal'])),
    eyes('Resultados',
      N('dens', 'Densidad endotelial', 'cél/mm²'),
      N('cv', 'Coeficiente de variación', '%'),
      N('hex', 'Hexagonalidad', '%'),
      N('paq', 'Paquimetría central', 'µm'),
      G('morf', 'Morfología', ['Normal', 'Polimegatismo', 'Pleomorfismo', 'Guttas', 'No valorable']),
    ),
    fields('', A('obs', 'Comentarios')),
  ],

  // ------------------------------------------------------------------
  orb: [
    fields('Exoftalmometría', N('base', 'Base del exoftalmómetro', 'mm')),
    eyes('Órbita y párpados',
      N('hertel', 'Exoftalmometría (Hertel)', 'mm'),
      N('mrd1', 'MRD1', 'mm'),
      N('mrd2', 'MRD2', 'mm'),
      N('fe', 'Función del elevador', 'mm'),
      N('surco', 'Altura del surco palpebral', 'mm'),
      N('lago', 'Lagoftalmos', 'mm'),
      G('pos', 'Posición palpebral', ['Normal', 'Ptosis', 'Retracción palpebral', 'Ectropión', 'Entropión', 'Dermatocalasia']),
      G('via', 'Vía lagrimal', ['Permeable', 'Obstrucción', 'Reflujo por punto superior', 'Epífora', 'Estenosis de punto lagrimal']),
    ),
    fields('', A('obs', 'Comentarios')),
  ],

  // ------------------------------------------------------------------
  ocp: [
    fields('Valoración',
      A('dx', 'Diagnóstico oculoplástico'),
      S('proc', 'Procedimiento propuesto', ['Blefaroplastia superior', 'Blefaroplastia inferior', 'Cirugía de ptosis', 'Corrección de ectropión', 'Corrección de entropión', 'Extirpación de chalazión', 'Biopsia de lesión palpebral', 'Dacriocistorrinostomía (DCR)', 'Sondaje de vía lagrimal']),
      S('ojo', 'Ojo', OJO),
      S('anest', 'Anestesia', ['Local', 'Local + sedación', 'General']),
      C('fotos', 'Fotografías preoperatorias realizadas'),
      C('cons', CONSENT),
      A('plan', 'Plan / observaciones'),
    ),
  ],

  // ------------------------------------------------------------------
  est: [
    fields('Tratamiento',
      S('trat', 'Tratamiento', ['Toxina botulínica', 'Ácido hialurónico', 'Bioestimulador', 'Peeling químico', 'Radiofrecuencia', 'Plasma rico en plaquetas']),
      G('zona', 'Zona', ['Patas de gallo', 'Entrecejo', 'Frente', 'Surco lagrimal / ojera', 'Párpado inferior', 'Cola de ceja']),
      T('dosis', 'Unidades / volumen', { placeholder: '12 U por lado' }),
      T('lote', 'Producto / nº de lote'),
      C('cons', CONSENT),
      C('fotos', 'Fotografías antes/después'),
      S('prox', 'Próxima sesión', ['15 días (retoque)', '3 meses', '4 meses', '6 meses', '12 meses']),
      A('obs', 'Comentarios'),
    ),
  ],
};

/** Clave de un campo suelto: fieldKey('fo', 'dil') → 'fo_dil'. */
export const fieldKey = (sec, id) => `${sec}_${id}`;
/** Clave de una fila por ojo: eyeKey('fo', 'ep', 'od') → 'fo_ep_od'. */
export const eyeKey = (sec, id, eye) => `${sec}_${id}_${eye}`;

/** Todas las claves de una sección, y cuáles son casillas (booleanas). */
export function sectionKeys(sec) {
  const keys = [];
  const bools = [];
  for (const g of SECTION_FORMS[sec]) {
    if (g.kind === 'fields') {
      for (const f of g.fields) {
        keys.push(fieldKey(sec, f.id));
        if (f.t === 'check') bools.push(fieldKey(sec, f.id));
      }
    } else {
      for (const r of g.rows) keys.push(eyeKey(sec, r.id, 'od'), eyeKey(sec, r.id, 'oi'));
    }
  }
  return { keys, bools };
}
