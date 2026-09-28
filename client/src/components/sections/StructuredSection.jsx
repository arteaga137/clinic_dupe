// =====================================================================
// StructuredSection.jsx — dibuja cualquier sección descrita en
// lib/sectionForms.js (Fondo de ojo, OCT, Campimetría, Biometría...).
// =====================================================================
// Un solo componente para 14 secciones: recorre los grupos de la
// descripción y, según el tipo de cada campo, pinta el control adecuado.
// Si mañana la clínica añade un campo a la OCT, solo se toca sectionForms.js.
// =====================================================================

import { Fragment } from 'react';
import { SECTION_FORMS, fieldKey, eyeKey } from '../../lib/sectionForms.js';

/** Un control según su tipo. `k` es la clave del formulario. */
function Control({ fm, f, k, label }) {
  switch (f.t) {
    case 'select':
      return (
        <select className="in" aria-label={label} {...fm.bind(k)}>
          {f.opts.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    case 'suggest':
      // <input list="..."> + <datalist>: sugerencias con escritura libre.
      return (
        <>
          <input className="in" aria-label={label} list={`dl-${k}`} placeholder={f.placeholder} {...fm.bind(k)} />
          <datalist id={`dl-${k}`}>{f.opts.map((o) => <option key={o} value={o} />)}</datalist>
        </>
      );
    case 'num':
      // inputMode="decimal" muestra el teclado numérico en el móvil.
      return (
        <span className="with-unit">
          <input className="in" aria-label={label} inputMode="decimal" placeholder={f.placeholder} {...fm.bind(k)} />
          {f.unit && <span className="unit">{f.unit}</span>}
        </span>
      );
    case 'area':
      return <textarea className="ta" aria-label={label} placeholder={f.placeholder} rows={2} {...fm.bind(k)} />;
    default: // 'text'
      return <input className="in" aria-label={label} placeholder={f.placeholder} {...fm.bind(k)} />;
  }
}

/** Grupo de campos sueltos, en una rejilla que se adapta al ancho. */
function FieldsGroup({ fm, sec, group }) {
  const checks = group.fields.filter((f) => f.t === 'check');
  const others = group.fields.filter((f) => f.t !== 'check');
  return (
    <fieldset className="sgroup">
      {group.title && <legend>{group.title}</legend>}
      <div className="sfields">
        {others.map((f) => {
          const k = fieldKey(sec, f.id);
          return (
            // Los textos largos ocupan toda la fila (clase "full").
            <label key={k} className={f.t === 'area' ? 'tf full' : 'tf'}>
              <span>{f.l}{f.t === 'num' ? '' : ':'}</span>
              <Control fm={fm} f={f} k={k} label={f.l} />
            </label>
          );
        })}
      </div>
      {checks.length > 0 && (
        <div className="ck-row">
          {checks.map((f) => {
            const k = fieldKey(sec, f.id);
            return (
              <label key={k} className="ck"><input type="checkbox" {...fm.bindCheck(k)} /> {f.l}</label>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}

/** Tabla estructura × ojo (O.D. | O.I.). */
function EyesGroup({ fm, sec, group }) {
  return (
    <fieldset className="sgroup">
      {group.title && <legend>{group.title}</legend>}
      <div className="eyes-grid">
        <div className="eg-h" />
        <div className="eg-h">O.D.</div>
        <div className="eg-h">O.I.</div>
        {group.rows.map((r) => (
          // Fragment con key: agrupa 3 celdas sin añadir un <div> extra,
          // porque la rejilla CSS necesita que las celdas sean hijas directas.
          <Fragment key={r.id}>
            <div className="eg-l">{r.l}{r.unit ? ` (${r.unit})` : ''}</div>
            <Control fm={fm} f={{ ...r, unit: '' }} k={eyeKey(sec, r.id, 'od')} label={`${r.l} O.D.`} />
            <Control fm={fm} f={{ ...r, unit: '' }} k={eyeKey(sec, r.id, 'oi')} label={`${r.l} O.I.`} />
          </Fragment>
        ))}
      </div>
    </fieldset>
  );
}

export default function StructuredSection({ fm, sec }) {
  return SECTION_FORMS[sec].map((group, i) =>
    group.kind === 'eyes'
      ? <EyesGroup key={i} fm={fm} sec={sec} group={group} />
      : <FieldsGroup key={i} fm={fm} sec={sec} group={group} />
  );
}
