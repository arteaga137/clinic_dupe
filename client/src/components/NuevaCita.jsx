// Formulario para dar una cita nueva en el día que muestra la agenda.
import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { MEDICOS, PRESTACIONES } from '../lib/fields.js';
import { isoToDMY } from '../lib/dates.js';

export default function NuevaCita({ fecha, notify, onClose, onCreated }) {
  const [pacientes, setPacientes] = useState([]);
  // Un solo objeto de estado para todo el formulario pequeño.
  const [cita, setCita] = useState({ hc: '', hora: '13:00', medico: MEDICOS[0], prestacion: PRESTACIONES[0], nota: '', urgente: false });
  const set = (k) => (e) => setCita({ ...cita, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  useEffect(() => {
    api.searchPatients().then(setPacientes).catch((e) => notify(e.message));
  }, [notify]);

  async function submit(e) {
    e.preventDefault(); // evita que el navegador recargue la página al enviar el <form>
    if (!cita.hc) return notify('Elige un paciente');
    try {
      await api.createAppointment({ ...cita, fecha });
      notify('Cita creada');
      onCreated();
    } catch (err) { notify(err.message); }
  }

  return (
    <form className="panel" onSubmit={submit}>
      <div className="panel-t">Nueva cita · {isoToDMY(fecha)}</div>
      <div className="form-grid">
        <label className="tf"><span>Paciente</span>
          <select className="in" value={cita.hc} onChange={set('hc')} required>
            <option value="">— elegir —</option>
            {pacientes.map((p) => <option key={p.hc} value={p.hc}>{p.nombre} ({p.hc})</option>)}
          </select>
        </label>
        <label className="tf"><span>Hora</span><input className="in" type="time" value={cita.hora} onChange={set('hora')} required /></label>
        <label className="tf"><span>Médico</span>
          <select className="in" value={cita.medico} onChange={set('medico')}>{MEDICOS.map((m) => <option key={m}>{m}</option>)}</select>
        </label>
        <label className="tf"><span>Prestación</span>
          <select className="in" value={cita.prestacion} onChange={set('prestacion')}>{PRESTACIONES.map((p) => <option key={p}>{p}</option>)}</select>
        </label>
        <label className="tf"><span>Nota</span><input className="in" value={cita.nota} onChange={set('nota')} /></label>
        <label className="ck" style={{ alignSelf: 'end' }}><input type="checkbox" checked={cita.urgente} onChange={set('urgente')} /> Urgente</label>
      </div>
      <div className="panel-actions">
        <button type="button" className="btn" onClick={onClose}>Cancelar</button>
        <button type="submit" className="btn pri">Crear cita</button>
      </div>
    </form>
  );
}
