// Formulario para dar una cita nueva a un paciente que ya existe.
import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { MEDICOS, PRESTACIONES } from '../lib/fields.js';
import SlotPicker from './SlotPicker.jsx';

export default function NuevaCita({ fecha, notify, onClose, onCreated }) {
  const [pacientes, setPacientes] = useState([]);
  // Un solo objeto de estado para todo el formulario pequeño.
  const [cita, setCita] = useState({ fecha, hc: '', hora: '', medico: MEDICOS[0], prestacion: PRESTACIONES[0], nota: '', urgente: false });
  const set = (k) => (e) => setCita({ ...cita, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  useEffect(() => {
    api.searchPatients().then(setPacientes).catch((e) => notify(e.message));
  }, [notify]);

  async function submit(e) {
    e.preventDefault(); // evita que el navegador recargue la página al enviar el <form>
    if (!cita.hc) return notify('Elige un paciente');
    if (!cita.hora) return notify('Elige una hora');
    try {
      const creada = await api.createAppointment(cita);
      notify('Cita creada');
      onCreated(creada);
    } catch (err) { notify(err.message); }
  }

  return (
    <form className="panel" onSubmit={submit}>
      <div className="panel-t">Nueva cita</div>
      <div className="form-grid">
        <label className="tf"><span>Paciente</span>
          <select className="in" value={cita.hc} onChange={set('hc')} required>
            <option value="">— elegir —</option>
            {pacientes.map((p) => <option key={p.hc} value={p.hc}>{p.nombre} ({p.hc})</option>)}
          </select>
        </label>
        <label className="tf"><span>Fecha</span><input className="in" type="date" value={cita.fecha} onChange={set('fecha')} required /></label>
        <label className="tf"><span>Médico</span>
          <select className="in" value={cita.medico} onChange={set('medico')}>{MEDICOS.map((m) => <option key={m}>{m}</option>)}</select>
        </label>
        <label className="tf"><span>Prestación</span>
          <select className="in" value={cita.prestacion} onChange={set('prestacion')}>{PRESTACIONES.map((p) => <option key={p}>{p}</option>)}</select>
        </label>
        <label className="tf"><span>Nota</span><input className="in" value={cita.nota} onChange={set('nota')} /></label>
        <label className="ck" style={{ alignSelf: 'end' }}><input type="checkbox" checked={cita.urgente} onChange={set('urgente')} /> Urgente</label>
      </div>
      {cita.fecha && <SlotPicker fecha={cita.fecha} medico={cita.medico} value={cita.hora} onChange={(h) => setCita((c) => ({ ...c, hora: h }))} />}
      <div className="panel-actions">
        <button type="button" className="btn" onClick={onClose}>Cancelar</button>
        <button type="submit" className="btn pri">Crear cita</button>
      </div>
    </form>
  );
}
