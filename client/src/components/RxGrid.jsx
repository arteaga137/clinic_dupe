// =====================================================================
// RxGrid.jsx — una tabla de refracción genérica
// =====================================================================
// Este único componente dibuja TODAS las tablas (Auto, Ciclo, Manifiesta,
// Receta...). Lee su descripción en GRIDS[gridId] y genera filas (ojos) y
// columnas. Es el ejemplo perfecto de "componente guiado por datos".
// =====================================================================

import { GRIDS, AV_OPTIONS, JAEGER_OPTIONS, EYE_LABEL, eyesOf, gridKey } from '../lib/fields.js';

export default function RxGrid({ fm, gridId, minWidth = 0 }) {
  const def = GRIDS[gridId];
  // CSS grid: 1 columna fija para "O.D." + N columnas iguales.
  const cols = { gridTemplateColumns: `40px repeat(${def.cols.length}, minmax(42px, 1fr))` };

  return (
    <>
      <div className="gscroll">
        <div style={{ minWidth }}>
          <div className="grow" style={cols}>
            <div />
            {def.cols.map((c) => <div key={c.id} className="ghc">{c.l}</div>)}
          </div>
          {eyesOf(gridId).map((eye) => (
            <div key={eye} className="grow" style={cols}>
              <div className="eye">{EYE_LABEL[eye]}:</div>
              {def.cols.map((c) => {
                const k = gridKey(gridId, eye, c.id);
                const aria = `${def.title} ${EYE_LABEL[eye]} ${c.l}`;
                // En la fila A.O. solo existen algunas columnas (las de agudeza).
                if (eye === 'ao' && !c.ao) return <div key={k} />;
                if (c.t === 'av' || c.t === 'j') {
                  const opts = c.t === 'av' ? AV_OPTIONS : JAEGER_OPTIONS;
                  return (
                    <select key={k} className="in" aria-label={aria} {...fm.bind(k)}>
                      {opts.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  );
                }
                return <input key={k} className="in" aria-label={aria} {...fm.bind(k)} />;
              })}
            </div>
          ))}
        </div>
      </div>
      {def.obs && <textarea className="ta sm" aria-label={`${def.title}: observaciones`} {...fm.bind(`${gridId}_obs`)} />}
    </>
  );
}
