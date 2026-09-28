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
import { emptyForm, pick, ANT_KEYS, CONSULT_KEYS, SECTIONS, SECTION_FORMS, MEDICOS, PROFESIONALES, SOCIEDADES } from '../lib/fields.js';
import { age, isoToDMY, toISO } from '../lib/dates.js';
import { buildPreview } from '../lib/preview.js';
import { Icon } from './ui.jsx';
import Preview from './Preview.jsx';
import Antecedentes from './sections/Antecedentes.jsx';
import Motivo from './sections/Motivo.jsx';
import Refraccion from './sections/Refraccion.jsx';
import Tension from './sections/Tension.jsx';
import StructuredSection from './sections/StructuredSection.jsx';

// Campos de la ficha del paciente que se pueden editar desde la cabecera.
const DATOS_KEYS = ['nombre', 'nacimiento', 'sociedad', 'mutua'];

export default function HistoriaClinica({ hc, appointmentId, prestacion, notify, onBack, onDirtyChange }) {
  const [patient, setPatient] = useState(null);
  const [error, setError] = useState('');
  const [sec, setSec] = useState('ant'); // sección abierta del acordeón
  const [pvMode, setPvMode] = useState('all'); // 'all' = F2, 'last' = F3
  const [mview, setMview] = useState('form'); // en móvil: 'form' | 'pv'
  const [medico, setMedico] = useState(MEDICOS[0]);
  const [prof, setProf] = useState(PROFESIONALES[0]);
  const [saving, setSaving] = useState(false);
  const [fechaVisita, setFechaVisita] = useState(toISO()); // FECHA de la consulta
  // Copia EDITABLE de los datos generales. Mientras escribes se modifica esta
  // copia; `patient` conserva lo guardado, y comparando ambas sabemos si
  // hay cambios pendientes.
  const [datos, setDatos] = useState(null);
  const fm = useForm(emptyForm());
  const { form, setForm } = fm;

  // Cargar el paciente al montar la pantalla.
  useEffect(() => {
    api.getPatient(hc)
      .then((p) => {
        setPatient(p);
        setDatos(pick(p, DATOS_KEYS));
        // Rellenamos el formulario: valores vacíos + antecedentes guardados.
        setForm({ ...emptyForm(), ...p.antecedentes });
      })
      .catch((e) => setError(e.message));
  }, [hc, setForm]);

  // Devuelve un manejador para un campo de `datos`: setDato('nombre') → (e) => ...
  // Es una "función que devuelve una función" (se llama currying).
  const setDato = (key) => (e) => setDatos((prev) => ({ ...prev, [key]: e.target.value }));

  // "draft" = campos de la consulta de hoy que tienen algo escrito.
  // useMemo recalcula solo cuando cambia `form` (son ~300 claves).
  const draft = useMemo(() => pick(form, CONSULT_KEYS, true), [form]);
  const dirty = Object.keys(draft).length > 0;
  const datosDirty = Boolean(patient && datos && DATOS_KEYS.some((k) => datos[k] !== patient[k]));

  // Avisamos a App si hay cambios sin guardar (para el aviso al salir).
  useEffect(() => { onDirtyChange(dirty || datosDirty); }, [dirty, datosDirty, onDirtyChange]);

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
    if (!patient || !datos) return [];
    return buildPreview({
      // Los datos editados se ven en la vista previa al momento.
      patient: { ...patient, ...datos, nombre: datos.nombre.toUpperCase() },
      form,
      draft,
      draftMeta: { fechaLabel: `${isoToDMY(fechaVisita, '-')} · en curso (sin guardar)`, profesional: prof, prestacion },
      mode: pvMode,
    });
  }, [patient, datos, form, draft, prof, prestacion, pvMode, fechaVisita]);

  if (error) return <div className="scr"><div className="empty">{error}</div></div>;
  if (!patient || !datos) return <div className="scr"><div className="empty">Cargando historia…</div></div>;

  async function guardar() {
    if (!datos.nombre.trim()) return notify('El nombre no puede estar vacío');
    const antecedentes = pick(form, ANT_KEYS);
    setSaving(true);
    try {
      // 1) Datos generales, solo si han cambiado.
      if (datosDirty) {
        const updated = await api.updatePatient(hc, datos);
        // Conservamos `visits` (el PUT no las devuelve) y actualizamos el resto.
        setPatient((prev) => ({ ...prev, ...updated }));
        setDatos(pick(updated, DATOS_KEYS));
      }
      // 2) Antecedentes + consulta.
      if (!dirty) {
        await api.saveAntecedentes(hc, antecedentes);
        notify(datosDirty ? 'Datos del paciente guardados' : 'Antecedentes guardados');
      } else {
        const res = await api.saveVisit(hc, { appointmentId, fecha: fechaVisita, profesional: prof, prestacion, data: draft, antecedentes });
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
            {/* Datos editables. El HC es de solo lectura (es la clave que
                enlaza citas y visitas) y la EDAD se calcula sola a partir de
                la fecha de nacimiento: al cambiarla, la edad se actualiza. */}
            <div className="hdr-row">
              <div className="fld"><b>HC</b><span className="ro" title="El nº de historia no se puede modificar">{patient.hc}</span></div>
              <label className="fld grow1"><b>NOMBRE</b>
                <input className="in hdr-in" value={datos.nombre} onChange={setDato('nombre')} />
              </label>
            </div>
            <div className="hdr-row">
              <label className="fld"><b>F. NAC.</b>
                <input className="in" type="date" style={{ width: 150 }} max={toISO()} value={datos.nacimiento} onChange={setDato('nacimiento')} />
              </label>
              <div className="fld"><b>EDAD</b><span className="ro">{age(datos.nacimiento)} años</span></div>
              {datosDirty && <span className="ts" role="status">Datos modificados · pulsa Guardar</span>}
            </div>
            <div className="hdr-row">
              <label className="fld"><b>SOCIEDAD</b>
                <select className="in" style={{ width: 190 }} value={datos.sociedad} onChange={setDato('sociedad')}>
                  {/* Si la sociedad guardada no está en la lista, la añadimos para no perderla. */}
                  {[...new Set([datos.sociedad, ...SOCIEDADES])].map((s) => <option key={s}>{s}</option>)}
                </select>
              </label>
              <label className="fld"><b>MUTUA</b>
                <input className="in" style={{ width: 120 }} value={datos.mutua} onChange={setDato('mutua')} />
              </label>
              <label className="fld"><b>MÉDICO</b>
                <select className="in" style={{ width: 140 }} value={medico} onChange={(e) => setMedico(e.target.value)}>
                  {MEDICOS.map((m) => <option key={m}>{m}</option>)}
                </select>
              </label>
            </div>
            <div className="hdr-row">
              <label className="fld"><b>FECHA</b>
                <input className="in" type="date" aria-label="Fecha de la visita" style={{ width: 150 }} value={fechaVisita} onChange={(e) => setFechaVisita(e.target.value || toISO())} />
                <button type="button" className="hoy" title="Volver a la fecha de hoy" onClick={() => setFechaVisita(toISO())}>HOY</button>
              </label>
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
              <select className="in grow1" aria-label="Personal asistencial participante" value={prof} onChange={(e) => setProf(e.target.value)}>
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
            {SECTION_FORMS[sec] && <StructuredSection key={sec} fm={fm} sec={sec} />}
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
