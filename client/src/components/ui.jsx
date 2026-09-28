// =====================================================================
// ui.jsx — piezas pequeñas de interfaz que se repiten mucho
// =====================================================================
// Cada una recibe `fm` (lo que devuelve useForm) y la clave `k` del campo.
// Un componente de React es solo una función que recibe "props" (un objeto
// con sus parámetros) y devuelve JSX.
// =====================================================================

/** Selector a partir de una lista de textos. */
export function Select({ fm, k, options, className = 'in', ...rest }) {
  return (
    <select className={className} {...fm.bind(k)} {...rest}>
      {/* .map convierte cada texto en un <option>. React necesita una
          `key` única en los elementos de una lista para seguirles la pista. */}
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

/** Casilla con su texto. */
export function Check({ fm, k, children }) {
  return (
    <label className="ck">
      <input type="checkbox" {...fm.bindCheck(k)} /> {children}
    </label>
  );
}

/** Fila "etiqueta : área de texto", como en el programa original. */
export function TextRow({ fm, k, label, rows = 2, className = 'ta' }) {
  return (
    <label className="lrow">
      <span>{label}</span>
      <textarea className={className} rows={rows} {...fm.bind(k)} />
    </label>
  );
}

/** Icono en línea (trazo SVG), para no depender de librerías de iconos. */
export function Icon({ name }) {
  const paths = {
    print: <><path d="M6 9V3h12v6" /><rect x="6" y="14" width="12" height="7" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5z" /><path d="M6.5 17A2.5 2.5 0 0 0 4 19.5 2.5 2.5 0 0 0 6.5 22H20v-5" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" /></>,
    save: <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><path d="M17 21v-8H7v8" /><path d="M7 3v5h8" /></>,
    left: <path d="M15 18l-6-6 6-6" />,
    right: <path d="M9 18l6-6-6-6" />,
  };
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}
