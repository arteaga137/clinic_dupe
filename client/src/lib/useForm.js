// =====================================================================
// useForm — un "custom hook" para manejar formularios grandes
// =====================================================================
// Un hook es una función que empieza por "use" y usa otros hooks de React
// (useState, useCallback...). Sirve para reutilizar LÓGICA entre
// componentes, igual que un componente reutiliza INTERFAZ.
//
// Este hook guarda todo el formulario en UN objeto de estado y ofrece
// `bind('clave')`, que devuelve { value, onChange } listos para ponerlos en
// un <input>. Así, en vez de escribir en cada campo:
//     <input value={form.alergias} onChange={e => setField('alergias', e.target.value)} />
// escribimos:
//     <input {...fm.bind('alergias')} />
// El "..." (spread) reparte las propiedades del objeto como atributos.
// =====================================================================

import { useState, useCallback } from 'react';

export function useForm(initial) {
  const [form, setForm] = useState(initial);

  // Usamos la forma "funcional" de setState (prev => nuevo). Si React agrupa
  // varios cambios seguidos, cada uno parte del estado más reciente.
  // Importante: NUNCA se modifica `prev` directamente; se crea un objeto
  // nuevo con {...prev}. React detecta cambios comparando referencias.
  const setField = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const bind = (key) => ({
    value: form[key] ?? '',
    onChange: (e) => setField(key, e.target.value),
  });

  const bindCheck = (key) => ({
    checked: Boolean(form[key]),
    onChange: (e) => setField(key, e.target.checked),
  });

  return { form, setForm, setField, bind, bindCheck };
}
