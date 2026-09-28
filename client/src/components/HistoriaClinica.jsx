// =====================================================================
// HistoriaClinica.jsx — la pantalla principal de consulta
// =====================================================================
// Estructura (igual que el programa real):
//   ┌ Datos generales del paciente + barra de herramientas ┐┌ Vista previa ┐
//   │ Sección abierta (acordeón)                          ││  (F2 / F3)   │
//   │ Lista del resto de secciones                        ││              │
//   └─────────────────────────────────────────────────────┘└──────────────┘
//
// El formulario completo (antecedentes + consulta de hoy) vive aquí, en un
// único useForm. Las secciones solo reciben `fm` y leen/escriben sus
// claves. Así la vista previa siempre ve todos los datos a la vez.
// =====================================================================

import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { useForm } from '../lib/useForm.js';
import { emptyForm, pick, ANT_KEYS, CONSULT_KEYS, SECTIONS, GENERIC, MEDICOS, PROFESIONALES } from '../lib/fields.js';
import { age, isoToDMY, toISO } from '../lib/dates.js';
import { buildPreview } from '../lib/preview.js';
import { Icon } from './ui.jsx';
import Preview from './Preview.jsx';
import Antecedentes from './sections/Antecedentes.jsx';
import Motivo from './sections/Motivo.jsx';
import Refraccion from './sections/Refraccion.jsx';
import Tension from './sections/Tension.jsx';
import GenericSection from './sections/GenericSection.jsx';

export default function HistoriaClinica({ hc, appointmentId, prestacion, notify, onBack, onDirtyChange }) {
  const [patient, setPatient] = useState(null);
  const [error, setError] = useState('');
  const [sec, setSec] = useState('ant'); // sección abierta del acordeón
  const [pvMode, setPvMode] = useState('all'); // 'all' = F2, 'last' = F3
  const [mview, setMview] = useState('form'); // en móvil: 'form' | 'pv'
  const [medico, setMedico] = useState(MEDICOS[0]);
  const [prof, setProf] = useState(PROFESIONALES[0]);
  const [saving, setSaving] = useState(false);
  const fm = useForm(emptyForm());
  const { form, setForm } = fm;

  // Cargar el paciente al montar la pantalla.
  useEffect(() => {
    api.getPatient(hc)
      .then((p) => {
        setPatient(p);
        // Rellenamos el formulario: valores vacíos + antecedentes guardados.
        setForm({ ...emptyForm(), ...p.antecedentes });
      })
      .catch((e) => setError(e.message));
  }, [hc, setForm]);

  // "draft" = campos de la consulta de hoy que tienen algo escrito.
  // useMemo recalcula solo cuando cambia `form` (son ~300 claves).
  const draft = useMemo(() => pick(form, CONSULT_KEYS, true), [form]);
  const dirty = Object.keys(draft).length > 0;

  // Avisamos a App si hay cambios sin guardar (para el aviso al salir).
  useEffect(() => { onDirtyChange(dirty); }, [dirty, onDirtyChange]);

  // Atajos de teclado como en el programa real: F2 = todo el historial,
  // F3 = última visita. Añadimos el "listener" al montar y lo quitamos al
  // desmontar (la función que devuelve useEffect), para no dejarlo colgado.
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'F2') { e.preventDefault(); setPvMode('all'); }
      if (e.key === 'F3') { e.preventDefault(); setPvMode('last'); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const blocks = useMemo(() => {
    if (!patient) return [];
    return buildPreview({
      patient: { ...patient, nombre: patient.nombre.toUpperCase() },
      form,
      draft,
      draftMeta: { fechaLabel: `${isoToDMY(toISO(), '-')} · en curso (sin guardar)`, profesional: prof, prestacion },
      mode: pvMode,
    });
  }, [patient, form, draft, prof, prestacion, pvMode]);

  if (error) return <div className="scr"><div className="empty">{error}</div></div>;
  if (!patient) return <div className="scr"><div className="empty">Cargando historia…</div></div>;

  async function guardar() {
    const antecedentes = pick(form, ANT_KEYS);
    setSaving(true);
    try {
      if (!dirty) {
        await api.saveAntecedentes(hc, antecedentes);
        notify('Antecedentes guardados');
      } else {
        const res = await api.saveVisit(hc, { appointmentId, profesional: prof, prestacion, data: draft, antecedentes });
        setPatient(res.patient);
        // Vaciamos la consulta pero conservamos los antecedentes.
        setForm({ ...emptyForm(), ...antecedentes });
        notify('Visita guardada en la historia clínica');
      }
    } catch (e) {
      notify(e.message);
    } finally {
      setSaving(false); // `finally` se ejecuta tanto si hubo error como si no
    }
  }

  function vaciarConsulta() {
    if (dirty && !window.confirm('¿Vaciar los datos de la consulta en curso?')) return;
    setForm({ ...emptyForm(), ...pick(form, ANT_KEYS) });
  }

  function abrirSeccion(id) {
    setSec(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const current = SECTIONS.find((s) => s.id === sec);
  const soon = () => notify('Función no incluida en el simulador');

  return (
    <div className="scr">
      <div className="win-t">
        <button type="button" className="back" onClick={onBack}>← Agenda</button>Historia clínica
      </div>

      {/* Pestañas solo visibles en móvil (ver CSS) */}
      <div className="mtabs">
        <button type="button" className={mview === 'form' ? 'on' : ''} onClick={() => setMview('form')}>Formulario</button>
        <button type="button" className={mview === 'pv' ? 'on' : ''} onClick={() => setMview('pv')}>Vista previa</button>
      </div>

      <div className="hc">
        <div className={mview === 'pv' ? 'col-form m-hide' : 'col-form'}>
          <div className="grp">
            <div className="grp-t">Datos generales del paciente</div>
            <div className="hdr-row">
              <div className="fld"><b>HC</b><span className="ro">{patient.hc}</span></div>
              <div className="fld grow1"><b>NOMBRE</b><span className="ro">{patient.nombre.toUpperCase()}</span></div>
              <div className="fld"><b>EDAD</b><span className="ro">{age(patient.nacimiento)} años</span></div>
            </div>
            <div className="hdr-row">
              <div className="fld"><b>SOCIEDAD</b><span className="ro">{patient.sociedad}</span></div>
              <div className="fld"><b>MUTUA</b><span className="ro" style={{ minWidth: 90 }}>{patient.mutua}</span></div>
              <label className="fld"><b>MÉDICO</b>
                <select className="in" style={{ width: 140 }} value={medico} onChange={(e) => setMedico(e.target.value)}>
                  {MEDICOS.map((m) => <option key={m}>{m}</option>)}
                </select>
              </label>
            </div>
            <div className="hdr-row">
              <div className="fld"><b>FECHA</b><span className="ro">{isoToDMY(toISO())}</span><span className="hoy">HOY</span></div>
              <div className="tb" role="toolbar" aria-label="Acciones de la historia">
                <button type="button" className="ib" title="Imprimir" aria-label="Imprimir" onClick={() => window.print()}><Icon name="print" /></button>
                <button type="button" className="ib" title="Vaciar consulta" aria-label="Vaciar consulta" onClick={vaciarConsulta}><Icon name="file" /></button>
                <button type="button" className="ib" title="Recetas" aria-label="Recetas" onClick={() => setSec('ref')}><Icon name="book" /></button>
                <button type="button" className="ib" title="Datos del paciente" aria-label="Datos del paciente" onClick={soon}><Icon name="user" /></button>
                <button type="button" className="ib txt" title="Quirófano" onClick={soon}>Qx</button>
                <button type="button" className="ib txt eu" title="Facturación" onClick={soon}>€</button>
                <button type="button" className="ib txt" title="Informes" onClick={soon}>E</button>
                <button type="button" className="ib txt" title="Informe de resultados" onClick={soon}>I.R</button>
                <button type="button" className="ib txt red" title="Firma" onClick={soon}>F</button>
                <button type="button" className="ib save" onClick={guardar} disabled={saving}>
                  <Icon name="save" />{saving ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </div>
            <label className="hdr-row" style={{ marginBottom: 0 }}>
              <b className="small">PERSONAL ASISTENCIAL PARTICIPANTE:</b>
              <select className="in grow1" value={prof} onChange={(e) => setProf(e.target.value)}>
                {PROFESIONALES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </label>
          </div>

          <section className="sec-open" aria-label={current.label}>
            <div className="grp-t sec-t">{current.label}:</div>
            {/* Elegimos qué componente pintar según la sección abierta. */}
            {sec === 'ant' && <Antecedentes fm={fm} notify={notify} />}
            {sec === 'mot' && <Motivo fm={fm} />}
            {sec === 'ref' && <Refraccion fm={fm} notify={notify} visits={patient.visits} />}
            {sec === 'ten' && <Tension fm={fm} visits={patient.visits} />}
            {GENERIC[sec] && <GenericSection fm={fm} fields={GENERIC[sec]} />}
          </section>

          <div className="seclist">
            {SECTIONS.filter((s) => s.id !== sec).map((s) => (
              <button key={s.id} type="button" className="secbtn" onClick={() => abrirSeccion(s.id)}>{s.label}:</button>
            ))}
          </div>
        </div>

        <div className={mview === 'form' ? 'col-pv m-hide' : 'col-pv'}>
          <Preview blocks={blocks} mode={pvMode} setMode={setPvMode} />
        </div>
      </div>
    </div>
  );
}
