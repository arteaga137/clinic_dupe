// =====================================================================
// SlotPicker.jsx — elegir hora viendo los HUECOS LIBRES del médico
// =====================================================================
// Lo usan "Nueva cita", "Mover cita" y "Nuevo paciente". Cuando cambian
// la fecha o el médico, pide al servidor las citas de ese día y calcula
// qué horas quedan libres. Los huecos libres son DATOS DERIVADOS: no se
// guardan en ningún sitio, se calculan a partir de las citas existentes.
//
// El servidor vuelve a comprobarlo al guardar (409 si choca): aquí solo
// ayudamos a elegir bien; la regla la hace cumplir el backend.
// =====================================================================

import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { AGENDA_SLOTS } from '../lib/fields.js';

export default function SlotPicker({ fecha, medico, value, onChange, exceptId = null }) {
  const [ocupadas, setOcupadas] = useState(null); // null = cargando

  useEffect(() => {
    let ignore = false;
    setOcupadas(null);
    api.getAppointments(fecha)
      .then((citas) => {
        if (ignore) return;
        // Horas ocupadas por ESE médico, sin contar la propia cita (al moverla).
        setOcupadas(new Set(citas.filter((c) => c.medico === medico && c.id !== exceptId).map((c) => c.hora)));
      })
      .catch(() => { if (!ignore) setOcupadas(new Set()); });
    return () => { ignore = true; };
  }, [fecha, medico, exceptId]);

  const libres = ocupadas ? AGENDA_SLOTS.filter((h) => !ocupadas.has(h)) : [];
  const choca = ocupadas?.has(value);

  return (
    <div className="slot-picker">
      <label className="tf">
        <span>Hora</span>
        <input className="in" type="time" value={value} onChange={(e) => onChange(e.target.value)} required style={{ maxWidth: 140 }} />
      </label>
      {choca && <div className="slot-warn" role="alert">Atención: {medico} ya tiene una cita a las {value}</div>}
      <div className="slot-list" aria-label="Huecos libres">
        <span className="small">{ocupadas ? `Huecos libres de ${medico} (${libres.length}):` : 'Buscando huecos…'}</span>
        {libres.map((h) => (
          <button key={h} type="button" className={h === value ? 'slot on' : 'slot'} onClick={() => onChange(h)}>{h}</button>
        ))}
      </div>
    </div>
  );
}
