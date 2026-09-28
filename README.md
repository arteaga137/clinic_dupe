# Simulador de Historia Clínica 👁️

Aplicación web para **practicar** con un programa de gestión de pacientes e
historias clínicas de oftalmología: agenda del día, antecedentes, refracción,
tensión ocular, fondo de ojo… y la vista previa del documento que se va
generando mientras escribes.

La idea es aprender el flujo de trabajo del programa real antes de usarlo en
consulta, desde el ordenador **o desde el móvil**.

> ⚠️ **Proyecto de aprendizaje.** Todos los pacientes y datos clínicos son
> **ficticios**. No es software sanitario y no debe usarse con datos reales.

| Escritorio | Móvil |
|---|---|
| ![Historia clínica en escritorio](docs/escritorio.png) | ![Agenda en móvil](docs/movil.png) |

---

## Qué puedes hacer

- **Agenda**: citas del día con colores por estado (citado, en sala, en consulta, atendido, urgencia), filtros por turno y médico, navegar por días, marcar llegada y crear citas nuevas.
- **Pacientes**: buscador por nombre o nº de HC y alta de pacientes nuevos.
- **Historia clínica**, con las mismas secciones que el programa original:
  - Antecedentes médicos (la caja de alergias se pone roja).
  - Motivo de consulta.
  - Refracción: AV sin corrección, auto, ciclo, queratometría, gafas 1/2/3, manifiesta, receta, ciclo/retinoscopia/quirúrgica/CAP.
  - Tensión ocular y paquimetría, con gráfica de evolución de la PIO.
  - Motilidad, BMC anterior, fondo de ojo, diagnóstico y tratamiento, OCT…
- **Vista previa** en vivo, con **F2** (todo el historial) y **F3** (última visita).
- **Guardar**: la visita queda en el historial y la cita se marca como atendida.
- **Reiniciar práctica**: vuelve a los datos iniciales.

---

## Tecnologías

| Parte | Tecnología | Para qué |
|---|---|---|
| Frontend | **React 19** + **Vite** | Interfaz de usuario; Vite es el servidor de desarrollo y el empaquetador |
| Backend | **Node.js** + **Express 5** | API REST que recibe y devuelve JSON |
| Base de datos | **SQLite** (vía `better-sqlite3`) | Un solo archivo `.db`, sin instalar ningún servidor |
| Tests | `node:test` (incluido en Node) | Pruebas automáticas de la API |

---

## Cómo ejecutarlo

Necesitas **Node.js 20 o superior** ([descargar](https://nodejs.org)).

```bash
# 1. Instalar dependencias (frontend y backend a la vez)
npm install

# 2. Arrancar en modo desarrollo (API + web con recarga automática)
npm run dev
```

Abre **http://localhost:5173**.

**Desde el móvil:** conecta el móvil al mismo Wi-Fi que el ordenador y abre
`http://IP-DE-TU-MAC:5173`. Vite muestra esa dirección en la terminal, en la
línea "Network". En Mac también la ves en *Ajustes → Wi-Fi → Detalles*.

### Otros comandos

| Comando | Qué hace |
|---|---|
| `npm test` | Ejecuta los tests de la API |
| `npm run build` | Compila el frontend para producción en `client/dist` |
| `npm start` | Arranca solo Express, que sirve la API **y** el frontend compilado (http://localhost:3001) |
| `npm run seed` | Borra los datos y recarga los pacientes de práctica |

---

## Cómo está organizado

```
clinic_dupe/
├── package.json          ← "workspaces": une client y server en un solo npm install
├── server/               ← BACKEND
│   ├── src/
│   │   ├── index.js      ← arranca el servidor (puerto 3001)
│   │   ├── app.js        ← configura Express: middlewares, rutas, errores
│   │   ├── db.js         ← conexión a SQLite (crea tablas y datos si no existen)
│   │   ├── schema.sql    ← definición de las tablas
│   │   ├── seed.js       ← datos ficticios de práctica
│   │   ├── errors.js     ← HttpError y utilidades de validación
│   │   └── routes/
│   │       ├── appointments.js  ← /api/appointments (agenda)
│   │       └── patients.js      ← /api/patients (pacientes y visitas)
│   └── test/api.test.js  ← tests automáticos
└── client/               ← FRONTEND
    ├── vite.config.js    ← proxy /api → Express
    └── src/
        ├── main.jsx      ← monta React en la página
        ├── App.jsx       ← decide qué pantalla se ve
        ├── api.js        ← todas las llamadas al backend
        ├── styles.css    ← estilo "Windows clásico" + responsive + impresión
        ├── lib/
        │   ├── fields.js   ← ⭐ la estructura de la historia descrita como datos
        │   ├── useForm.js  ← hook para formularios grandes
        │   ├── preview.js  ← genera la vista previa (función pura)
        │   └── dates.js    ← utilidades de fechas
        └── components/
            ├── Agenda.jsx, Pacientes.jsx, NuevaCita.jsx, MenuBar.jsx
            ├── HistoriaClinica.jsx  ← pantalla principal de consulta
            ├── Preview.jsx, RxGrid.jsx, ui.jsx
            └── sections/            ← una por sección de la historia
```

### El recorrido de un dato (qué pasa al pulsar "Guardar")

```
[ Formulario React ]  el usuario escribe → useForm guarda { clave: valor }
        │
        │  api.saveVisit() → fetch POST /api/patients/700101/visits  (JSON)
        ▼
[ Vite proxy :5173 ]  reenvía /api/* al backend
        ▼
[ Express :3001 ]     routes/patients.js valida los datos y, en una TRANSACCIÓN:
        │               1. inserta la visita
        │               2. actualiza los antecedentes
        │               3. marca la cita como "atendido"
        ▼
[ SQLite clinic.db ]  guarda en disco
        │
        ▼  responde con la ficha actualizada (JSON)
[ React ]  setPatient(...) → la vista previa se vuelve a pintar sola
```

### API REST

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/appointments?fecha=AAAA-MM-DD` | Citas de un día (con datos del paciente) |
| POST | `/api/appointments` | Crear cita |
| PATCH | `/api/appointments/:id` | Cambiar estado (`citado`, `sala`, `consulta`, `atendido`) |
| GET | `/api/patients?q=texto` | Buscar pacientes |
| POST | `/api/patients` | Alta de paciente |
| GET | `/api/patients/:hc` | Ficha + antecedentes + visitas |
| PUT | `/api/patients/:hc/antecedentes` | Guardar antecedentes |
| POST | `/api/patients/:hc/visits` | Guardar una consulta |
| POST | `/api/reset` | Recargar datos de práctica |

---

## Decisiones de diseño (y por qué)

1. **Formularios descritos como datos** (`client/src/lib/fields.js`). La historia tiene unos 300 campos. En vez de escribir 300 `<input>`, cada tabla se describe en un objeto (`GRIDS`) y un solo componente (`RxGrid`) la dibuja. Para añadir una columna basta con añadir una línea.
2. **Campos clínicos en JSON dentro de SQLite.** Lo que hay que filtrar u ordenar (fecha, hora, estado, nombre) tiene su propia columna. Los datos del formulario se guardan como JSON en una columna de texto. Es flexible, a cambio de que sea más difícil consultarlos con SQL. Lo explica `schema.sql`.
3. **Un solo estado de formulario** en `HistoriaClinica.jsx` ("lifting state up"). Las secciones solo leen y escriben su parte, y la vista previa ve siempre todos los datos.
4. **La vista previa es una función pura** (`preview.js`): recibe datos y devuelve bloques, sin tocar React. Así es fácil de entender y de probar.
5. **Transacciones** al guardar una visita: o se guardan los tres cambios, o ninguno.
6. **Consultas parametrizadas** (`?`) en todo el SQL, para evitar la inyección SQL.

## Ideas para seguir aprendiendo

- [ ] Añadir `react-router` para tener URLs propias (`/paciente/700101`).
- [ ] Tests del frontend con Vitest + Testing Library.
- [ ] Inicio de sesión con varios usuarios (médico / optometrista).
- [ ] Desplegarlo gratis (Render, Railway o Fly.io) para usarlo sin tener el Mac encendido.
- [ ] Pasar a TypeScript.

## Licencia

MIT — ver [LICENSE](LICENSE).
