// =====================================================================
// Agenda.jsx — lista de citas del día
// =====================================================================
// Conceptos clave de este archivo:
//  • useEffect: ejecuta código DESPUÉS de pintar. Aquí, pedir las citas al
//    servidor cada vez que cambia `fecha`.
//  • Estado derivado: `visibles` NO se guarda en el estado; se calcula en
//    cada render a partir de `citas` + filtros. Guardarlo aparte sería
//    duplicar información y arriesgarse a que se desincronice.
// =====================================================================

import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { addDays, age, longDate, toISO } from '../lib/dates.js';
import { MEDICOS } from '../lib/fields.js';
import { Icon } from './ui.jsx';
import NuevaCita from './NuevaCita.jsx';

// Traducimos el estado de la cita a clases CSS (colores de la fila/hora).
function rowClass(c, selected) {
  if (selected) return 'ag-row sel';
  return { sala: 'ag-row y', consulta: 'ag-row c' }[c.status] || 'ag-row';
}
function horaClass(c) {
  if (c.urgente && c.status !== 'atendido') return 'hora r';
  return { atendido: 'hora g', citado: 'hora w' }[c.status] || 'hora b';
}
const E_LETTER = { atendido: 'V', sala: 'S', consulta: 'C', citado: '' };

export default function Agenda({ fecha, setFecha, onOpen, notify }) {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selId, setSelId] = useState(null);
  const [turno, setTurno] = useState('todo'); // 'm' | 't' | 'todo'
  const [medico, setMedico] = useState('TODOS');
  const [showNew, setShowNew] = useState(false);
  const [reload, setReload] = useState(0); // incrementarlo fuerza recargar

  useEffect(() => {
    // `ignore` evita un error clásico: si cambias de día rápido, una
    // respuesta antigua podría llegar tarde y pisar a la nueva.
    let ignore = false;
    setLoading(true);
    api.getAppointments(fecha)
      .then((data) => { if (!ignore) setCitas(data); })
      .catch((e) => notify(e.message))
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; }; // "cleanup": se ejecuta antes del siguiente efecto
  }, [fecha, reload, notify]); // ← dependencias: el efecto se repite si cambian

  const visibles = citas.filter((c) =>
    (turno === 'todo' || (turno === 'm' ? c.hora < '14:00' : c.hora >= '14:00')) &&
    (medico === 'TODOS' || c.medico === medico)
  );
  const sel = citas.find((c) => c.id === selId);
  const count = (fn) => citas.filter(fn).length;

  async function marcarLlegada() {
    if (!sel) return notify('Selecciona una cita');
    if (sel.status !== 'citado') return notify('Esa cita ya no está en estado "citado"');
    try {
      const updated = await api.setAppointmentStatus(sel.id, 'sala');
      // Reemplazamos solo la cita modificada, sin recargar toda la lista.
      setCitas((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      notify('Paciente marcado en sala');
    } catch (e) { notify(e.message); }
  }

  async function abrir(c = sel) {
    if (!c) return notify('Selecciona una cita');
    try {
      // Al abrir la historia, la cita pasa a "en consulta" (si no estaba atendida).
      if (c.status !== 'atendido') await api.setAppointmentStatus(c.id, 'consulta');
      onOpen(c.hc, c.id, c.prestacion);
    } catch (e) { notify(e.message); }
  }

  async function reiniciar() {
    if (!window.confirm('Se borrarán todas las visitas guardadas y se recargarán los datos iniciales. ¿Continuar?')) return;
    try {
      await api.reset();
      setFecha(toISO());
      setSelId(null);
      setReload((n) => n + 1);
      notify('Datos de práctica reiniciados');
    } catch (e) { notify(e.message); }
  }

  return (
    <div className="scr">
      <div className="ag-tools">
        <div className="agt-box">
          <button type="button" className="ib" aria-label="Día anterior" onClick={() => setFecha(addDays(fecha, -1))}><Icon name="left" /></button>
          <span className="ro date-ro">{longDate(fecha)}</span>
          <button type="button" className="ib" aria-label="Día siguiente" onClick={() => setFecha(addDays(fecha, 1))}><Icon name="right" /></button>
          <button type="button" className="hoy" onClick={() => setFecha(toISO())}>HOY</button>
        </div>
        <div className="agt-box" role="radiogroup" aria-label="Turno">
          {[['m', 'Mañana'], ['t', 'Tarde'], ['todo', 'Todo']].map(([v, l]) => (
            <label key={v} className="ck">
              <input type="radio" name="turno" checked={turno === v} onChange={() => setTurno(v)} /> {l}
            </label>
          ))}
        </div>
        <div className="agt-box">
          <span className="cnt">
            PRE: {count((c) => c.status !== 'citado')} · ATE: {count((c) => c.status === 'atendido')} · CIT: {citas.length}
          </span>
        </div>
        <label className="agt-box">
          <span className="lbl">Médicos</span>
          <select className="in" style={{ width: 140 }} value={medico} onChange={(e) => setMedico(e.target.value)}>
            <option value="TODOS">&lt;TODOS&gt;</option>
            {MEDICOS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <button type="button" className="btn" onClick={marcarLlegada}>Marcar llegada</button>
        <button type="button" className="btn pri" onClick={() => abrir()}>Abrir H.Clínica</button>
        <button type="button" className="btn" onClick={() => setShowNew(true)}>Nueva cita</button>
        <button type="button" className="btn" onClick={reiniciar}>Reiniciar práctica</button>
      </div>

      {showNew && (
        <NuevaCita
          fecha={fecha}
          notify={notify}
          onClose={() => setShowNew(false)}
          onCreated={() => { setShowNew(false); setReload((n) => n + 1); }}
        />
      )}

      <div className="ag" role="table" aria-label="Agenda del día">
        <div className="ag-row ag-h" role="row">
          <div>HORA</div><div className="hm">TICKET</div><div className="hm">E</div><div className="hm">NOTA</div>
          <div className="hm">MÉDICO</div><div>PACIENTE</div><div>EDAD</div><div className="hm">SOCIEDAD</div>
          <div className="hm">PRESTACIÓN</div><div className="hm">HC</div>
        </div>
        {loading && <div className="empty">Cargando…</div>}
        {!loading && visibles.length === 0 && <div className="empty">No hay citas para este día / filtro.</div>}
        {visibles.map((c) => (
          <div key={c.id} role="row" className={rowClass(c, c.id === selId)}
            onClick={() => setSelId(c.id)} onDoubleClick={() => abrir(c)}>
            <div className={horaClass(c)}>{c.hora}</div>
            <div className="hm">{c.ticket}</div>
            <div className="hm">{E_LETTER[c.status]}</div>
            <div className="hm">{c.nota}</div>
            <div className="hm">{c.medico}</div>
            <div className="pac">
              <span>(@) {c.nombre.toUpperCase()}</span>
              <span className="sm-only">{c.prestacion} · {c.sociedad}</span>
            </div>
            <div>{age(c.nacimiento)}</div>
            <div className="hm">{c.sociedad}</div>
            <div className="hm">{c.prestacion}</div>
            <div className="hm">{c.hc}</div>
          </div>
        ))}
      </div>

      {/* Barra inferior solo visible en móvil (ver CSS), donde no hay doble clic cómodo. */}
      {sel && (
        <div className="sel-bar">
          <span className="nm">{sel.nombre} · {sel.hora}</span>
          <button type="button" className="btn" onClick={marcarLlegada}>Llegada</button>
          <button type="button" className="btn pri" onClick={() => abrir()}>Abrir</button>
        </div>
      )}

      <div className="legend">
        <b>LEYENDA:</b> fila amarilla = en sala · verde claro = en consulta · azul = seleccionado ·
        hora verde = atendido · hora roja = urgencia. Doble clic en un paciente (o selecciónalo y
        pulsa <b>Abrir H.Clínica</b>) para abrir su historia.
      </div>
    </div>
  );
}
