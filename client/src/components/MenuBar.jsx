// Barra de menú superior, imitando la del programa original.
const ITEMS = [
  { id: 'agenda', label: 'Agenda' },
  { id: 'hc', label: 'H.Clínica' },
  { id: 'pac', label: 'Pacientes' },
];
// Menús que existen en el programa pero no en el simulador.
const DECORATIVE = ['Facturación', 'Almacén', 'Herramientas', 'Listas', 'Utilidades'];

export default function MenuBar({ screen, onGo, onNotAvailable }) {
  return (
    <nav className="menubar" aria-label="Menú principal">
      {ITEMS.map((it) => (
        <button key={it.id} type="button" className={screen === it.id ? 'mi on' : 'mi'}
          aria-current={screen === it.id ? 'page' : undefined} onClick={() => onGo(it.id)}>
          {it.label}
        </button>
      ))}
      {DECORATIVE.map((l) => (
        <button key={l} type="button" className="mi hm" onClick={onNotAvailable}>{l}</button>
      ))}
      <span className="ver hm">Simulador de práctica · datos ficticios</span>
    </nav>
  );
}
