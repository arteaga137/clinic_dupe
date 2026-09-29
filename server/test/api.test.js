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

// ---- utilidades de fechas para los tests (fecha local AAAA-MM-DD) ----
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
/** Día laborable a `n` días laborables de hoy (n < 0 = pasado). */
function workday(n) {
  const d = new Date();
  const step = n < 0 ? -1 : 1;
  for (let left = Math.abs(n); left > 0;) { d.setDate(d.getDate() + step); if (![0, 6].includes(d.getDay())) left--; }
  return iso(d);
}
const agenda = async (fecha) => (await fetch(`${base}/appointments?fecha=${fecha}`)).json();

test('cualquier día laborable se rellena solo con ~30 citas (pasado, futuro, lejano)', { skip }, async () => {
  for (const n of [-7, -1, 1, 5, 40]) {
    const citas = await agenda(workday(n));
    assert.ok(citas.length >= 25, `día ${n}: solo ${citas.length} citas`);
    assert.ok(citas[0].nombre, 'cada cita incluye el nombre (JOIN con patients)');
    const esperado = n < 0 ? 'atendido' : 'citado';
    assert.ok(citas.every((c) => c.status === esperado), `día ${n}: todas deberían estar ${esperado}`);
  }
});

test('abrir el mismo día dos veces no duplica citas', { skip }, async () => {
  const f = workday(3);
  const a = await agenda(f);
  const b = await agenda(f);
  assert.equal(a.length, b.length);
});

test('los fines de semana no hay consulta', { skip }, async () => {
  const d = new Date();
  while (d.getDay() !== 6) d.setDate(d.getDate() + 1); // próximo sábado
  assert.equal((await agenda(iso(d))).length, 0);
});

test('las citas de días pasados tienen su visita en la historia clínica', { skip }, async () => {
  const [cita] = await agenda(workday(-2));
  const p = await (await fetch(`${base}/patients/${cita.hc}`)).json();
  const visita = p.visits.find((v) => v.appointment_id === cita.id);
  assert.ok(visita, 'la cita atendida tiene una visita enlazada');
  assert.ok(visita.data.dx_dx || visita.data.est_trat || visita.data.mot, 'la visita tiene contenido clínico');
});

test('si anulas todas las citas de un día, no se vuelve a rellenar', { skip }, async () => {
  const f = workday(8);
  for (const c of await agenda(f)) await fetch(`${base}/appointments/${c.id}`, { method: 'DELETE' });
  assert.equal((await agenda(f)).length, 0);
});

test('cambiar el estado de una cita valida los valores', { skip }, async () => {
  const [cita] = await agenda(workday(1));
  const ok = await fetch(`${base}/appointments/${cita.id}`, json('PATCH', { status: 'sala' }));
  assert.equal((await ok.json()).status, 'sala');
  const bad = await fetch(`${base}/appointments/${cita.id}`, json('PATCH', { status: 'volando' }));
  assert.equal(bad.status, 400);
});

test('mover una cita: cambia de día y vuelve a "citado"; detecta choques', { skip }, async () => {
  const citas = await agenda(workday(2));
  const [a, b] = citas.filter((c) => c.medico === 'DRA. SANZ');
  await fetch(`${base}/appointments/${a.id}`, json('PATCH', { status: 'sala' }));
  const moved = await fetch(`${base}/appointments/${a.id}`, json('PATCH', { fecha: '2030-01-10', hora: '09:40' }));
  assert.equal(moved.status, 200);
  const m = await moved.json();
  assert.equal(m.fecha, '2030-01-10');
  assert.equal(m.hora, '09:40');
  assert.equal(m.status, 'citado');
  // Otra cita del mismo médico a la misma hora → 409 (conflicto).
  const choque = await fetch(`${base}/appointments/${b.id}`, json('PATCH', { fecha: '2030-01-10', hora: '09:40' }));
  assert.equal(choque.status, 409);
});

test('no se puede mover ni anular una cita atendida; sí una pendiente', { skip }, async () => {
  const [atendida] = await agenda(workday(-3));
  assert.equal((await fetch(`${base}/appointments/${atendida.id}`, json('PATCH', { hora: '18:40' }))).status, 409);
  assert.equal((await fetch(`${base}/appointments/${atendida.id}`, { method: 'DELETE' })).status, 409);
  const [pendiente] = await agenda(workday(4));
  assert.equal((await fetch(`${base}/appointments/${pendiente.id}`, { method: 'DELETE' })).status, 204);
  assert.ok(!(await agenda(workday(4))).some((c) => c.id === pendiente.id));
});

test('buscar pacientes: hay cientos y se buscan sin distinguir mayúsculas', { skip }, async () => {
  const todos = await (await fetch(`${base}/patients`)).json();
  assert.ok(todos.length >= 400, `solo ${todos.length} pacientes`);
  const list = await (await fetch(`${base}/patients?q=DELGADO FERRER`)).json();
  assert.equal(list[0].hc, '700104');
  assert.ok(list[0].num_visitas >= 2);
});

test('guardar una visita la añade al historial y marca la cita como atendida', { skip }, async () => {
  const [cita] = await agenda(workday(6));
  const antes = (await (await fetch(`${base}/patients/${cita.hc}`)).json()).visits.length;
  const res = await fetch(
    `${base}/patients/${cita.hc}/visits`,
    json('POST', { appointmentId: cita.id, profesional: 'Sanz Molina, Laura', prestacion: cita.prestacion, data: { mot: 'Prueba', ten1_od: '14' } })
  );
  assert.equal(res.status, 201);
  const { patient } = await res.json();
  assert.equal(patient.visits.length, antes + 1);
  assert.equal(patient.visits[0].data.mot, 'Prueba', 'la más reciente va primero');
  assert.equal((await agenda(workday(6))).find((c) => c.id === cita.id).status, 'atendido');
});

test('rechaza una visita vacía y un paciente inexistente', { skip }, async () => {
  const empty = await fetch(`${base}/patients/700101/visits`, json('POST', { data: {} }));
  assert.equal(empty.status, 400);
  const missing = await fetch(`${base}/patients/999999`);
  assert.equal(missing.status, 404);
});

test('alta de paciente asigna el siguiente nº de HC', { skip }, async () => {
  const todos = await (await fetch(`${base}/patients`)).json();
  const max = Math.max(...todos.map((p) => Number(p.hc)));
  const res = await fetch(`${base}/patients`, json('POST', { nombre: 'Prueba Test, Ana', nacimiento: '1990-01-01' }));
  assert.equal(res.status, 201);
  assert.equal((await res.json()).hc, String(max + 1));
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
  const res = await fetch(`${base}/patients/700110/visits`, json('POST', { fecha: '2030-01-15', data: { mot: 'Visita adelantada' } }));
  const { patient } = await res.json();
  assert.equal(patient.visits[0].fecha, '2030-01-15');
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
  assert.ok((await agenda(workday(1))).length >= 25, 'y la agenda se vuelve a rellenar');
});
