// =====================================================================
// App.jsx — componente raíz: decide qué pantalla se ve
// =====================================================================
// Para una app con 3 pantallas no hace falta una librería de rutas
// (react-router): basta con un estado `screen`. Si el proyecto crece y
// quieres URLs propias (/agenda, /paciente/700101) sería el siguiente paso.
//
// Regla de oro de React: el estado vive en el componente más alto que lo
// necesita ("lifting state up"). `screen` y el paciente abierto los usan
// varias pantallas, por eso están aquí y bajan como props.
// =====================================================================

import { useState, useRef, useCallback } from 'react';
import MenuBar from './components/MenuBar.jsx';
import Agenda from './components/Agenda.jsx';
import Pacientes from './components/Pacientes.jsx';
import HistoriaClinica from './components/HistoriaClinica.jsx';
import { toISO } from './lib/dates.js';

export default function App() {
  const [screen, setScreen] = useState('agenda');
  const [fecha, setFecha] = useState(toISO()); // día que muestra la agenda
  const [open, setOpen] = useState(null); // { hc, appointmentId } o null
  const [toast, setToast] = useState('');

  // useRef guarda un valor que NO provoca un nuevo render al cambiar.
  // Lo usamos para recordar si la historia tiene cambios sin guardar.
  const dirtyRef = useRef(false);
  const toastTimer = useRef(null);

  // Mensaje flotante temporal. useCallback mantiene la misma función entre
  // renders, así los hijos que la reciben no se re-ejecutan sin motivo.
  const notify = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2600);
  }, []);

  /** Cambia de pantalla avisando si hay una consulta sin guardar. */
  function go(next) {
    if (next === screen) return;
    if (screen === 'hc' && dirtyRef.current &&
        !window.confirm('Hay datos de la consulta sin guardar. ¿Salir igualmente?')) return;
    if (next === 'hc' && !open) {
      notify('Selecciona primero un paciente en la agenda');
      return;
    }
    dirtyRef.current = false;
    setScreen(next);
  }

  function openHistoria(hc, appointmentId = null, prestacion = '') {
    dirtyRef.current = false;
    setOpen({ hc, appointmentId, prestacion });
    setScreen('hc');
  }

  return (
    <div className="app">
      <MenuBar screen={screen} onGo={go} onNotAvailable={() => notify('Función no incluida en el simulador')} />

      {/* Renderizado condicional: `cond && <X/>` pinta X solo si cond es true. */}
      {screen === 'agenda' && (
        <Agenda fecha={fecha} setFecha={setFecha} onOpen={openHistoria} notify={notify} />
      )}
      {screen === 'pac' && <Pacientes onOpen={openHistoria} notify={notify} />}
      {screen === 'hc' && open && (
        <HistoriaClinica
          // `key` distinta = componente nuevo. Al abrir otro paciente, React
          // descarta el estado del anterior en vez de mezclarlo.
          key={`${open.hc}-${open.appointmentId}`}
          hc={open.hc}
          appointmentId={open.appointmentId}
          prestacion={open.prestacion}
          notify={notify}
          onBack={() => go('agenda')}
          onDirtyChange={(d) => { dirtyRef.current = d; }}
        />
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
