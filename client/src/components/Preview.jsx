// Pinta los bloques que genera lib/preview.js. Un `switch` por tipo de bloque.
function Block({ b }) {
  switch (b.type) {
    case 'head': return <div className="pv-line">{b.text}</div>;
    case 'h': return <div className="pv-h">{b.text}</div>;
    case 'kv': return <div className="pv-kv"><span className="pv-lab">{b.label}</span> <span className="pv-val">{b.text}</span></div>;
    case 'date': return <div className="pv-date"><span>{b.text}</span></div>;
    case 'sub': return <div className="pv-sub">{b.text}</div>;
    case 'plain': return <div className="pv-plain">{b.text}</div>;
    case 'table':
      return (
        <div className="pv-tbl-wrap">
          <div className="pv-cap">{b.label}</div>
          <table className="pv-tbl">
            <thead><tr>{b.header.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
            <tbody>
              {b.rows.map((row, r) => (
                <tr key={r}>{row.map((cell, c) => <td key={c}>{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    default: return null;
  }
}

export default function Preview({ blocks, mode, setMode }) {
  return (
    <>
      <div className="pv-t">
        <button type="button" className={mode === 'all' ? 'fk on' : 'fk'} onClick={() => setMode('all')}>F2-Todo historial</button>
        <button type="button" className={mode === 'last' ? 'fk on' : 'fk'} onClick={() => setMode('last')}>F3-Última visita</button>
        <span className="small upper">Vista previa de historia clínica</span>
      </div>
      <div className="pv-doc">
        {/* Aquí usamos el índice como key porque la lista se regenera entera
            en cada cambio y los bloques no tienen un id propio. */}
        {blocks.map((b, i) => <Block key={i} b={b} />)}
      </div>
    </>
  );
}
