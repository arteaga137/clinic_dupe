// Pantalla "Pacientes": buscador + alta de paciente nuevo.
import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { age } from '../lib/dates.js';
import { SOCIEDADES } from '../lib/fields.js';

export default function Pacientes({ onOpen, notify }) {
  const [q, setQ] = useState('');
  const [lista, setLista] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [nuevo, setNuevo] = useState({ nombre: '', nacimiento: '', sociedad: SOCIEDADES[0] });

  // "Debounce": esperamos 250 ms desde la última tecla antes de buscar, para
  // no lanzar una petición al servidor por cada letra escrita.
  useEffect(() => {
    const t = setTimeout(() => {
      api.searchPatients(q).then(setLista).catch((e) => notify(e.message));
    }, 250);
    return () => clearTimeout(t); // si escribes otra letra, se cancela la anterior
  }, [q, notify]);

  async function crear(e) {
    e.preventDefault();
    try {
      const p = await api.createPatient(nuevo);
      notify(`Paciente creado con HC ${p.hc}`);
      setShowNew(false);
      setNuevo({ nombre: '', nacimiento: '', sociedad: SOCIEDADES[0] });
      onOpen(p.hc);
    } catch (err) { notify(err.message); }
  }

  return (
    <div className="scr">
      <div className="win-t">Pacientes</div>
      <div className="ag-tools">
        <label className="agt-box grow1">
          <span className="lbl">Buscar</span>
          <input className="in" placeholder="Nombre o nº de HC" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <button type="button" className="btn pri" onClick={() => setShowNew(!showNew)}>Nuevo paciente</button>
      </div>

      {showNew && (
        <form className="panel" onSubmit={crear}>
          <div className="panel-t">Alta de paciente</div>
          <div className="form-grid">
            <label className="tf"><span>Apellidos, Nombre</span>
              <input className="in" required value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} />
            </label>
            <label className="tf"><span>Fecha de nacimiento</span>
              <input className="in" type="date" required value={nuevo.nacimiento} onChange={(e) => setNuevo({ ...nuevo, nacimiento: e.target.value })} />
            </label>
            <label className="tf"><span>Sociedad</span>
              <select className="in" value={nuevo.sociedad} onChange={(e) => setNuevo({ ...nuevo, sociedad: e.target.value })}>
                {SOCIEDADES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
          </div>
          <div className="panel-actions">
            <button type="button" className="btn" onClick={() => setShowNew(false)}>Cancelar</button>
            <button type="submit" className="btn pri">Crear y abrir historia</button>
          </div>
        </form>
      )}

      <div className="pac-list">
        <div className="pl-row ag-h"><div>HC</div><div>NOMBRE</div><div className="hm">EDAD</div><div className="hm">SOCIEDAD</div><div></div></div>
        {lista.map((p) => (
          <div key={p.hc} className="pl-row">
            <div>{p.hc}</div>
            <div>{p.nombre.toUpperCase()}<div className="muted">{p.num_visitas} visita(s) registradas</div></div>
            <div className="hm">{age(p.nacimiento)} años</div>
            <div className="hm">{p.sociedad}</div>
            <div><button type="button" className="btn" onClick={() => onOpen(p.hc)}>Abrir</button></div>
          </div>
        ))}
        {lista.length === 0 && <div className="empty">Sin resultados.</div>}
      </div>
    </div>
  );
}
