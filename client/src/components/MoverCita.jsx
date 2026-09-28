// =====================================================================
// MoverCita.jsx — reprogramar una cita (otro día, hora o médico)
// =====================================================================
// Solo enviamos al servidor lo que ha cambiado (PATCH = modificación
// parcial). El servidor comprueba que no choque con otra cita y, si la
// cita cambia de día, la devuelve al estado "citado".
// =====================================================================

import { useState } from 'react';
import { api } from '../api.js';
import { MEDICOS } from '../lib/fields.js';
import { isoToDMY, longDate } from '../lib/dates.js';
import SlotPicker from './SlotPicker.jsx';

export default function MoverCita({ cita, notify, onClose, onMoved }) {
  const [form, setForm] = useState({ fecha: cita.fecha, hora: cita.hora, medico: cita.medico, nota: cita.nota });
  const [saving, setSaving] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  // Construimos un objeto solo con los campos que cambian respecto a la cita.
  const changes = Object.fromEntries(Object.entries(form).filter(([k, v]) => v !== cita[k]));
  const nothingChanged = Object.keys(changes).length === 0;

  async function submit(e) {
    e.preventDefault();
    if (nothingChanged) return onClose();
    setSaving(true);
    try {
      const updated = await api.moveAppointment(cita.id, changes);
      notify(`Cita movida al ${longDate(updated.fecha)} a las ${updated.hora}`);
      onMoved(updated);
    } catch (err) {
      notify(err.message); // p. ej. 409: "DRA. SANZ ya tiene una cita..."
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="panel" onSubmit={submit}>
      <div className="panel-t">
        Mover cita · {cita.nombre.toUpperCase()} · {isoToDMY(cita.fecha)} {cita.hora} ({cita.medico})
      </div>
      <div className="form-grid">
        <label className="tf"><span>Nueva fecha</span>
          <input className="in" type="date" value={form.fecha} onChange={(e) => set('fecha')(e.target.value)} required />
        </label>
        <label className="tf"><span>Médico</span>
          <select className="in" value={form.medico} onChange={(e) => set('medico')(e.target.value)}>
            {MEDICOS.map((m) => <option key={m}>{m}</option>)}
          </select>
        </label>
        <label className="tf"><span>Nota</span>
          <input className="in" value={form.nota} onChange={(e) => set('nota')(e.target.value)} />
        </label>
      </div>
      {form.fecha && (
        <SlotPicker fecha={form.fecha} medico={form.medico} value={form.hora} onChange={set('hora')} exceptId={cita.id} />
      )}
      <div className="panel-actions">
        <button type="button" className="btn" onClick={onClose}>Cancelar</button>
        <button type="submit" className="btn pri" disabled={saving || nothingChanged}>{saving ? 'Moviendo…' : 'Mover cita'}</button>
      </div>
    </form>
  );
}
