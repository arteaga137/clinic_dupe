// Sección "Motivo de consulta".
import { Check, Select, TextRow } from '../ui.jsx';
import { OPTICAS } from '../../lib/fields.js';

export default function Motivo({ fm }) {
  return (
    <>
      <TextRow fm={fm} k="mot" label="Motivo de consulta:" rows={3} />
      <TextRow fm={fm} k="obs" label="Observaciones:" rows={3} />
      <div className="lrow">
        <span />
        <div className="fld wrap">
          <Check fm={fm} k="derivado">Derivado óptico</Check>
          {/* El desplegable solo se activa si la casilla está marcada. */}
          <Select fm={fm} k="derivadoA" options={OPTICAS} style={{ width: 220 }}
            disabled={!fm.form.derivado} aria-label="Óptica de derivación" />
        </div>
      </div>
    </>
  );
}
