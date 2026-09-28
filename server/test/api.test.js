// =====================================================================
// Tests de la API con el test runner que trae Node (node:test).
// Ejecuta: `npm test` (desde la raíz o desde /server)
//
// Necesitan una base de datos PostgreSQL SOLO PARA TESTS, indicada en
// TEST_DATABASE_URL (en server/.env). Los tests la BORRAN y la vuelven a
// llenar, así que nunca uses aquí la misma base que en Render.
// Si TEST_DATABASE_URL no está definida, los tests se saltan.
//
// Cada test hace peticiones reales con fetch a la app, igual que el frontend.
// =====================================================================
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

try { process.loadEnvFile(); } catch { /* sin .env */ }
const TEST_URL = process.env.TEST_DATABASE_URL;
const skip = !TEST_URL && 'Define TEST_DATABASE_URL en server/.env para ejecutar los tests';

let server;
let base;
let pool;

before(async () => {
  if (skip) return;
  process.env.DATABASE_URL = TEST_URL; // la app usará la base de TEST
  // Import dinámico: debe ocurrir DESPUÉS de fijar DATABASE_URL.
  const { app } = await import('../src/app.js');
  const db = await import('../src/db.js');
  const { seedDatabase } = await import('../src/seed.js');
  pool = db.pool;
  await db.initDb();
  await seedDatabase(pool); // empezamos siempre desde los datos de práctica
  server = app.listen(0); // 0 = "dame cualquier puerto libre"
  await new Promise((r) => server.once('listening', r));
  base = `http://localhost:${server.address().port}/api`;
});

after(async () => {
  if (skip) return;
  server.close();
  await pool.end();
});

const json = (method, body) => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

// Busca en la agenda de hoy la cita de un paciente (los ids dependen del orden de carga).
async function citaDeHoy(hc) {
  const citas = await (await fetch(`${base}/appointments`)).json();
  return citas.find((c) => c.hc === hc);
}

test('la agenda de hoy trae las citas de práctica con el nombre del paciente', { skip }, async () => {
  const res = await fetch(`${base}/appointments`);
  assert.equal(res.status, 200);
  const citas = await res.json();
  assert.ok(citas.length >= 12, 'al menos las 12 citas fijas de hoy');
  assert.ok(citas[0].nombre, 'cada cita incluye el nombre (JOIN con patients)');
  assert.equal(typeof citas[0].urgente, 'boolean');
});

test('hay citas repartidas en otros días (pasados y futuros)', { skip }, async () => {
  const hoy = new Date();
  let futuras = 0;
  for (let i = 1; i <= 14; i++) {
    const d = new Date(hoy); d.setDate(d.getDate() + i);
    // Fecha local AAAA-MM-DD (toISOString usaría UTC y podría cambiar de día).
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    futuras += (await (await fetch(`${base}/appointments?fecha=${iso}`)).json()).length;
  }
  assert.ok(futuras >= 50, `esperaba muchas citas futuras, hay ${futuras}`);
});

test('cambiar el estado de una cita valida los valores', { skip }, async () => {
  const cita = await citaDeHoy('700101');
  const ok = await fetch(`${base}/appointments/${cita.id}`, json('PATCH', { status: 'sala' }));
  assert.equal((await ok.json()).status, 'sala');
  const bad = await fetch(`${base}/appointments/${cita.id}`, json('PATCH', { status: 'volando' }));
  assert.equal(bad.status, 400);
});

test('mover una cita: cambia de día y vuelve a "citado"; detecta choques', { skip }, async () => {
  const cita = await citaDeHoy('700106'); // 12:00 con DRA. SANZ
  const moved = await fetch(`${base}/appointments/${cita.id}`, json('PATCH', { fecha: '2030-01-10', hora: '09:40' }));
  assert.equal(moved.status, 200);
  const m = await moved.json();
  assert.equal(m.fecha, '2030-01-10');
  assert.equal(m.hora, '09:40');
  assert.equal(m.status, 'citado');

  // Otra cita del mismo médico a la misma hora → 409 (conflicto).
  const otra = await citaDeHoy('700105'); // DRA. SANZ, hoy
  const choque = await fetch(`${base}/appointments/${otra.id}`, json('PATCH', { fecha: '2030-01-10', hora: '09:40' }));
  assert.equal(choque.status, 409);
});

test('no se puede mover ni anular una cita atendida; sí una pendiente', { skip }, async () => {
  const atendida = await citaDeHoy('700103'); // atendida en la carga inicial
  assert.equal((await fetch(`${base}/appointments/${atendida.id}`, json('PATCH', { hora: '18:40' }))).status, 409);
  assert.equal((await fetch(`${base}/appointments/${atendida.id}`, { method: 'DELETE' })).status, 409);

  const pendiente = await citaDeHoy('700112');
  assert.equal((await fetch(`${base}/appointments/${pendiente.id}`, { method: 'DELETE' })).status, 204);
  assert.equal(await citaDeHoy('700112'), undefined);
});

test('buscar pacientes por nombre (sin distinguir mayúsculas)', { skip }, async () => {
  const res = await fetch(`${base}/patients?q=DELGADO`);
  const list = await res.json();
  assert.equal(list.length, 1);
  assert.equal(list[0].hc, '700104');
  assert.equal(list[0].num_visitas, 2);
});

test('guardar una visita la añade al historial y marca la cita como atendida', { skip }, async () => {
  const cita = await citaDeHoy('700101');
  const res = await fetch(
    `${base}/patients/700101/visits`,
    json('POST', {
      appointmentId: cita.id,
      profesional: 'Sanz Molina, Laura',
      prestacion: 'REVISIÓN',
      data: { mot: 'Prueba', ten1_od: '14' },
      antecedentes: { alergias: 'PENICILINA', alAct: true },
    })
  );
  assert.equal(res.status, 201);
  const { patient } = await res.json();
  assert.equal(patient.visits.length, 2);
  assert.equal(patient.visits[0].data.mot, 'Prueba', 'la más reciente va primero');
  assert.equal((await citaDeHoy('700101')).status, 'atendido');
});

test('rechaza una visita vacía y un paciente inexistente', { skip }, async () => {
  const empty = await fetch(`${base}/patients/700101/visits`, json('POST', { data: {} }));
  assert.equal(empty.status, 400);
  const missing = await fetch(`${base}/patients/999999`);
  assert.equal(missing.status, 404);
});

test('alta de paciente asigna el siguiente nº de HC', { skip }, async () => {
  const res = await fetch(`${base}/patients`, json('POST', { nombre: 'Prueba Test, Ana', nacimiento: '1990-01-01' }));
  assert.equal(res.status, 201);
  // 700136 es el HC más alto de los datos de práctica.
  assert.equal((await res.json()).hc, '700137');
});

test('editar los datos generales del paciente (y validar)', { skip }, async () => {
  const ok = await fetch(`${base}/patients/700102`, json('PUT', { nombre: 'Benítez Soler, Andrés Javier', mutua: 'MUFACE' }));
  assert.equal(ok.status, 200);
  const p = await ok.json();
  assert.equal(p.nombre, 'Benítez Soler, Andrés Javier');
  assert.equal(p.mutua, 'MUFACE');
  assert.equal(p.sociedad, 'PRIVADO', 'lo que no se envía se conserva');

  const vacio = await fetch(`${base}/patients/700102`, json('PUT', { nombre: '   ' }));
  assert.equal(vacio.status, 400);
  const futuro = await fetch(`${base}/patients/700102`, json('PUT', { nacimiento: '2999-01-01' }));
  assert.equal(futuro.status, 400);
});

test('una visita puede registrarse con otra fecha', { skip }, async () => {
  const res = await fetch(`${base}/patients/700110/visits`, json('POST', { fecha: '2026-01-15', data: { mot: 'Visita atrasada' } }));
  const { patient } = await res.json();
  assert.equal(patient.visits[0].fecha, '2026-01-15');
  const bad = await fetch(`${base}/patients/700110/visits`, json('POST', { fecha: '15/01/2026', data: { mot: 'x' } }));
  assert.equal(bad.status, 400);
});

test('una fecha imposible devuelve 400, no 500', { skip }, async () => {
  const res = await fetch(`${base}/patients/700102`, json('PUT', { nacimiento: '1990-02-31' }));
  assert.equal(res.status, 400);
});

test('reiniciar vuelve a los datos iniciales', { skip }, async () => {
  await fetch(`${base}/reset`, { method: 'POST' });
  const p = await (await fetch(`${base}/patients/700101`)).json();
  assert.equal(p.visits.length, 1);
});
