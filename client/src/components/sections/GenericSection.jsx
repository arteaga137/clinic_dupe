// Secciones sencillas (Fondo de ojo, OCT, Biometría...): una lista de
// textos descrita en GENERIC (lib/fields.js). Un solo componente sirve
// para las 14 secciones.
import { TextRow } from '../ui.jsx';

export default function GenericSection({ fm, fields }) {
  return fields.map((f) => <TextRow key={f.k} fm={fm} k={f.k} label={`${f.l}:`} rows={3} />);
}
