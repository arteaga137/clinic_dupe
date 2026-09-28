// =====================================================================
// NuevoPaciente.jsx — alta de paciente, con opción de darle cita
// =====================================================================
// Se usa desde la Agenda (con "Dar cita" marcado) y desde Pacientes.
// Son DOS peticiones seguidas: primero se crea el paciente (el servidor
// le asigna el nº de HC) y, con ese HC, se crea la cita. Si la cita
// falla (hueco ocupado), el paciente ya existe: lo decimos claramente.
// =====================================================================

import { useState } from 'react';
import { api } from '../api.js';
import { MEDICOS, PRESTACIONES, SOCIEDADES } from '../lib/fields.js';
import { toISO } from '../lib/dates.js';
import SlotPicker from './SlotPicker.jsx';

export default function NuevoPaciente({ fecha = toISO(), conCita = false, notify, onClose, onCreated }) {
  const [p, setP] = useState({ apellidos: '', nombre: '', nacimiento: '', sociedad: SOCIEDADES[0], mutua: '' });
  const [darCita, setDarCita] = useState(conCita);
  const [cita, setCita] = useState({ fecha, hora: '', medico: MEDICOS[0], prestacion: PRESTACIONES[0], nota: '', urgente: false });
  const [saving, setSaving] = useState(false);
  const setPac = (k) => (e) => setP({ ...p, [k]: e.target.value });
  const setCit = (k) => (e) => setCita({ ...cita, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  async function submit(e) {
    e.preventDefault();
    if (darCita && !cita.hora) return notify('Elige la hora de la cita');
    setSaving(true);
    try {
      // El programa guarda el nombre como "Apellidos, Nombre".
      const nombre = `${p.apellidos.trim()}, ${p.nombre.trim()}`;
      const paciente = await api.createPatient({ nombre, nacimiento: p.nacimiento, sociedad: p.sociedad, mutua: p.mutua });
      let nuevaCita = null;
      if (darCita) {
        try {
          nuevaCita = await api.createAppointment({ ...cita, hc: paciente.hc });
        } catch (err) {
          notify(`Paciente creado (HC ${paciente.hc}), pero la cita no: ${err.message}`);
          return onCreated(paciente, null);
        }
      }
      notify(nuevaCita ? `Paciente ${paciente.hc} creado y citado a las ${nuevaCita.hora}` : `Paciente creado con HC ${paciente.hc}`);
      onCreated(paciente, nuevaCita);
    } catch (err) {
      notify(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="panel" onSubmit={submit}>
      <div className="panel-t">Alta de paciente</div>
      <div className="form-grid">
        <label className="tf"><span>Apellidos</span>
          <input className="in" required autoFocus value={p.apellidos} onChange={setPac('apellidos')} placeholder="García López" />
        </label>
        <label className="tf"><span>Nombre</span>
          <input className="in" required value={p.nombre} onChange={setPac('nombre')} placeholder="Ana" />
        </label>
        <label className="tf"><span>Fecha de nacimiento</span>
          <input className="in" type="date" required max={toISO()} value={p.nacimiento} onChange={setPac('nacimiento')} />
        </label>
        <label className="tf"><span>Sociedad</span>
          <select className="in" value={p.sociedad} onChange={setPac('sociedad')}>
            {SOCIEDADES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label className="tf"><span>Mutua</span>
          <input className="in" value={p.mutua} onChange={setPac('mutua')} />
        </label>
      </div>

      <label className="ck mt"><input type="checkbox" checked={darCita} onChange={(e) => setDarCita(e.target.checked)} /> Dar cita ahora</label>

      {darCita && (
        <fieldset className="sgroup mt">
          <legend>Cita</legend>
          <div className="form-grid">
            <label className="tf"><span>Fecha</span>
              <input className="in" type="date" required value={cita.fecha} onChange={setCit('fecha')} />
            </label>
            <label className="tf"><span>Médico</span>
              <select className="in" value={cita.medico} onChange={setCit('medico')}>{MEDICOS.map((m) => <option key={m}>{m}</option>)}</select>
            </label>
            <label className="tf"><span>Prestación</span>
              <select className="in" value={cita.prestacion} onChange={setCit('prestacion')}>{PRESTACIONES.map((x) => <option key={x}>{x}</option>)}</select>
            </label>
            <label className="tf"><span>Nota</span><input className="in" value={cita.nota} onChange={setCit('nota')} /></label>
            <label className="ck" style={{ alignSelf: 'end' }}><input type="checkbox" checked={cita.urgente} onChange={setCit('urgente')} /> Urgente</label>
          </div>
          {cita.fecha && (
            <SlotPicker fecha={cita.fecha} medico={cita.medico} value={cita.hora} onChange={(h) => setCita((c) => ({ ...c, hora: h }))} />
          )}
        </fieldset>
      )}

      <div className="panel-actions">
        <button type="button" className="btn" onClick={onClose}>Cancelar</button>
        <button type="submit" className="btn pri" disabled={saving}>
          {saving ? 'Guardando…' : darCita ? 'Crear paciente y dar cita' : 'Crear paciente'}
        </button>
      </div>
    </form>
  );
}
