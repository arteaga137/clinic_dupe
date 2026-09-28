// Sección "Refracción": varias tablas RxGrid, algunas con pestañas.
import { useState } from 'react';
import RxGrid from '../RxGrid.jsx';
import { Select } from '../ui.jsx';
import { GRIDS, PROFESIONALES, gridKey, hasValue } from '../../lib/fields.js';

/** Recuadro con título (o pestañas) que envuelve una tabla. */
function Panel({ width, title, tabs, children }) {
  return (
    <div className={`pn ${width}`}>
      <div className="tabs">
        <span className="mk" />
        {title && <span className="tt">{title}</span>}
        {tabs?.map((t) => (
          <button key={t.label} type="button" className={t.active ? 'tab on' : 'tab'} onClick={t.onClick}>{t.label}</button>
        ))}
      </div>
      {children}
    </div>
  );
}

export default function Refraccion({ fm, notify, visits }) {
  // Estado local: qué pestaña está activa. No se guarda en la BD, por eso
  // vive aquí y no en el formulario.
  const [gafas, setGafas] = useState('cp1');
  const [extra, setExtra] = useState('rcc');

  const tabsFrom = (ids, current, set, label = (id) => GRIDS[id].title) =>
    ids.map((id) => ({ label: label(id), active: id === current, onClick: () => set(id) }));

  function crearReceta() {
    // Copia los valores de la Manifiesta a la Receta de gafas.
    let n = 0;
    for (const eye of ['od', 'oi']) {
      for (const c of GRIDS.man.cols) {
        const v = fm.form[gridKey('man', eye, c.id)];
        if (hasValue(v)) { fm.setField(gridKey('rx', eye, c.id), v); n++; }
      }
    }
    notify(n ? 'Receta creada a partir de la Manifiesta' : 'Rellena primero la Manifiesta');
  }

  function verRecetas() {
    const n = visits.filter((v) => Object.keys(v.data).some((k) => k.startsWith('rx_'))).length;
    notify(n ? `${n} receta(s) en visitas anteriores` : 'Sin recetas anteriores');
  }

  return (
    <>
      <div className="ref-top">
        <label className="fld"><span>Realizado por:</span>
          <Select fm={fm} k="ref_por" options={['', ...PROFESIONALES]} style={{ width: 190 }} />
        </label>
      </div>
      <div className="ref-wrap">
        <Panel width="w2" title="Av. Lejos sin corrección"><RxGrid fm={fm} gridId="avl" /></Panel>
        <Panel width="w2" title="Av. Cerca sin corrección"><RxGrid fm={fm} gridId="avc" /></Panel>
        <Panel width="w3" title="Auto"><RxGrid fm={fm} gridId="auto" /></Panel>
        <Panel width="w3" title="Ciclo"><RxGrid fm={fm} gridId="ciclo" /></Panel>
        <Panel width="w3" title="Queratometría"><RxGrid fm={fm} gridId="ker" minWidth={300} /></Panel>
        <Panel width="w1" title="Corrección previa"
          tabs={tabsFrom(['cp1', 'cp2', 'cp3'], gafas, setGafas, (id) => `Gafas ${id.slice(-1)}`)}>
          {/* key={gafas}: al cambiar de pestaña, React crea una tabla nueva */}
          <RxGrid key={gafas} fm={fm} gridId={gafas} minWidth={620} />
        </Panel>
        <Panel width="w1" title="Manifiesta"><RxGrid fm={fm} gridId="man" minWidth={620} /></Panel>
        <Panel width="w1" title="Receta de gafas">
          <RxGrid fm={fm} gridId="rx" minWidth={620} />
          <div className="rxbtns">
            <button type="button" className="btn" onClick={crearReceta}>Crear Receta</button>
            <button type="button" className="btn" onClick={verRecetas}>Ver Recetas</button>
          </div>
        </Panel>
        <Panel width="w1" tabs={tabsFrom(['rcc', 'rcr', 'rcq', 'rca'], extra, setExtra)}>
          <RxGrid key={extra} fm={fm} gridId={extra} minWidth={620} />
        </Panel>
      </div>
      <label className="tf mt"><span>Observaciones internas:</span><textarea className="ta" {...fm.bind('obsint')} /></label>
    </>
  );
}
