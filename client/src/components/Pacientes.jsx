// Pantalla "Pacientes": buscador + alta de paciente nuevo.
import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { age } from '../lib/dates.js';
import NuevoPaciente from './NuevoPaciente.jsx';

export default function Pacientes({ onOpen, notify }) {
  const [q, setQ] = useState('');
  const [lista, setLista] = useState([]);
  const [showNew, setShowNew] = useState(false);

  // "Debounce": esperamos 250 ms desde la última tecla antes de buscar, para
  // no lanzar una petición al servidor por cada letra escrita.
  useEffect(() => {
    const t = setTimeout(() => {
      api.searchPatients(q).then(setLista).catch((e) => notify(e.message));
    }, 250);
    return () => clearTimeout(t); // si escribes otra letra, se cancela la anterior
  }, [q, notify]);

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
        <NuevoPaciente notify={notify} onClose={() => setShowNew(false)}
          onCreated={(p) => { setShowNew(false); onOpen(p.hc); }} />
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
