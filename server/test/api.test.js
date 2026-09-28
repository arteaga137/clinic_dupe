// =====================================================================
// Tests de la API con el test runner que trae Node (node:test).
// Ejecuta: `npm test` dentro de /server
//
// Cada test arranca la app en un puerto libre y le hace peticiones reales
// con fetch, igual que haría el frontend. La BD es ':memory:' (vive solo
// en RAM), así que los tests nunca tocan tu clinic.db.
// =====================================================================
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.DB_PATH = ':memory:';
// Import dinámico: debe ocurrir DESPUÉS de fijar DB_PATH.
const { app } = await import('../src/app.js');

let server;
let base;

before(async () => {
  server = app.listen(0); // 0 = "dame cualquier puerto libre"
  await new Promise((r) => server.once('listening', r));
  base = `http://localhost:${server.address().port}/api`;
});
after(() => server.close());

const json = (method, body) => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

test('la agenda de hoy trae las citas de práctica con el nombre del paciente', async () => {
  const res = await fetch(`${base}/appointments`);
  assert.equal(res.status, 200);
  const citas = await res.json();
  assert.equal(citas.length, 12);
  assert.ok(citas[0].nombre, 'cada cita incluye el nombre (JOIN con patients)');
  assert.equal(typeof citas[0].urgente, 'boolean');
});

test('cambiar el estado de una cita valida los valores', async () => {
  const ok = await fetch(`${base}/appointments/6`, json('PATCH', { status: 'sala' }));
  assert.equal((await ok.json()).status, 'sala');
  const bad = await fetch(`${base}/appointments/6`, json('PATCH', { status: 'volando' }));
  assert.equal(bad.status, 400);
});

test('buscar pacientes por nombre', async () => {
  const res = await fetch(`${base}/patients?q=delgado`);
  const list = await res.json();
  assert.equal(list.length, 1);
  assert.equal(list[0].hc, '700104');
  assert.equal(list[0].num_visitas, 2);
});

test('guardar una visita la añade al historial y marca la cita como atendida', async () => {
  const res = await fetch(
    `${base}/patients/700101/visits`,
    json('POST', {
      appointmentId: 6,
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

  const citas = await (await fetch(`${base}/appointments`)).json();
  assert.equal(citas.find((c) => c.id === 6).status, 'atendido');
});

test('rechaza una visita vacía y un paciente inexistente', async () => {
  const empty = await fetch(`${base}/patients/700101/visits`, json('POST', { data: {} }));
  assert.equal(empty.status, 400);
  const missing = await fetch(`${base}/patients/999999`);
  assert.equal(missing.status, 404);
});

test('alta de paciente asigna el siguiente nº de HC', async () => {
  const res = await fetch(`${base}/patients`, json('POST', { nombre: 'Prueba Test, Ana', nacimiento: '1990-01-01' }));
  assert.equal(res.status, 201);
  assert.equal((await res.json()).hc, '700113');
});

test('editar los datos generales del paciente (y validar)', async () => {
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

test('una visita puede registrarse con otra fecha', async () => {
  const res = await fetch(`${base}/patients/700110/visits`, json('POST', { fecha: '2026-01-15', data: { mot: 'Visita atrasada' } }));
  const { patient } = await res.json();
  assert.equal(patient.visits[0].fecha, '2026-01-15');
  const bad = await fetch(`${base}/patients/700110/visits`, json('POST', { fecha: '15/01/2026', data: { mot: 'x' } }));
  assert.equal(bad.status, 400);
});

test('reiniciar vuelve a los datos iniciales', async () => {
  await fetch(`${base}/reset`, { method: 'POST' });
  const p = await (await fetch(`${base}/patients/700101`)).json();
  assert.equal(p.visits.length, 1);
});
