// =====================================================================
// seed.js — datos de práctica (100 % ficticios)
// =====================================================================
// "Seed" (semilla) es el nombre habitual para los datos iniciales de una
// aplicación. Todos los nombres, números de historia y datos clínicos son
// inventados: nunca metas datos reales de pacientes en un repositorio.
// =====================================================================

/**
 * Fecha de hoy en formato ISO (AAAA-MM-DD) según la zona horaria del
 * servidor. Los servidores de Render usan UTC; por eso en render.yaml
 * fijamos TZ=Europe/Madrid, para que "hoy" cambie a medianoche en España.
 */
export function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const L = 'Sanz Molina, Laura';
const O = 'Ortega Gil, Pablo';

const PATIENTS = [
  { hc: '700101', nombre: 'Álvarez Prieto, Marta', nacimiento: '1968-02-14', sociedad: 'SANITAS, S.A.',
    antecedentes: { ap: 'HTA', aqx: 'FACOEMULSIFICACIÓN + LIO OD (2021)', alergias: 'PENICILINA', alAct: true, medsis: 'ENALAPRIL 10 MG' } },
  { hc: '700102', nombre: 'Benítez Soler, Andrés', nacimiento: '1992-07-03', sociedad: 'PRIVADO' },
  { hc: '700103', nombre: 'Castaño Ruiz, Lucía', nacimiento: '2016-05-21', sociedad: 'DKV SEGUROS, S.A.',
    antecedentes: { afam: 'MADRE CON MIOPÍA ALTA' } },
  { hc: '700104', nombre: 'Delgado Ferrer, Ramón', nacimiento: '1953-11-09', sociedad: 'SEGUR CAIXA ADESLAS',
    antecedentes: { aof: 'GLAUCOMA CRÓNICO AO', med: 'TIMOLOL 0,5% C/12H AO', alNoC: true } },
  { hc: '700105', nombre: 'Escudero Lima, Paula', nacimiento: '1981-09-30', sociedad: 'ASISA, S.A.',
    antecedentes: { aqx: 'LASIK AO (2019)' } },
  { hc: '700106', nombre: 'Fuentes Olmo, Javier', nacimiento: '1975-01-18', sociedad: 'MAPFRE ESPAÑA, CIA.' },
  { hc: '700107', nombre: 'García Valls, Inés', nacimiento: '1959-04-02', sociedad: 'PRIVADO',
    antecedentes: { ap: 'DIABETES TIPO 2', diabetes: true, medsis: 'METFORMINA' } },
  { hc: '700108', nombre: 'Herrera Campos, Tomás', nacimiento: '1996-12-11', sociedad: 'SANITAS, S.A.' },
  { hc: '700109', nombre: 'Iglesias Mora, Carmen', nacimiento: '1962-08-25', sociedad: 'SEGUR CAIXA ADESLAS',
    antecedentes: { alergias: 'AINES', alAct: true } },
  { hc: '700110', nombre: 'Jiménez Roca, Álvaro', nacimiento: '1986-03-07', sociedad: 'DKV SEGUROS, S.A.' },
  { hc: '700111', nombre: 'López Serrano, Nuria', nacimiento: '1970-10-19', sociedad: 'SANITAS, S.A.' },
  { hc: '700112', nombre: 'Martín Aguado, Sergio', nacimiento: '1977-06-28', sociedad: 'PRIVADO' },
];

// Visitas anteriores, para que la vista previa y la gráfica de PIO tengan
// algo que mostrar desde el primer momento.
const VISITS = [
  { hc: '700101', fecha: '2026-03-12', profesional: L, prestacion: 'REVISIÓN', data: {
    mot: 'Revisión anual. Refiere buena visión de lejos.',
    cp1_od_esf: '+1.25', cp1_od_cil: '-0.50', cp1_od_eje: '90', cp1_od_av: '0.8',
    cp1_oi_esf: '+1.50', cp1_oi_cil: '-0.75', cp1_oi_eje: '85', cp1_oi_av: '0.7',
    ten_ton: 'Aire (NCT)', ten1_od: '15', ten1_oi: '16',
    bmc_conj_od: 'Normal', bmc_conj_oi: 'Normal', bmc_cornea_od: 'Transparente', bmc_cornea_oi: 'Transparente',
    bmc_ca_od: 'Formada y profunda', bmc_ca_oi: 'Formada y profunda',
    bmc_crist_od: 'Pseudofaquia (LIO en saco)', bmc_crist_oi: 'Esclerosis nuclear +',
    fo_met: 'Lente 90D', fo_pap_od: 'Bordes nítidos, coloración normal', fo_pap_oi: 'Bordes nítidos, coloración normal',
    fo_ep_od: '0.3', fo_ep_oi: '0.3', fo_mac_od: 'Brillo foveal conservado', fo_mac_oi: 'Drusas duras',
    dx_dx: 'Pseudofaquia OD. Catarata incipiente OI.', dx_cie: 'H25.1', dx_ojo: 'OI', dx_rev: '12 meses' } },
  { hc: '700104', fecha: '2026-03-10', profesional: L, prestacion: 'REVISIÓN', data: {
    ten_ton: 'Goldmann', ten1_od: '22', ten1_oi: '21',
    fo_dil: 'Tropicamida 1%', fo_met: 'Lente 90D', fo_ep_od: '0.7', fo_ep_oi: '0.6', fo_isnt_od: 'No cumple', fo_isnt_oi: 'Cumple',
    fo_pap_od: 'Muesca inferior', fo_pap_oi: 'Bordes nítidos, coloración normal',
    dx_dx: 'PIO elevada AO. Sospecha de glaucoma.', dx_tto: 'Timolol 0,5 % colirio', dx_pauta: '1 gota cada 12 h en AO',
    dx_p_oct: true, dx_p_camp: true, dx_rev: '3 meses' } },
  { hc: '700104', fecha: '2026-06-15', profesional: L, prestacion: 'REVISIÓN', data: {
    ten_ton: 'Goldmann', ten1_od: '18', ten1_oi: '19', paq_od: '540', paq_oi: '545',
    oct_tipo: 'Nervio óptico (CFNR)', oct_eq: 'Cirrus HD-OCT', oct_cal_od: '8', oct_cal_oi: '9',
    oct_cfnr_od: '74', oct_cfnr_oi: '86', oct_cfnri_od: '68', oct_cfnri_oi: '104', oct_hall_od: 'Adelgazamiento CFNR', oct_hall_oi: 'Normal',
    camp_eq: 'Humphrey HFA3', camp_est: '24-2 SITA Standard', camp_fiab: 'Fiable',
    camp_md_od: '-4.21', camp_md_oi: '-1.05', camp_psd_od: '5.80', camp_psd_oi: '1.92', camp_vfi_od: '89', camp_vfi_oi: '98',
    camp_ght_od: 'Fuera de límites normales', camp_ght_oi: 'Dentro de límites normales', camp_def_od: 'Arcuato superior', camp_def_oi: 'Sin defectos',
    dx_dx: 'Glaucoma crónico de ángulo abierto AO. Estable.', dx_cie: 'H40.11', dx_ojo: 'AO',
    dx_tto: 'Continuar timolol 0,5 % colirio', dx_pauta: '1 gota cada 12 h en AO', dx_rev: '3 meses' } },
  { hc: '700109', fecha: '2026-07-20', profesional: L, prestacion: 'PRIMERA CONSULTA', data: {
    mot: 'Visión borrosa progresiva en OD, deslumbramiento al conducir de noche.',
    bmc_crist_od: 'Catarata nuclear +++', bmc_crist_oi: 'Catarata nuclear ++', bmc_ca_od: 'Formada y profunda', bmc_ca_oi: 'Formada y profunda',
    fo_dil: 'Tropicamida 1% + fenilefrina 10%', fo_met: 'Oftalmoscopía indirecta (BIO)',
    fo_mac_od: 'Brillo foveal conservado', fo_mac_oi: 'Brillo foveal conservado', fo_per_od: 'Retina aplicada 360°', fo_per_oi: 'Retina aplicada 360°',
    dx_dx: 'Catarata nuclear senil AO, más avanzada en OD.', dx_cie: 'H25.1', dx_ojo: 'AO',
    dx_p_bio: true, dx_p_rec: true, dx_qx: 'Facoemulsificación + LIO OD', dx_rev: '1 mes' } },
  { hc: '700111', fecha: '2026-02-02', profesional: O, prestacion: 'REVISIÓN', data: {
    cp1_od_esf: '-2.25', cp1_od_av: '1.0', cp1_oi_esf: '-2.50', cp1_oi_cil: '-0.25', cp1_oi_eje: '170', cp1_oi_av: '0.9' } },
];

// Citas de HOY. Se generan con la fecha actual para que la agenda siempre
// tenga pacientes cuando abras la app.
const APPOINTMENTS = [
  ['10:00', 'CRL-5', '', 'DRA. SANZ', '700103', 'PRIMERA CONSULTA', 'atendido'],
  ['10:10', 'BSA-3', '', 'DRA. SANZ', '700102', 'PRIMERA CONSULTA', 'atendido'],
  ['10:30', 'DFR-1', '', 'DRA. SANZ', '700104', 'REVISIÓN', 'sala'],
  ['10:50', 'ELP-2', 'Trae informe', 'DRA. SANZ', '700105', 'REVISIÓN POSTOPERATORIA', 'sala'],
  ['11:00', 'HCT-4', 'Urgencia', 'DRA. SANZ', '700108', 'CONSULTA URGENCIAS', 'sala', 1],
  ['11:20', 'APM-1', '', 'DRA. SANZ', '700101', 'REVISIÓN', 'citado'],
  ['11:40', 'GVI-1', '', 'DR. MOLINA', '700107', 'LÁSER ARGÓN', 'citado'],
  ['12:00', 'FOJ-9', 'Dilatar', 'DRA. SANZ', '700106', 'PRIMERA CONSULTA', 'citado'],
  ['12:15', 'JRA-3', '', 'OPTOMETRÍA', '700110', 'REVISIÓN', 'citado'],
  ['12:30', 'LSN-1', '', 'OPTOMETRÍA', '700111', 'PREVIO REFRACTIVA', 'citado'],
  ['16:00', 'IMC-2', 'Carpeta ok', 'DR. MOLINA', '700109', 'PREVIO CATARATA', 'citado'],
  ['16:30', 'MAS-1', '', 'DR. MOLINA', '700112', 'NOTA MÉDICA', 'citado'],
];

/**
 * Borra todo y vuelve a cargar los datos de práctica.
 * Va dentro de una TRANSACCIÓN: o se ejecuta todo, o nada. Si algo falla a
 * mitad, Postgres deshace los cambios (ROLLBACK) y la BD no queda a medias.
 *
 * Recibe el `pool` de conexiones como parámetro (en vez de importarlo de
 * db.js) para evitar una importación circular: db.js ya importa este archivo.
 */
export async function seedDatabase(pool) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // TRUNCATE vacía las tablas de golpe. RESTART IDENTITY hace que los ids
    // vuelvan a empezar en 1, y CASCADE respeta las claves foráneas.
    await client.query('TRUNCATE visits, appointments, patients RESTART IDENTITY CASCADE');

    // En pg, los valores van como $1, $2... y se pasan en un array aparte.
    for (const p of PATIENTS) {
      await client.query(
        `INSERT INTO patients (hc, nombre, nacimiento, sociedad, antecedentes)
         VALUES ($1, $2, $3, $4, $5)`,
        // JSON.stringify: convertimos el objeto en texto JSON para la columna JSONB.
        [p.hc, p.nombre, p.nacimiento, p.sociedad, JSON.stringify(p.antecedentes || {})]
      );
    }
    for (const v of VISITS) {
      await client.query(
        `INSERT INTO visits (hc, fecha, profesional, prestacion, data) VALUES ($1, $2, $3, $4, $5)`,
        [v.hc, v.fecha, v.profesional, v.prestacion, JSON.stringify(v.data)]
      );
    }
    const hoy = todayISO();
    for (const [hora, ticket, nota, medico, hc, prest, status, urg = 0] of APPOINTMENTS) {
      await client.query(
        `INSERT INTO appointments (fecha, hora, ticket, nota, medico, hc, prestacion, status, urgente)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [hoy, hora, ticket, nota, medico, hc, prest, status, Boolean(urg)]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
