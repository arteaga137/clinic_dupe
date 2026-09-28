// Sección "Antecedentes médicos". Estos datos pertenecen al PACIENTE y se
// conservan de una visita a otra.
import { Check, Select, TextRow } from '../ui.jsx';
import { PROFESIONES, hasValue } from '../../lib/fields.js';
import { nowStamp } from '../../lib/dates.js';

export default function Antecedentes({ fm, notify }) {
  const { form, setField } = fm;
  // La caja de alergias se pone roja si hay texto y la alerta está activada.
  const alergiaCls = hasValue(form.alergias) && form.alAct ? 'ta al-on' : 'ta';

  // "Validar datos" guarda además la fecha y hora en que se validó.
  function onValidar(e) {
    setField('validar', e.target.checked);
    setField('validarTs', e.target.checked ? nowStamp() : '');
  }

  return (
    <>
      <div className="ant-top">
        <button type="button" className="btn" onClick={() => notify('Vulnerabilidad: sin alertas registradas')}>Vulnerabilidad</button>
        <label className="fld"><span>Profesión:</span><Select fm={fm} k="profesion" options={PROFESIONES} style={{ width: 170 }} /></label>
        <label className="ck"><input type="checkbox" checked={form.validar} onChange={onValidar} /> Validar datos</label>
        {form.validar && <span className="ts">{form.validarTs}</span>}
      </div>

      <div className="ck-row"><span className="ck-l">Enfermedades Crónicas:</span>
        <Check fm={fm} k="diabetes">Diabetes</Check>
        <Check fm={fm} k="hta">HTA</Check>
        <Check fm={fm} k="anticoag">Anticoagulado</Check>
      </div>
      <div className="ck-row"><span className="ck-l">Factores de riesgo:</span>
        <Check fm={fm} k="vih">VIH</Check>
        <Check fm={fm} k="tbc">TBC</Check>
        <Check fm={fm} k="vhb">VHB</Check>
        <Check fm={fm} k="vhc">VHC</Check>
      </div>

      <div className="ant-grid">
        <label className="tf"><span>Antecedentes personales:</span><textarea className="ta" {...fm.bind('ap')} /></label>
        <label className="tf"><span>Antecedentes oftalmológicos:</span><textarea className="ta" {...fm.bind('aof')} /></label>
        <label className="tf"><span>Antecedentes familiares:</span><textarea className="ta" {...fm.bind('afam')} /></label>
        <label className="tf"><span>Antecedentes quirúrgicos:</span><textarea className="ta" {...fm.bind('aqx')} /></label>
      </div>

      <div className="lrow">
        <div className="al-l">
          <span>Alergias:</span>
          <Check fm={fm} k="alNoC">No conocidas</Check>
          <Check fm={fm} k="alAct">Activar alergias</Check>
        </div>
        <textarea className={alergiaCls} aria-label="Alergias" {...fm.bind('alergias')} />
      </div>
      <TextRow fm={fm} k="med" label="Medicación:" />
      <TextRow fm={fm} k="medsis" label="Medicación sistémica:" />
      <TextRow fm={fm} k="diag" label="Diagnósticos y Comentarios Generales:" />
      <label className="lrow"><span>Opera:</span><input className="in" {...fm.bind('opera')} /></label>
    </>
  );
}
