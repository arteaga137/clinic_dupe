// =====================================================================
// seedData.js — CASOS CLÍNICOS de práctica (100 % ficticios)
// =====================================================================
// Cada paciente es un "caso" con una patología coherente de principio a
// fin: antecedentes, visitas anteriores con exploración, pruebas,
// diagnóstico y tratamiento, y (a veces) su próxima cita.
//
// Las fechas son RELATIVAS a hoy, para que los datos parezcan siempre
// recientes, se cargue la base de datos el día que se cargue:
//   hace: 90      → la visita fue hace 90 días naturales
//   haceLab: 3    → hace 3 días LABORABLES; además se crea en la agenda
//                   la cita de ese día (atendida) enlazada a la visita
//   proxima: { en: 5, ... } → cita dentro de 5 días laborables (0 = hoy)
//
// ⚠️ Nombres, números y datos inventados, pensados para PRACTICAR el
//    manejo del programa. No son una referencia clínica.
// =====================================================================

// Profesionales (deben coincidir con PROFESIONALES del frontend).
const L = 'Sanz Molina, Laura';
const M = 'Molina Pardo, Andrés';
const O = 'Ortega Gil, Pablo';

// ---- Ayudantes para escribir menos ----
/** Fila por ojo: eye('fo', 'ep', '0.7', '0.6') → { fo_ep_od: '0.7', fo_ep_oi: '0.6' } */
const eye = (sec, field, od, oi) => ({ [`${sec}_${field}_od`]: od, [`${sec}_${field}_oi`]: oi });
/** Lo mismo con el mismo valor en ambos ojos. */
const both = (sec, field, value) => eye(sec, field, value, value);
/** Refracción: rx('man', ['-2.00', '-0.50', '180', '1.0'], [...]) → esfera, cilindro, eje, AV. */
const rx = (grid, od = [], oi = []) => {
  const cols = ['esf', 'cil', 'eje', 'av'];
  const out = {};
  cols.forEach((c, i) => {
    if (od[i] !== undefined) out[`${grid}_od_${c}`] = od[i];
    if (oi[i] !== undefined) out[`${grid}_oi_${c}`] = oi[i];
  });
  return out;
};

// Citas de HOY (hora, ticket, nota, médico, HC, prestación, estado, urgente):
// se mantienen fijas para que la agenda de hoy tenga todos los estados.
export const TODAY_APPOINTMENTS = [
  ['10:00', 'CRL-5', '', 'DRA. SANZ', '700103', 'PRIMERA CONSULTA', 'atendido'],
  ['10:10', 'BSA-3', '', 'DRA. SANZ', '700102', 'PRIMERA CONSULTA', 'atendido'],
  ['10:30', 'DFR-1', '', 'DRA. SANZ', '700104', 'REVISIÓN', 'sala'],
  ['10:50', 'ELP-2', 'Trae informe', 'DRA. SANZ', '700105', 'REVISIÓN POSTOPERATORIA', 'sala'],
  ['11:00', 'HCT-4', 'Urgencia', 'DRA. SANZ', '700108', 'CONSULTA URGENCIAS', 'sala', true],
  ['11:20', 'APM-1', '', 'DRA. SANZ', '700101', 'REVISIÓN', 'citado'],
  ['11:40', 'GVI-1', '', 'DR. MOLINA', '700107', 'LÁSER ARGÓN', 'citado'],
  ['12:00', 'FOJ-9', 'Dilatar', 'DRA. SANZ', '700106', 'PRIMERA CONSULTA', 'citado'],
  ['12:15', 'JRA-3', '', 'OPTOMETRÍA', '700110', 'REVISIÓN', 'citado'],
  ['12:30', 'LSN-1', '', 'OPTOMETRÍA', '700111', 'PREVIO REFRACTIVA', 'citado'],
  ['16:00', 'IMC-2', 'Carpeta ok', 'DR. MOLINA', '700109', 'PREVIO CATARATA', 'citado'],
  ['16:30', 'MAS-1', '', 'DR. MOLINA', '700112', 'NOTA MÉDICA', 'citado'],
];

export const CASES = [
  // ================= Pacientes originales =================
  { hc: '700101', nombre: 'Álvarez Prieto, Marta', nacimiento: '1968-02-14', sociedad: 'SANITAS, S.A.',
    antecedentes: { ap: 'HTA', hta: true, aqx: 'FACOEMULSIFICACIÓN + LIO OD (2021)', alergias: 'PENICILINA', medsis: 'ENALAPRIL 10 MG' },
    visitas: [{ hace: 200, prof: L, prest: 'REVISIÓN', data: {
      mot: 'Revisión anual. Refiere buena visión de lejos.',
      ...rx('cp1', ['+1.25', '-0.50', '90', '0.8'], ['+1.50', '-0.75', '85', '0.7']),
      ten_ton: 'Aire (NCT)', ten1_od: '15', ten1_oi: '16',
      ...both('bmc', 'conj', 'Normal'), ...both('bmc', 'cornea', 'Transparente'), ...both('bmc', 'ca', 'Formada y profunda'),
      ...eye('bmc', 'crist', 'Pseudofaquia (LIO en saco)', 'Esclerosis nuclear +'),
      fo_met: 'Lente 90D', ...both('fo', 'pap', 'Bordes nítidos, coloración normal'), ...both('fo', 'ep', '0.3'),
      ...eye('fo', 'mac', 'Brillo foveal conservado', 'Drusas duras'),
      dx_dx: 'Pseudofaquia OD. Catarata incipiente OI.', dx_cie: 'H25.1', dx_ojo: 'OI', dx_rev: '12 meses' } }] },

  { hc: '700102', nombre: 'Benítez Soler, Andrés', nacimiento: '1992-07-03', sociedad: 'PRIVADO' },
  { hc: '700103', nombre: 'Castaño Ruiz, Lucía', nacimiento: '2016-05-21', sociedad: 'DKV SEGUROS, S.A.',
    antecedentes: { afam: 'MADRE CON MIOPÍA ALTA', profesion: 'Estudiante' } },

  { hc: '700104', nombre: 'Delgado Ferrer, Ramón', nacimiento: '1953-11-09', sociedad: 'SEGUR CAIXA ADESLAS',
    antecedentes: { aof: 'GLAUCOMA CRÓNICO AO', med: 'TIMOLOL 0,5% C/12H AO', alNoC: true, profesion: 'Jubilado/a' },
    visitas: [
      { hace: 202, prof: L, prest: 'REVISIÓN', data: {
        ten_ton: 'Goldmann', ten1_od: '22', ten1_oi: '21',
        fo_dil: 'Tropicamida 1%', fo_met: 'Lente 90D', ...eye('fo', 'ep', '0.7', '0.6'), ...eye('fo', 'isnt', 'No cumple', 'Cumple'),
        ...eye('fo', 'pap', 'Muesca inferior', 'Bordes nítidos, coloración normal'),
        dx_dx: 'PIO elevada AO. Sospecha de glaucoma.', dx_tto: 'Timolol 0,5 % colirio', dx_pauta: '1 gota cada 12 h en AO',
        dx_p_oct: true, dx_p_camp: true, dx_rev: '3 meses' } },
      { hace: 105, prof: L, prest: 'REVISIÓN', data: {
        ten_ton: 'Goldmann', ten1_od: '18', ten1_oi: '19', paq_od: '540', paq_oi: '545',
        oct_tipo: 'Nervio óptico (CFNR)', oct_eq: 'Cirrus HD-OCT', ...eye('oct', 'cal', '8', '9'),
        ...eye('oct', 'cfnr', '74', '86'), ...eye('oct', 'cfnri', '68', '104'), ...eye('oct', 'hall', 'Adelgazamiento CFNR', 'Normal'),
        camp_eq: 'Humphrey HFA3', camp_est: '24-2 SITA Standard', camp_fiab: 'Fiable',
        ...eye('camp', 'md', '-4.21', '-1.05'), ...eye('camp', 'psd', '5.80', '1.92'), ...eye('camp', 'vfi', '89', '98'),
        ...eye('camp', 'ght', 'Fuera de límites normales', 'Dentro de límites normales'), ...eye('camp', 'def', 'Arcuato superior', 'Sin defectos'),
        dx_dx: 'Glaucoma crónico de ángulo abierto AO. Estable.', dx_cie: 'H40.11', dx_ojo: 'AO',
        dx_tto: 'Continuar timolol 0,5 % colirio', dx_pauta: '1 gota cada 12 h en AO', dx_rev: '3 meses' } },
    ] },

  { hc: '700105', nombre: 'Escudero Lima, Paula', nacimiento: '1981-09-30', sociedad: 'ASISA, S.A.', antecedentes: { aqx: 'LASIK AO (2019)' } },
  { hc: '700106', nombre: 'Fuentes Olmo, Javier', nacimiento: '1975-01-18', sociedad: 'MAPFRE ESPAÑA, CIA.' },
  { hc: '700107', nombre: 'García Valls, Inés', nacimiento: '1959-04-02', sociedad: 'PRIVADO',
    antecedentes: { ap: 'DIABETES TIPO 2', diabetes: true, medsis: 'METFORMINA' } },
  { hc: '700108', nombre: 'Herrera Campos, Tomás', nacimiento: '1996-12-11', sociedad: 'SANITAS, S.A.' },

  { hc: '700109', nombre: 'Iglesias Mora, Carmen', nacimiento: '1962-08-25', sociedad: 'SEGUR CAIXA ADESLAS',
    antecedentes: { alergias: 'AINES' },
    visitas: [{ hace: 70, prof: L, prest: 'PRIMERA CONSULTA', data: {
      mot: 'Visión borrosa progresiva en OD, deslumbramiento al conducir de noche.',
      ...eye('bmc', 'crist', 'Catarata nuclear +++', 'Catarata nuclear ++'), ...both('bmc', 'ca', 'Formada y profunda'),
      fo_dil: 'Tropicamida 1% + fenilefrina 10%', fo_met: 'Oftalmoscopía indirecta (BIO)',
      ...both('fo', 'mac', 'Brillo foveal conservado'), ...both('fo', 'per', 'Retina aplicada 360°'),
      dx_dx: 'Catarata nuclear senil AO, más avanzada en OD.', dx_cie: 'H25.1', dx_ojo: 'AO',
      dx_p_bio: true, dx_p_rec: true, dx_qx: 'Facoemulsificación + LIO OD', dx_rev: '1 mes' } }] },

  { hc: '700110', nombre: 'Jiménez Roca, Álvaro', nacimiento: '1986-03-07', sociedad: 'DKV SEGUROS, S.A.' },
  { hc: '700111', nombre: 'López Serrano, Nuria', nacimiento: '1970-10-19', sociedad: 'SANITAS, S.A.',
    visitas: [{ hace: 238, prof: O, prest: 'REVISIÓN', data: rx('cp1', ['-2.25', undefined, undefined, '1.0'], ['-2.50', '-0.25', '170', '0.9']) }] },
  { hc: '700112', nombre: 'Martín Aguado, Sergio', nacimiento: '1977-06-28', sociedad: 'PRIVADO' },

  // ================= Casos nuevos =================
  // --- RETINA ---
  { hc: '700113', nombre: 'Navarro Gil, Teresa', nacimiento: '1948-03-12', sociedad: 'SANITAS, S.A.',
    antecedentes: { ap: 'HTA, DISLIPEMIA', hta: true, medsis: 'AMLODIPINO 5 MG, ATORVASTATINA 20 MG', aof: 'DMAE EXUDATIVA OI', aqx: 'FACOEMULSIFICACIÓN + LIO AO (2018)', alNoC: true, profesion: 'Jubilado/a' },
    visitas: [
      { hace: 90, prof: L, prest: 'CONSULTA URGENCIAS', data: {
        mot: 'Ve las líneas rectas torcidas y una mancha central con OI desde hace 10 días.',
        ...rx('cp1', ['+0.50', '-0.75', '95', '0.6'], ['+0.25', '-1.00', '80', '0.2']),
        ...both('bmc', 'crist', 'Pseudofaquia (LIO en saco)'),
        fo_dil: 'Tropicamida 1%', fo_met: 'Lente 90D', ...eye('fo', 'mac', 'Drusas blandas', 'Neovascularización coroidea'),
        oct_tipo: 'Mácula', oct_eq: 'Spectralis', ...eye('oct', 'gmc', '268', '412'), ...eye('oct', 'hall', 'Drusas', 'Líquido subretiniano'),
        ang_tipo: 'OCT-angiografía', ...eye('ang', 'mac', 'Normal', 'Neovascularización coroidea'), ang_reac: 'Ninguna',
        dx_dx: 'DMAE exudativa (neovascular) OI. DMAE seca OD.', dx_cie: 'H35.32', dx_ojo: 'OI',
        dx_tto: 'Inyecciones intravítreas anti-VEGF OI: 3 dosis de carga mensuales', dx_qx: 'Inyección intravítrea',
        dx_ind: 'Rejilla de Amsler diaria con cada ojo. Acudir si nota cambios.', dx_rev: '1 mes' } },
      { hace: 30, prof: L, prest: 'REVISIÓN', data: {
        mot: '3.ª inyección OI. Nota mejoría.', ...rx('cp1', [undefined, undefined, undefined, '0.6'], [undefined, undefined, undefined, '0.4']),
        oct_tipo: 'Mácula', oct_eq: 'Spectralis', ...eye('oct', 'gmc', '266', '301'), ...eye('oct', 'hall', 'Drusas', 'Desprendimiento del EPR'),
        oct_interp: 'Reabsorción del líquido subretiniano OI tras la fase de carga.',
        dx_dx: 'DMAE exudativa OI inactiva tras carga.', dx_cie: 'H35.32', dx_ojo: 'OI',
        dx_tto: 'Pauta "tratar y extender": siguiente inyección en 6 semanas', dx_qx: 'Inyección intravítrea', dx_rev: '1 mes' } },
    ],
    proxima: { en: 3, prest: 'REVISIÓN', medico: 'DRA. SANZ', nota: 'OCT antes de consulta' } },

  { hc: '700114', nombre: 'Ortiz Blanco, Manuel', nacimiento: '1961-07-22', sociedad: 'SEGUR CAIXA ADESLAS',
    antecedentes: { ap: 'DM TIPO 2 (15 AÑOS), HTA', diabetes: true, hta: true, medsis: 'METFORMINA 850 MG, INSULINA GLARGINA, ENALAPRIL 20 MG', profesion: 'Empleado/a' },
    visitas: [{ hace: 60, prof: L, prest: 'REVISIÓN', data: {
      mot: 'Control anual de diabetes. Refiere visión algo borrosa con OD.',
      ...rx('cp1', ['+0.75', undefined, undefined, '0.5'], ['+0.50', undefined, undefined, '0.9']),
      ten_ton: 'Aire (NCT)', ten1_od: '16', ten1_oi: '15',
      ...both('bmc', 'crist', 'Esclerosis nuclear +'),
      fo_dil: 'Tropicamida 1% + fenilefrina 10%', fo_met: 'Oftalmoscopía indirecta (BIO)',
      ...eye('fo', 'mac', 'Edema macular', 'Brillo foveal conservado'), ...both('fo', 'vas', 'Microaneurismas'),
      ...both('fo', 'per', 'Retina aplicada 360°'), fo_rd: 'RDNP moderada',
      fo_obs: 'Hemorragias puntiformes y exudados duros en polo posterior OD.',
      oct_tipo: 'Mácula', oct_eq: 'Cirrus HD-OCT', ...eye('oct', 'gmc', '385', '262'), ...eye('oct', 'hall', 'Líquido intrarretiniano', 'Perfil foveal conservado'),
      dx_dx: 'Retinopatía diabética no proliferativa moderada AO. Edema macular diabético clínicamente significativo OD.',
      dx_cie: 'E11.3', dx_ojo: 'AO', dx_tto: 'Inyección intravítrea anti-VEGF OD', dx_qx: 'Inyección intravítrea',
      dx_ind: 'Buen control de glucosa, tensión arterial y colesterol.', dx_p_ang: true, dx_rev: '1 mes' } }],
    proxima: { en: 2, prest: 'REVISIÓN', medico: 'DRA. SANZ', nota: 'Dilatar' } },

  { hc: '700119', nombre: 'Toledo Cano, Ernesto', nacimiento: '1958-05-30', sociedad: 'MAPFRE ESPAÑA, CIA.',
    antecedentes: { ap: 'HTA, FUMADOR 20 CIG/DÍA', hta: true, medsis: 'LOSARTÁN 50 MG, ÁCIDO ACETILSALICÍLICO 100 MG' },
    visitas: [{ hace: 25, prof: L, prest: 'CONSULTA URGENCIAS', data: {
      mot: 'Pérdida de visión brusca e indolora en OI hace una semana.',
      ...avl('0.9', '0.3'),
      ten_ton: 'Goldmann', ten1_od: '15', ten1_oi: '16',
      fo_dil: 'Tropicamida 1%', fo_met: 'Oftalmoscopía indirecta (BIO)',
      ...eye('fo', 'vas', 'Cruces AV patológicos', 'Hemorragias en llama'), ...eye('fo', 'mac', 'Brillo foveal conservado', 'Edema macular'),
      oct_tipo: 'Mácula', oct_eq: 'Spectralis', ...eye('oct', 'gmc', '255', '498'), ...eye('oct', 'hall', 'Normal', 'Líquido intrarretiniano'),
      ang_tipo: 'Angiografía fluoresceínica (AGF)', ang_contr: 'Fluoresceína sódica 10 %, 5 ml i.v.', ang_reac: 'Ninguna', ang_cons: true,
      ...eye('ang', 'tbr', '12', '13'), ...eye('ang', 'hall', 'Sin alteraciones', 'Áreas de no perfusión'),
      ang_concl: 'Oclusión de rama venosa temporal superior OI con edema macular. No perfusión < 5 diámetros papilares.',
      dx_dx: 'Oclusión de rama venosa temporal superior OI con edema macular.', dx_cie: 'H34.83', dx_ojo: 'OI',
      dx_tto: 'Inyección intravítrea anti-VEGF OI mensual', dx_qx: 'Inyección intravítrea',
      dx_ind: 'Control de la tensión arterial por su médico de cabecera. Dejar de fumar.', dx_rev: '1 mes' } }],
    proxima: { en: 6, prest: 'REVISIÓN', medico: 'DRA. SANZ' } },

  { hc: '700120', nombre: 'Urrutia Pons, Gloria', nacimiento: '1952-01-19', sociedad: 'ASISA, S.A.',
    antecedentes: { aqx: 'FACOEMULSIFICACIÓN + LIO AO (2020)', alNoC: true, profesion: 'Jubilado/a' },
    visitas: [{ hace: 45, prof: M, prest: 'PRIMERA CONSULTA', data: {
      mot: 'Ve las líneas torcidas con OD desde hace meses. Le cuesta leer.',
      ...rx('cp1', ['-0.25', '-0.50', '100', '0.4'], ['0.00', '-0.50', '85', '0.9']),
      ...both('bmc', 'crist', 'Pseudofaquia (LIO en saco)'),
      fo_dil: 'Tropicamida 1%', fo_met: 'Lente 90D', ...eye('fo', 'mac', 'Membrana epirretiniana', 'Brillo foveal conservado'),
      oct_tipo: 'Mácula', oct_eq: 'Topcon Triton', ...eye('oct', 'gmc', '452', '248'), ...eye('oct', 'hall', 'Membrana epirretiniana', 'Perfil foveal conservado'),
      oct_interp: 'Membrana epirretiniana OD con pérdida de la depresión foveal y engrosamiento macular.',
      dx_dx: 'Membrana epirretiniana macular OD sintomática.', dx_cie: 'H35.37', dx_ojo: 'OD',
      dx_qx: 'Vitrectomía', dx_ind: 'Rejilla de Amsler. Se explica la cirugía (vitrectomía + pelado de membrana).', dx_rev: '1 mes' } }],
    proxima: { en: 8, prest: 'NOTA MÉDICA', medico: 'DR. MOLINA', nota: 'Consentimiento vitrectomía' } },

  { hc: '700121', nombre: 'Vega Lozano, Alberto', nacimiento: '1981-11-11', sociedad: 'SANITAS, S.A.',
    antecedentes: { aof: 'MIOPÍA MAGNA AO (-9 D)', aqx: 'VITRECTOMÍA + GAS OI (DR)', profesion: 'Empleado/a' },
    visitas: [
      { hace: 20, prof: M, prest: 'CONSULTA URGENCIAS', data: {
        mot: 'Destellos y "cortinilla" en el campo superior del OI desde ayer.',
        ...avl('1.0', '0.8'),
        fo_dil: 'Tropicamida 1% + fenilefrina 10%', fo_met: 'Oftalmoscopía indirecta (BIO)',
        ...eye('fo', 'vit', 'Desprendimiento vítreo posterior', 'Desprendimiento vítreo posterior'),
        ...eye('fo', 'per', 'Degeneración en empalizada', 'Desprendimiento de retina'), ...both('fo', 'mac', 'Brillo foveal conservado'),
        fo_obs: 'OI: desprendimiento de retina inferior de 5 a 8 h, mácula aplicada. Desgarro en herradura a las 7 h.',
        dx_dx: 'Desprendimiento de retina regmatógeno OI con mácula aplicada.', dx_cie: 'H33.0', dx_ojo: 'OI',
        dx_qx: 'Vitrectomía', dx_ind: 'Cirugía urgente. Reposo relativo hasta la intervención.', dx_rev: '1 semana' } },
      { haceLab: 5, prof: M, prest: 'REVISIÓN POSTOPERATORIA', data: {
        mot: 'Primera semana tras vitrectomía + gas SF6 OI. Molestias leves.',
        ...avl('1.0', 'CD'),
        ten_ton: 'iCare', ten1_od: '15', ten1_oi: '27',
        ...eye('bmc', 'conj', 'Normal', 'Hiperemia leve'), ...eye('bmc', 'ca', 'Formada y profunda', 'Células +'),
        fo_met: 'Oftalmoscopía indirecta (BIO)', ...eye('fo', 'vit', 'Transparente', 'Burbuja de gas 60 %'),
        ...eye('fo', 'per', 'Degeneración en empalizada', 'Retina aplicada 360°'),
        dx_dx: 'Postoperatorio de vitrectomía + gas por DR regmatógeno OI: retina aplicada. Hipertensión ocular secundaria al gas.',
        dx_cie: 'H33.0', dx_ojo: 'OI', dx_tto: 'Dexametasona + tobramicina colirio; timolol 0,5 % colirio',
        dx_pauta: 'Dexa-tobra 1 gota cada 6 h OI; timolol 1 gota cada 12 h OI',
        dx_ind: 'Posición boca abajo 50 min de cada hora. NO viajar en avión ni subir a la montaña mientras haya gas.', dx_rev: '1 semana' } },
    ],
    proxima: { en: 4, prest: 'REVISIÓN POSTOPERATORIA', medico: 'DR. MOLINA', nota: 'Control PIO' } },

  { hc: '700132', nombre: 'Jurado Peña, Marcos', nacimiento: '1988-10-30', sociedad: 'PRIVADO',
    antecedentes: { ap: 'ASMA', medsis: 'BUDESONIDA INHALADA', profesion: 'Empleado/a' },
    visitas: [{ hace: 28, prof: L, prest: 'PRIMERA CONSULTA', data: {
      mot: 'Mancha oscura central en OD y ve los objetos más pequeños. Época de mucho estrés laboral.',
      ...avl('0.6', '1.0'),
      fo_dil: 'Tropicamida 1%', fo_met: 'Lente 90D', ...eye('fo', 'mac', 'Desprendimiento seroso macular', 'Brillo foveal conservado'),
      oct_tipo: 'Mácula', oct_eq: 'Spectralis', ...eye('oct', 'gmc', '420', '255'), ...eye('oct', 'hall', 'Líquido subretiniano', 'Normal'),
      ang_tipo: 'Angiografía fluoresceínica (AGF)', ang_reac: 'Ninguna', ang_cons: true,
      ...eye('ang', 'mac', 'Fuga en punto (mancha de tinta)', 'Normal'),
      dx_dx: 'Coriorretinopatía serosa central aguda OD.', dx_cie: 'H35.71', dx_ojo: 'OD',
      dx_tto: 'Observación', dx_ind: 'Reducir el estrés. Comentar con su neumólogo el uso de corticoides.', dx_rev: '1 mes' } }],
    proxima: { en: 2, prest: 'REVISIÓN', medico: 'DRA. SANZ', nota: 'OCT antes de consulta' } },

  // --- GLAUCOMA ---
  { hc: '700123', nombre: 'Aguilar Méndez, Rosa', nacimiento: '1946-10-02', sociedad: 'SEGUR CAIXA ADESLAS',
    antecedentes: { aof: 'CIERRE ANGULAR AGUDO OD', aqx: 'IRIDOTOMÍA LÁSER AO', ap: 'HIPOTIROIDISMO', medsis: 'LEVOTIROXINA 75 MCG', profesion: 'Jubilado/a' },
    visitas: [
      { hace: 40, prof: L, prest: 'CONSULTA URGENCIAS', data: {
        mot: 'Dolor intenso en OD con visión de halos alrededor de las luces, dolor de cabeza y náuseas desde anoche.',
        ...avl('0.1', '0.6'),
        ten_ton: 'Goldmann', ten1_od: '52', ten1_oi: '18',
        ...eye('bmc', 'conj', 'Hiperemia moderada', 'Normal'), ...eye('bmc', 'cornea', 'Edema corneal', 'Transparente'),
        ...both('bmc', 'ca', 'Estrecha'), ...both('bmc', 'vh', 'Grado 1'), ...eye('bmc', 'pupila', 'Midriática', 'Redonda y reactiva'),
        ...both('bmc', 'crist', 'Catarata nuclear ++'),
        dx_dx: 'Cierre angular agudo primario OD. Ángulo estrecho OI.', dx_cie: 'H40.21', dx_ojo: 'AO',
        dx_tto: 'Acetazolamida 250 mg oral, pilocarpina 2 %, timolol 0,5 %, brimonidina', dx_qx: 'Iridotomía láser',
        dx_ind: 'Iridotomía láser en ambos ojos en cuanto se aclare la córnea.', dx_rev: '1 semana' } },
      { hace: 30, prof: L, prest: 'REVISIÓN', data: {
        ...avl('0.5', '0.6'), ten_ton: 'Goldmann', ten1_od: '16', ten1_oi: '15', gonio: 'Ángulo abierto grado II-III tras iridotomía AO',
        ...both('bmc', 'cornea', 'Transparente'), ...both('bmc', 'pupila', 'Iridotomía permeable'),
        dx_dx: 'Iridotomías permeables AO. PIO controlada.', dx_cie: 'H40.21', dx_ojo: 'AO',
        dx_ind: 'La catarata contribuye al cierre angular: valorar cirugía de catarata.', dx_p_bio: true, dx_rev: '3 meses' } },
    ],
    proxima: { en: 12, prest: 'REVISIÓN', medico: 'DRA. SANZ' } },

  { hc: '700134', nombre: 'Montero Cuesta, Rafael', nacimiento: '1957-06-17', sociedad: 'MAPFRE ESPAÑA, CIA.',
    antecedentes: { afam: 'MADRE CON GLAUCOMA', alNoC: true },
    visitas: [{ hace: 180, prof: L, prest: 'REVISIÓN', data: {
      ten_ton: 'Goldmann', ten1_od: '25', ten1_oi: '24', paq_od: '610', paq_oi: '605',
      gonio: 'Ángulo abierto grado IV (Shaffer) AO',
      ...both('fo', 'ep', '0.3'), ...both('fo', 'isnt', 'Cumple'),
      oct_tipo: 'Nervio óptico (CFNR)', oct_eq: 'Cirrus HD-OCT', ...eye('oct', 'cfnr', '96', '98'), ...both('oct', 'hall', 'Normal'),
      camp_eq: 'Humphrey HFA3', camp_est: '24-2 SITA Standard', camp_fiab: 'Fiable',
      ...eye('camp', 'md', '-0.52', '-0.31'), ...eye('camp', 'vfi', '99', '99'), ...both('camp', 'ght', 'Dentro de límites normales'),
      dx_dx: 'Hipertensión ocular AO con paquimetría gruesa. Sin daño glaucomatoso.', dx_cie: 'H40.05', dx_ojo: 'AO',
      dx_tto: 'Observación, sin tratamiento', dx_ind: 'La córnea gruesa sobrestima la PIO medida.', dx_rev: '6 meses' } }],
    proxima: { en: 0, prest: 'REVISIÓN', medico: 'OPTOMETRÍA', nota: 'PIO + campimetría' } },

  { hc: '700136', nombre: 'Olivares Ruiz, Esteban', nacimiento: '1944-04-04', sociedad: 'PRIVADO',
    antecedentes: { aof: 'GLAUCOMA PSEUDOEXFOLIATIVO AO', aqx: 'TRABECULECTOMÍA OI (2022)', ap: 'EPOC', alergias: 'CONTRASTES YODADOS',
      med: 'LATANOPROST 0,005 % NOCHE AO; DORZOLAMIDA/TIMOLOL C/12H OD', medsis: 'TIOTROPIO INHALADO', profesion: 'Jubilado/a' },
    visitas: [{ hace: 95, prof: L, prest: 'REVISIÓN', data: {
      ...avl('0.5', '0.6'), ten_ton: 'Goldmann', ten1_od: '21', ten1_oi: '11',
      ...both('bmc', 'pupila', 'Redonda y reactiva'), ...both('bmc', 'crist', 'Catarata nuclear ++'),
      bmc_obs: 'Material pseudoexfoliativo en cápsula anterior AO. Ampolla de filtración funcionante OI.',
      ...eye('fo', 'ep', '0.9', '0.8'), ...both('fo', 'isnt', 'No cumple'), ...both('fo', 'pap', 'Palidez difusa'),
      oct_tipo: 'Nervio óptico (CFNR)', oct_eq: 'Cirrus HD-OCT', ...eye('oct', 'cfnr', '52', '61'), ...both('oct', 'hall', 'Adelgazamiento CFNR'),
      camp_eq: 'Humphrey HFA3', camp_est: '24-2 SITA Standard', camp_fiab: 'Fiable',
      ...eye('camp', 'md', '-14.20', '-9.80'), ...eye('camp', 'psd', '11.40', '9.10'), ...eye('camp', 'vfi', '58', '74'),
      ...both('camp', 'ght', 'Fuera de límites normales'), ...eye('camp', 'def', 'Constricción concéntrica', 'Arcuato inferior'),
      dx_dx: 'Glaucoma pseudoexfoliativo avanzado AO. PIO OD por encima del objetivo (< 14 mmHg).', dx_cie: 'H40.14', dx_ojo: 'OD',
      dx_tto: 'Máximo tratamiento médico tolerado', dx_qx: 'Trabeculectomía', dx_rev: '1 mes' } }],
    proxima: { en: 1, prest: 'REVISIÓN', medico: 'DRA. SANZ', nota: 'Curva tensional' } },

  // --- CÓRNEA Y SUPERFICIE ---
  { hc: '700116', nombre: 'Quintero Salas, Beatriz', nacimiento: '1966-12-01', sociedad: 'PRIVADO',
    antecedentes: { ap: 'SÍNDROME DE SJÖGREN', medsis: 'HIDROXICLOROQUINA 200 MG', profesion: 'Autónomo/a', alNoC: true },
    visitas: [{ hace: 60, prof: M, prest: 'PRIMERA CONSULTA', data: {
      mot: 'Sensación de arenilla y quemazón en ambos ojos, peor al final del día y con pantallas.',
      ...both('bmc', 'parp', 'Disfunción de glándulas de Meibomio'), ...both('bmc', 'conj', 'Hiperemia leve'),
      ...both('bmc', 'cornea', 'Queratitis punteada superficial'), ...both('bmc', 'fluo', 'Punteado inferior'),
      ...eye('bmc', 'but', '4', '5'), ...eye('bmc', 'schir', '3', '4'),
      dx_dx: 'Ojo seco severo AO (síndrome de Sjögren). Disfunción de glándulas de Meibomio.', dx_cie: 'H04.12', dx_ojo: 'AO',
      dx_dx2: 'En tratamiento con hidroxicloroquina: cribado anual de toxicidad retiniana.',
      dx_tto: 'Lágrimas artificiales sin conservantes; ciclosporina 0,1 % colirio; higiene palpebral',
      dx_pauta: 'Lágrimas 6 veces al día; ciclosporina 1 gota por la noche AO',
      dx_p_oct: true, dx_p_camp: true, dx_rev: '3 meses' } }],
    proxima: { en: 4, prest: 'REVISIÓN', medico: 'DR. MOLINA', nota: 'OCT + campo 10-2' } },

  { hc: '700117', nombre: 'Ramos Vidal, Héctor', nacimiento: '1990-04-17', sociedad: 'SANITAS, S.A.',
    antecedentes: { aof: 'QUERATOCONO AO', aqx: 'CROSSLINKING CORNEAL OD (2024)', ap: 'DERMATITIS ATÓPICA', alergias: 'ÁCAROS DEL POLVO', profesion: 'Empleado/a' },
    visitas: [{ hace: 150, prof: O, prest: 'REVISIÓN', data: {
      ...rx('man', ['-2.00', '-3.25', '15', '0.8'], ['-3.00', '-4.50', '160', '0.5']),
      topo_eq: 'Pentacam', ...eye('topo', 'k1', '46.2', '47.8'), ...eye('topo', 'k2', '49.8', '51.9'), ...eye('topo', 'kmax', '54.1', '57.3'),
      ...eye('topo', 'ast', '3.6', '4.1'), ...eye('topo', 'eje', '15', '160'), ...eye('topo', 'paq', '468', '452'),
      ...eye('topo', 'bad', '3.9', '5.6'), ...both('topo', 'pat', 'Pajarita asimétrica'), topo_concl: 'Queratocono',
      topo_obs: 'Kmáx OI +1,2 D respecto al estudio de hace 6 meses: progresión.',
      dx_dx: 'Queratocono AO. Progresión documentada en OI.', dx_cie: 'H18.61', dx_ojo: 'OI',
      dx_tto: 'Crosslinking corneal OI. Adaptación de lentes de contacto rígidas (RGP).',
      dx_ind: 'No frotarse los ojos (empeora el queratocono).', dx_rev: '3 meses' } }],
    proxima: { en: 1, prest: 'REVISIÓN', medico: 'OPTOMETRÍA', nota: 'Topografía' } },

  { hc: '700118', nombre: 'Sáez Moreno, Lorena', nacimiento: '1995-09-03', sociedad: 'PRIVADO',
    antecedentes: { aof: 'PORTADORA DE LENTES DE CONTACTO BLANDAS MENSUALES', profesion: 'Empleado/a', alNoC: true },
    visitas: [{ haceLab: 2, prof: L, prest: 'CONSULTA URGENCIAS', urgente: true, data: {
      mot: 'Dolor, fotofobia y ojo rojo en OD desde hace 2 días. Reconoce dormir con las lentillas.',
      ...avl('0.4', '1.0'),
      ...eye('bmc', 'conj', 'Hiperemia moderada', 'Normal'), ...eye('bmc', 'cornea', 'Úlcera corneal', 'Transparente'),
      ...eye('bmc', 'fluo', 'Defecto epitelial', 'Negativa'), ...eye('bmc', 'ca', 'Tyndall +', 'Formada y profunda'),
      bmc_obs: 'OD: infiltrado paracentral inferior de 2 mm con defecto epitelial.',
      dx_dx: 'Úlcera corneal bacteriana OD asociada a lentes de contacto.', dx_cie: 'H16.0', dx_ojo: 'OD',
      dx_tto: 'Moxifloxacino colirio; ciclopentolato 1 % colirio',
      dx_pauta: 'Moxifloxacino 1 gota cada hora las primeras 48 h, luego cada 4 h OD. Ciclopentolato cada 8 h OD.',
      dx_ind: 'Suspender las lentes de contacto. Tirar el estuche. Acudir si empeora.', dx_rev: '1 semana' } }],
    proxima: { en: 2, prest: 'REVISIÓN', medico: 'DRA. SANZ', nota: 'Control úlcera' } },

  { hc: '700124', nombre: 'Bravo Soto, Iván', nacimiento: '2001-08-25', sociedad: 'PRIVADO',
    antecedentes: { profesion: 'Estudiante', alNoC: true },
    visitas: [{ haceLab: 1, prof: L, prest: 'CONSULTA URGENCIAS', data: {
      mot: 'Ojo rojo OD desde hace 3 días, ahora también OI. Lagrimeo y sensación de arenilla. Su pareja tuvo lo mismo.',
      ...avl('1.0', '1.0'),
      ...both('bmc', 'parp', 'Normales'), ...both('bmc', 'conj', 'Reacción folicular'), ...both('bmc', 'cornea', 'Transparente'),
      ...both('bmc', 'fluo', 'Negativa'), bmc_obs: 'Adenopatía preauricular derecha palpable.',
      dx_dx: 'Queratoconjuntivitis adenovírica AO.', dx_cie: 'B30.1', dx_ojo: 'AO',
      dx_tto: 'Lágrimas artificiales frías; compresas frías',
      dx_ind: 'Muy contagiosa: lavado de manos frecuente, toalla propia. No acudir a clase durante 1 semana.', dx_rev: '1 semana' } }],
    proxima: { en: 4, prest: 'REVISIÓN', medico: 'DRA. SANZ' } },

  { hc: '700130', nombre: 'Hidalgo Ruano, Pedro', nacimiento: '1971-08-08', sociedad: 'SEGUR CAIXA ADESLAS',
    antecedentes: { profesion: 'Autónomo/a', ap: 'TRABAJA AL AIRE LIBRE (AGRICULTOR)' },
    visitas: [{ hace: 55, prof: L, prest: 'PRIMERA CONSULTA', data: {
      mot: 'Carnosidad en el lado nasal del OD que crece; se enrojece con el sol y el viento.',
      ...rx('man', ['+0.50', '-2.75', '95', '0.8'], ['+0.25', '-0.50', '90', '1.0']),
      ...eye('bmc', 'conj', 'Pterigión', 'Pinguécula'), ...both('bmc', 'cornea', 'Transparente'),
      topo_eq: 'Pentacam', ...eye('topo', 'k1', '42.1', '43.0'), ...eye('topo', 'k2', '44.9', '43.6'), ...eye('topo', 'ast', '2.8', '0.6'),
      ...eye('topo', 'eje', '5', '90'), topo_concl: 'Normal', topo_obs: 'Astigmatismo inducido por el pterigión en OD.',
      dx_dx: 'Pterigión nasal OD grado II con astigmatismo inducido.', dx_cie: 'H11.0', dx_ojo: 'OD',
      dx_tto: 'Lágrimas artificiales; gafas de sol con filtro UV',
      dx_ind: 'Si progresa hacia el eje visual: exéresis con autoinjerto conjuntival.', dx_rev: '6 meses' } }],
    proxima: { en: 13, prest: 'REVISIÓN', medico: 'DRA. SANZ' } },

  { hc: '700131', nombre: 'Ibarra Nieto, Graciela', nacimiento: '1955-02-02', sociedad: 'ASISA, S.A.',
    antecedentes: { profesion: 'Jubilado/a', alNoC: true },
    visitas: [{ hace: 65, prof: M, prest: 'PRIMERA CONSULTA', data: {
      mot: 'Visión borrosa por las mañanas que mejora a lo largo del día. Deslumbramiento.',
      ...rx('man', ['+1.00', '-0.75', '100', '0.5'], ['+0.75', '-0.50', '80', '0.6']),
      ...both('bmc', 'cornea', 'Guttas endoteliales'), ...both('bmc', 'crist', 'Catarata nuclear ++'),
      rec_eq: 'Microscopio especular (sin contacto)', ...eye('rec', 'dens', '1150', '1480'), ...eye('rec', 'cv', '45', '40'),
      ...eye('rec', 'hex', '38', '44'), ...eye('rec', 'paq', '612', '590'), ...both('rec', 'morf', 'Guttas'),
      bio_eq: 'IOLMaster 700', bio_form: 'Barrett Universal II', bio_lio: 'Monofocal',
      ...eye('bio', 'la', '23.45', '23.52'), ...eye('bio', 'k1', '43.25', '43.50'), ...eye('bio', 'k2', '44.00', '44.10'),
      ...eye('bio', 'acd', '2.98', '3.02'), ...eye('bio', 'lt', '4.70', '4.65'), ...eye('bio', 'pot', '21.5', '21.0'), ...both('bio', 'obj', '-0.25'),
      dx_dx: 'Distrofia endotelial de Fuchs AO. Catarata nuclear AO.', dx_cie: 'H18.51', dx_ojo: 'AO',
      dx_tto: 'Cloruro sódico 5 % colirio por la mañana', dx_qx: 'Facoemulsificación + LIO OD',
      dx_ind: 'Riesgo de descompensación corneal tras la cirugía; si ocurre, valorar trasplante endotelial (DMEK).', dx_rev: '1 mes' } }],
    proxima: { en: 3, prest: 'PREVIO CATARATA', medico: 'DR. MOLINA', nota: 'Carpeta ok' } },

  // --- INFLAMACIÓN / NEURO-OFTALMOLOGÍA / ÓRBITA ---
  { hc: '700125', nombre: 'Cabrera Luna, Pilar', nacimiento: '1974-02-28', sociedad: 'SANITAS, S.A.',
    antecedentes: { ap: 'ESPONDILITIS ANQUILOSANTE (HLA-B27 POSITIVO)', medsis: 'ADALIMUMAB 40 MG CADA 2 SEMANAS', aof: 'UVEÍTIS ANTERIOR OI (2 EPISODIOS)', profesion: 'Empleado/a' },
    visitas: [
      { hace: 14, prof: L, prest: 'CONSULTA URGENCIAS', data: {
        mot: 'Dolor, ojo rojo y mucha sensibilidad a la luz en OI desde hace 2 días.',
        ...avl('1.0', '0.6'), ten_ton: 'Goldmann', ten1_od: '14', ten1_oi: '12',
        ...eye('bmc', 'conj', 'Normal', 'Hiperemia moderada'), ...eye('bmc', 'cornea', 'Transparente', 'Precipitados queráticos'),
        ...eye('bmc', 'ca', 'Formada y profunda', 'Células ++'), ...eye('bmc', 'iris', 'Normal', 'Sinequias posteriores'),
        dx_dx: 'Uveítis anterior aguda OI asociada a HLA-B27.', dx_cie: 'H20.0', dx_ojo: 'OI',
        dx_tto: 'Prednisolona acetato 1 % colirio; ciclopentolato 1 % colirio',
        dx_pauta: 'Prednisolona 1 gota cada 2 h OI con pauta descendente; ciclopentolato cada 8 h OI', dx_rev: '1 semana' } },
      { haceLab: 4, prof: L, prest: 'REVISIÓN', data: {
        ...avl('1.0', '0.9'), ten_ton: 'Goldmann', ten1_od: '14', ten1_oi: '15',
        ...eye('bmc', 'ca', 'Formada y profunda', 'Células +'), ...eye('bmc', 'iris', 'Normal', 'Sinequias posteriores'),
        dx_dx: 'Uveítis anterior OI en mejoría.', dx_cie: 'H20.0', dx_ojo: 'OI',
        dx_tto: 'Prednisolona acetato 1 %: bajar a 1 gota cada 6 h', dx_rev: '15 días' } },
    ],
    proxima: { en: 6, prest: 'REVISIÓN', medico: 'DRA. SANZ' } },

  { hc: '700126', nombre: 'Domínguez Rey, Joaquín', nacimiento: '1983-03-03', sociedad: 'DKV SEGUROS, S.A.',
    antecedentes: { ap: 'ESCLEROSIS MÚLTIPLE (DIAGNÓSTICO 2026)', profesion: 'Empleado/a', alNoC: true },
    visitas: [
      { hace: 50, prof: M, prest: 'CONSULTA URGENCIAS', data: {
        mot: 'Pérdida de visión en OD con dolor al mover el ojo desde hace 4 días. Ve los colores "apagados".',
        ...avl('0.3', '1.0'), mo_pup: 'DPAR OD', mo_vers: 'Normales',
        ...both('fo', 'pap', 'Bordes nítidos, coloración normal'),
        camp_eq: 'Humphrey HFA3', camp_est: '30-2 SITA Standard', camp_fiab: 'Fiable',
        ...eye('camp', 'md', '-8.50', '-0.40'), ...eye('camp', 'def', 'Defecto paracentral', 'Sin defectos'),
        dx_dx: 'Neuritis óptica retrobulbar OD.', dx_cie: 'H46.1', dx_ojo: 'OD',
        dx_ind: 'Derivación preferente a Neurología para resonancia magnética craneal.', dx_rev: '1 mes' } },
      { hace: 20, prof: M, prest: 'REVISIÓN', data: {
        ...avl('0.8', '1.0'), mo_pup: 'DPAR OD', ...eye('fo', 'pap', 'Palidez temporal', 'Bordes nítidos, coloración normal'),
        oct_tipo: 'Nervio óptico (CFNR)', oct_eq: 'Spectralis', ...eye('oct', 'cfnr', '81', '99'), ...eye('oct', 'hall', 'Adelgazamiento CFNR', 'Normal'),
        dx_dx: 'Neuritis óptica OD en recuperación. Esclerosis múltiple confirmada por Neurología.', dx_cie: 'H46.1', dx_ojo: 'OD', dx_rev: '3 meses' } },
    ],
    proxima: { en: 14, prest: 'REVISIÓN', medico: 'DR. MOLINA', nota: 'Campimetría + OCT' } },

  { hc: '700127', nombre: 'Esteban Vázquez, Mercedes', nacimiento: '1964-09-09', sociedad: 'MAPFRE ESPAÑA, CIA.',
    antecedentes: { ap: 'ENFERMEDAD DE GRAVES (HIPERTIROIDISMO). FUMADORA.', medsis: 'TIAMAZOL 5 MG', profesion: 'Empleado/a' },
    visitas: [{ hace: 75, prof: M, prest: 'PRIMERA CONSULTA', data: {
      mot: 'Ojos "saltones", sensación de ojo seco y visión doble al mirar hacia arriba.',
      mo_ctl: 'Ortoforia', mo_vers: 'Limitadas', mo_ducc: 'Limitación de la elevación en ambos ojos', mo_dipl: 'Vertical',
      ...both('bmc', 'fluo', 'Punteado inferior'), ...both('bmc', 'conj', 'Hiperemia leve'),
      orb_base: '100', ...eye('orb', 'hertel', '23', '22'), ...eye('orb', 'mrd1', '6', '5.5'), ...eye('orb', 'lago', '2', '1'),
      ...both('orb', 'pos', 'Retracción palpebral'), orb_obs: 'Edema palpebral y quemosis leve. Actividad clínica (CAS) 3/7.',
      dx_dx: 'Orbitopatía tiroidea activa, leve-moderada AO.', dx_cie: 'H06.2', dx_ojo: 'AO',
      dx_tto: 'Lágrimas artificiales; selenio 100 mcg cada 12 h', dx_ind: 'Dejar de fumar (empeora la orbitopatía). Coordinación con Endocrinología.', dx_rev: '3 meses' } }],
    proxima: { en: 11, prest: 'REVISIÓN', medico: 'DR. MOLINA' } },

  // --- PÁRPADOS / OCULOPLASTIA / ESTÉTICA ---
  { hc: '700128', nombre: 'Fernández Arias, Julián', nacimiento: '1949-12-14', sociedad: 'PRIVADO',
    antecedentes: { ap: 'FIBRILACIÓN AURICULAR', anticoag: true, medsis: 'APIXABÁN 5 MG', profesion: 'Jubilado/a', alNoC: true },
    visitas: [{ hace: 30, prof: M, prest: 'PRIMERA CONSULTA', data: {
      mot: 'Los párpados le tapan la visión, sobre todo al final del día y al leer.',
      ...eye('orb', 'mrd1', '1.0', '1.5'), ...both('orb', 'fe', '14'), ...eye('orb', 'surco', '12', '11'), ...both('orb', 'pos', 'Ptosis'),
      ocp_dx: 'Ptosis aponeurótica bilateral con dermatocalasia.', ocp_proc: 'Cirugía de ptosis', ocp_ojo: 'AO', ocp_anest: 'Local + sedación',
      ocp_fotos: true, ocp_cons: true, ocp_plan: 'Suspender apixabán según indicación de Cardiología antes de la cirugía.',
      dx_dx: 'Ptosis aponeurótica AO. Dermatocalasia.', dx_cie: 'H02.4', dx_ojo: 'AO', dx_qx: 'Blefaroplastia', dx_rev: '1 mes' } }],
    proxima: { en: 5, prest: 'NOTA MÉDICA', medico: 'DR. MOLINA', nota: 'Preoperatorio' } },

  { hc: '700129', nombre: 'Gómez Pastor, Alicia', nacimiento: '1998-04-21', sociedad: 'SANITAS, S.A.',
    antecedentes: { profesion: 'Estudiante', alNoC: true },
    visitas: [{ haceLab: 3, prof: M, prest: 'PRIMERA CONSULTA', data: {
      mot: 'Bulto en el párpado superior del OD desde hace 3 semanas, no doloroso.',
      ...eye('bmc', 'parp', 'Chalazión', 'Blefaritis anterior'),
      ocp_dx: 'Chalazión en párpado superior OD que no responde a calor local.', ocp_proc: 'Extirpación de chalazión', ocp_ojo: 'OD',
      ocp_anest: 'Local', ocp_cons: true,
      dx_dx: 'Chalazión en párpado superior OD. Blefaritis AO.', dx_cie: 'H00.1', dx_ojo: 'OD',
      dx_tto: 'Calor local y masaje palpebral; higiene palpebral', dx_pauta: 'Calor + masaje 10 minutos, 3 veces al día', dx_rev: '1 mes' } }],
    proxima: { en: 7, prest: 'REVISIÓN', medico: 'DR. MOLINA', nota: 'Extirpación chalazión' } },

  { hc: '700133', nombre: 'Luque Sanz, Victoria', nacimiento: '1980-01-25', sociedad: 'SANITAS, S.A.',
    antecedentes: { profesion: 'Autónomo/a', alNoC: true },
    visitas: [{ hace: 100, prof: M, prest: 'PRIMERA CONSULTA', data: {
      mot: 'Consulta estética por arrugas alrededor de los ojos.',
      est_trat: 'Toxina botulínica', est_zona: 'Patas de gallo', est_dosis: '12 U por lado', est_lote: 'TX-2026-0418',
      est_cons: true, est_fotos: true, est_prox: '4 meses', est_obs: 'Buena respuesta esperada. Sin contraindicaciones.' } }],
    proxima: { en: 4, prest: 'REVISIÓN', medico: 'DR. MOLINA', nota: 'Sesión toxina' } },

  // --- REFRACCIÓN / INFANTIL ---
  { hc: '700115', nombre: 'Pardo Ruiz, Sofía', nacimiento: '2019-02-14', sociedad: 'DKV SEGUROS, S.A.',
    antecedentes: { afam: 'PADRE CON ESTRABISMO EN LA INFANCIA', profesion: 'Estudiante', alNoC: true },
    visitas: [
      { hace: 120, prof: L, prest: 'PRIMERA CONSULTA', data: {
        mot: 'En el colegio notan que "tuerce" el ojo izquierdo, sobre todo al mirar de cerca.',
        ...avl('0.8', '0.3'),
        ...rx('ciclo', ['+1.50'], ['+4.50', '-0.75', '180']),
        mo_ctl: 'Endotropia', mo_ctl_dp: '12', mo_ctc: 'Endotropia', mo_ctc_dp: '20', mo_vers: 'Normales',
        mo_estt: 'TNO', mo_este: '480',
        ...rx('rx', ['+1.50'], ['+4.50', '-0.75', '180']),
        dx_dx: 'Ambliopía anisometrópica OI. Endotropía acomodativa.', dx_cie: 'H53.0', dx_ojo: 'OI',
        dx_tto: 'Gafa con la corrección total del ciclopléjico. Oclusión del OD 3 horas al día.', dx_rev: '3 meses' } },
      { haceLab: 3, prof: O, prest: 'REVISIÓN', data: {
        mot: 'Lleva bien la gafa y el parche.', ...avl('1.0', '0.6'),
        mo_ctl: 'Endoforia', mo_ctc: 'Endoforia', mo_estt: 'TNO', mo_este: '120',
        dx_dx: 'Ambliopía OI en mejoría. Endotropía compensada con gafa.', dx_cie: 'H53.0', dx_ojo: 'OI',
        dx_tto: 'Mantener gafa. Oclusión OD 2 horas al día.', dx_rev: '3 meses' } },
    ] },

  { hc: '700135', nombre: 'Nieto Paredes, Andrea', nacimiento: '2012-11-05', sociedad: 'DKV SEGUROS, S.A.',
    antecedentes: { afam: 'PADRE Y MADRE MIOPES', profesion: 'Estudiante', alNoC: true },
    visitas: [
      { hace: 200, prof: O, prest: 'REVISIÓN', data: {
        ...rx('ciclo', ['-2.75'], ['-3.00', '-0.25', '10']), ...rx('rx', ['-2.75', undefined, undefined, '1.0'], ['-3.00', '-0.25', '10', '1.0']),
        bio_eq: 'IOLMaster 700', ...eye('bio', 'la', '24.85', '24.97'),
        dx_dx: 'Miopía progresiva AO.', dx_cie: 'H52.1', dx_ojo: 'AO',
        dx_tto: 'Atropina 0,01 % colirio por la noche; gafas de desenfoque periférico',
        dx_ind: 'Actividades al aire libre 2 horas al día. Pausas con las pantallas.', dx_rev: '6 meses' } },
      { haceLab: 2, prof: O, prest: 'REVISIÓN', data: {
        ...rx('ciclo', ['-3.00'], ['-3.25', '-0.25', '10']), ...rx('rx', ['-3.00', undefined, undefined, '1.0'], ['-3.25', '-0.25', '10', '1.0']),
        bio_eq: 'IOLMaster 700', ...eye('bio', 'la', '24.98', '25.10'),
        bio_obs: 'Crecimiento axial de 0,13 mm en 6 meses.',
        dx_dx: 'Miopía progresiva AO: progresión de 0,25 D en 6 meses con atropina.', dx_cie: 'H52.1', dx_ojo: 'AO',
        dx_tto: 'Mantener atropina 0,01 %. Nueva graduación.', dx_rev: '6 meses' } },
    ] },

  { hc: '700122', nombre: 'Zamora Ibáñez, Clara', nacimiento: '1993-06-06', sociedad: 'PRIVADO',
    antecedentes: { profesion: 'Empleado/a', alNoC: true, aof: 'MIOPÍA. PORTADORA DE LENTES DE CONTACTO' },
    visitas: [{ haceLab: 1, prof: O, prest: 'PREVIO REFRACTIVA', data: {
      mot: 'Quiere dejar las gafas y las lentillas.',
      ...rx('auto', ['-4.50', '-0.50', '10'], ['-5.00', '-0.75', '170']),
      ...rx('man', ['-4.25', '-0.50', '10', '1.0'], ['-4.75', '-0.75', '170', '1.0']),
      ...both('bmc', 'but', '9'),
      topo_eq: 'Pentacam', ...eye('topo', 'k1', '43.1', '43.2'), ...eye('topo', 'k2', '44.0', '44.2'), ...eye('topo', 'kmax', '44.6', '44.8'),
      ...eye('topo', 'paq', '548', '552'), ...eye('topo', 'bad', '0.9', '1.1'), ...both('topo', 'pat', 'Pajarita simétrica'),
      topo_concl: 'Apto para cirugía refractiva',
      dx_dx: 'Miopía AO. Apta para cirugía refractiva.', dx_cie: 'H52.1', dx_ojo: 'AO', dx_qx: 'Cirugía refractiva',
      dx_ind: 'Retirar las lentes de contacto blandas 1 semana antes de la cirugía.', dx_rev: '1 mes' } }],
    proxima: { en: 9, prest: 'NOTA MÉDICA', medico: 'DR. MOLINA', nota: 'Firma consentimiento' } },
];

/** AV lejos sin corrección, O.D. y O.I. (con la mejor agudeza en "Esp."). */
function avl(od, oi) {
  return { avl_od_esp: od, avl_oi_esp: oi };
}
