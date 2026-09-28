// =====================================================================
// api.js — todas las llamadas al backend en un solo sitio
// =====================================================================
// Los componentes NUNCA llaman a fetch directamente: usan estas funciones.
// Ventajas: si cambia una URL solo se toca aquí, y el manejo de errores
// es igual en toda la app.
// =====================================================================

async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    // Si nos pasan `body` como objeto, lo convertimos a texto JSON.
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  // fetch NO lanza error con un 404 o 500: hay que comprobarlo a mano.
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload.error || `Error ${res.status}`);
  return payload;
}

export const api = {
  // Agenda
  getAppointments: (fecha) => request(`/appointments?fecha=${fecha}`),
  createAppointment: (cita) => request('/appointments', { method: 'POST', body: cita }),
  setAppointmentStatus: (id, status) => request(`/appointments/${id}`, { method: 'PATCH', body: { status } }),

  // Pacientes
  searchPatients: (q = '') => request(`/patients?q=${encodeURIComponent(q)}`),
  createPatient: (p) => request('/patients', { method: 'POST', body: p }),
  getPatient: (hc) => request(`/patients/${hc}`),
  saveAntecedentes: (hc, antecedentes) => request(`/patients/${hc}/antecedentes`, { method: 'PUT', body: antecedentes }),
  saveVisit: (hc, visit) => request(`/patients/${hc}/visits`, { method: 'POST', body: visit }),

  // Práctica
  reset: () => request('/reset', { method: 'POST' }),
};
