// Sección "Tensión ocular/Paquimetría" + gráfica de evolución de la PIO.
import { useState } from 'react';
import { Select } from '../ui.jsx';
import { TONOMETROS } from '../../lib/fields.js';
import { isoToDMY } from '../../lib/dates.js';

/** Recuadro con O.D. / O.I. (+ un campo extra opcional). */
function EyeBox({ fm, title, prefix, children }) {
  return (
    <div className="tbox">
      <div className="tbox-t">{title}</div>
      <label className="eyein"><span>O.D.:</span><input className="in" inputMode="decimal" {...fm.bind(`${prefix}_od`)} /></label>
      <label className="eyein"><span>O.I.:</span><input className="in" inputMode="decimal" {...fm.bind(`${prefix}_oi`)} /></label>
      {children}
    </div>
  );
}

/** Gráfica de barras sencilla hecha solo con CSS (sin librerías). */
function Grafica({ puntos }) {
  if (!puntos.length) return <div className="graf">Sin mediciones registradas todavía.</div>;
  // La barra más larga corresponde a 40 mmHg.
  const width = (v) => `${Math.max(2, Math.min(100, (parseFloat(v) || 0) / 40 * 100))}%`;
  return (
    <div className="graf">
      <div className="graf-title">Evolución PIO (mmHg) · <span className="c-od">OD</span> / <span className="c-oi">OI</span></div>
      {puntos.map((p, i) => (
        <div key={i} className="graf-r">
          <span>{p.fecha}</span>
          <div className="bars">
            <div className="bar od"><span style={{ width: width(p.od) }} /><em>{p.od}</em></div>
            <div className="bar oi"><span style={{ width: width(p.oi) }} /><em>{p.oi}</em></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Tension({ fm, visits }) {
  const [showGraf, setShowGraf] = useState(false);
  const f = fm.form;

  // Puntos de la gráfica: visitas antiguas (de más antigua a más nueva) + hoy.
  const puntos = [...visits].reverse()
    .filter((v) => v.data.ten1_od || v.data.ten1_oi)
    .map((v) => ({ fecha: isoToDMY(v.fecha), od: v.data.ten1_od || '', oi: v.data.ten1_oi || '' }));
  if (f.ten1_od || f.ten1_oi) puntos.push({ fecha: 'Hoy', od: f.ten1_od, oi: f.ten1_oi });

  return (
    <>
      <div className="hdr-row">
        <label className="fld"><span>Tonómetro:</span><Select fm={fm} k="ten_ton" options={TONOMETROS} style={{ width: 160 }} /></label>
        <label className="fld"><b>Fecha paq.:</b><input className="in" type="date" style={{ width: 150 }} {...fm.bind('paq_fecha')} /></label>
      </div>
      <div className="ten-boxes">
        <EyeBox fm={fm} title="Tensión ocular 1:" prefix="ten1"><textarea className="ta sm" aria-label="Notas tensión 1" {...fm.bind('ten1_obs')} /></EyeBox>
        <EyeBox fm={fm} title="Tensión ocular 2:" prefix="ten2"><textarea className="ta sm" aria-label="Notas tensión 2" {...fm.bind('ten2_obs')} /></EyeBox>
        <EyeBox fm={fm} title="Diana:" prefix="dia">
          <label className="tf"><span className="tbox-t">Hora aprox:</span><input className="in" type="time" {...fm.bind('dia_hora')} /></label>
        </EyeBox>
        <EyeBox fm={fm} title="Paquimetría:" prefix="paq"><textarea className="ta sm" aria-label="Notas paquimetría" {...fm.bind('paq_obs')} /></EyeBox>
      </div>
      <div className="hdr-row">
        <label className="fld grow1"><span>Gonioscopia:</span><input className="in" {...fm.bind('gonio')} /></label>
        <button type="button" className="btn" aria-expanded={showGraf} onClick={() => setShowGraf(!showGraf)}>Gráfica de evolución</button>
      </div>
      {showGraf && <Grafica puntos={puntos} />}
    </>
  );
}
