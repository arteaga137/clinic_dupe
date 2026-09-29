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

- **Agenda**: citas del día con colores por estado (citado, en sala, en consulta, atendido, urgencia), filtros por turno y médico y navegación por días. Permite marcar la llegada, **crear, mover (reprogramar) y anular citas** viendo los huecos libres de cada médico, y dar de alta un paciente nuevo con su cita en un solo paso.
- **Más de 400 pacientes ficticios** y una **agenda que se rellena sola cada día** (unas 30 citas por día laborable: pasadas ya atendidas con su visita, futuras pendientes, y cada día llegan pacientes nuevos). 36 casos están escritos a mano y el resto los fabrica un generador a partir de 34 plantillas de patologías, con historiales coherentes: glaucoma (crónico, pseudoexfoliativo, cierre angular, hipertensión ocular), DMAE, retinopatía diabética, oclusión venosa, membrana epirretiniana, desprendimiento de retina, coriorretinopatía serosa central, queratocono, úlcera por lentillas, conjuntivitis vírica, ojo seco, distrofia de Fuchs, pterigión, uveítis, neuritis óptica, orbitopatía tiroidea, ptosis, chalazión, ambliopía y estrabismo, miopía infantil, cirugía refractiva y estética. Las fechas se calculan respecto al día de hoy, así que la agenda tiene citas pasadas y de las próximas dos semanas.
- **Pacientes**: buscador por nombre o nº de HC y alta de pacientes nuevos.
- **Historia clínica**, con las mismas secciones que el programa original:
  - Antecedentes médicos (la caja de alergias se pone roja).
  - Motivo de consulta.
  - Refracción: AV sin corrección, auto, ciclo, queratometría, gafas 1/2/3, manifiesta, receta, ciclo/retinoscopia/quirúrgica/CAP.
  - Tensión ocular y paquimetría, con gráfica de evolución de la PIO.
  - Motilidad ocular, BMC anterior, fondo de ojo, diagnóstico y TTO, OCT, angiografía, campimetría, topografía, ecografía, biometría, recuento endotelial, órbita/párpados, oculoplastia y estética. Cada sección tiene sus propios campos (cover test, Van Herick, excavación E/P, CFNR, DM/DSM/VFI, longitud axial, potencia de LIO…), con tablas O.D./O.I. y listas de sugerencias.
- **Datos del paciente editables**: nombre, fecha de nacimiento (la edad se recalcula sola), sociedad y mutua. También se puede cambiar la fecha de la visita.
- **Vista previa** en vivo, con **F2** (todo el historial) y **F3** (última visita).
- **Guardar**: la visita queda en el historial y la cita se marca como atendida.
- **Reiniciar práctica**: vuelve a los datos iniciales.

---

## Tecnologías

| Parte | Tecnología | Para qué |
|---|---|---|
| Frontend | **React 19** + **Vite** | Interfaz de usuario; Vite es el servidor de desarrollo y el empaquetador |
| Backend | **Node.js** + **Express 5** | API REST que recibe y devuelve JSON |
| Base de datos | **PostgreSQL** en **Supabase** (vía `pg`) | Base de datos en la nube; los datos se conservan aunque el servidor se reinicie |
| Hosting | **Render** | Un solo servicio web que sirve la API y el frontend |
| Tests | `node:test` (incluido en Node) | Pruebas automáticas de la API |

---

## Cómo ejecutarlo

Necesitas **Node.js 20.12 o superior** ([descargar](https://nodejs.org)) y una base de datos
PostgreSQL. Lo más sencillo es usar la misma de Supabase (ver [Despliegue](#despliegue-render--supabase)).

```bash
# 1. Instalar dependencias (frontend y backend a la vez)
npm install

# 2. Configurar la base de datos: copia la plantilla y pon tu DATABASE_URL
cp server/.env.example server/.env

# 3. Arrancar en modo desarrollo (API + web con recarga automática)
npm run dev
```

Al arrancar por primera vez, el servidor crea las tablas y carga los pacientes de práctica.

Abre **http://localhost:5173**.

**Desde el móvil:** conecta el móvil al mismo Wi-Fi que el ordenador y abre
`http://IP-DE-TU-MAC:5173`. Vite muestra esa dirección en la terminal, en la
línea "Network". En Mac también la ves en *Ajustes → Wi-Fi → Detalles*.

### Otros comandos

| Comando | Qué hace |
|---|---|
| `npm test` | Ejecuta los tests de la API (necesita `TEST_DATABASE_URL`, una base **distinta**: los tests la borran) |
| `npm run build` | Compila el frontend para producción en `client/dist` |
| `npm start` | Arranca solo Express, que sirve la API **y** el frontend compilado (http://localhost:3001) |
| `npm run seed` | Borra los datos de `DATABASE_URL` y recarga los pacientes de práctica |

---

## Cómo está organizado

```
clinic_dupe/
├── package.json          ← "workspaces": une client y server en un solo npm install
├── render.yaml           ← configuración de despliegue en Render (Blueprint)
├── server/               ← BACKEND
│   ├── .env.example      ← plantilla de variables de entorno (el .env real no se sube)
│   ├── src/
│   │   ├── index.js      ← carga .env, prepara la BD y arranca el servidor (puerto 3001)
│   │   ├── app.js        ← configura Express: middlewares, rutas, errores
│   │   ├── db.js         ← pool de conexiones a PostgreSQL, query() y withTransaction()
│   │   ├── schema.sql    ← definición de las tablas (+ seguridad RLS para Supabase)
│   │   ├── seedData.js   ← los 36 casos clínicos escritos a mano
│   │   ├── seed.js       ← carga inicial (casos + ~380 pacientes generados) e inserción por lotes
│   │   ├── agenda.js     ← ⭐ rellena un día de la agenda la primera vez que se abre
│   │   ├── generator/    ← ⭐ fábrica de datos de práctica
│   │   │   ├── templates.js  ← 34 plantillas de patologías (catarata, glaucoma, DMAE...)
│   │   │   ├── index.js      ← pacientes, historiales y planificación de un día (funciones puras)
│   │   │   ├── helpers.js    ← piezas comunes (refracción, PIO, fondo de ojo...)
│   │   │   ├── random.js     ← números aleatorios con semilla (reproducibles)
│   │   │   └── names.js      ← nombres, apellidos y aseguradoras
│   │   ├── errors.js     ← HttpError, validación y traducción de errores de Postgres
│   │   └── routes/
│   │       ├── appointments.js  ← /api/appointments (agenda)
│   │       └── patients.js      ← /api/patients (pacientes y visitas)
│   └── test/
│       ├── api.test.js       ← tests de la API (necesitan TEST_DATABASE_URL)
│       └── seedData.test.js  ← comprueba que los casos usan campos y opciones que existen
└── client/               ← FRONTEND
    ├── vite.config.js    ← proxy /api → Express
    └── src/
        ├── main.jsx      ← monta React en la página
        ├── App.jsx       ← decide qué pantalla se ve
        ├── api.js        ← todas las llamadas al backend
        ├── styles.css    ← estilo "Windows clásico" + responsive + impresión
        ├── lib/
        │   ├── fields.js   ← ⭐ la estructura de la historia descrita como datos
        │   ├── sectionForms.js ← ⭐ campos de las 14 secciones de exploración y pruebas
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
[ Vite proxy :5173 ]  en desarrollo reenvía /api/* al backend
        ▼              (en Render no hace falta: Express sirve web y API)
        ▼
[ Express :3001 ]     routes/patients.js valida los datos y, en una TRANSACCIÓN:
        │               1. inserta la visita
        │               2. actualiza los antecedentes
        │               3. marca la cita como "atendido"
        ▼
[ PostgreSQL ]        Supabase guarda los datos en la nube
        │
        ▼  responde con la ficha actualizada (JSON)
[ React ]  setPatient(...) → la vista previa se vuelve a pintar sola
```

### API REST

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/appointments?fecha=AAAA-MM-DD` | Citas de un día (con datos del paciente) |
| POST | `/api/appointments` | Crear cita |
| PATCH | `/api/appointments/:id` | Cambiar estado o **mover** la cita (`fecha`, `hora`, `medico`, `nota`). 409 si choca con otra cita |
| DELETE | `/api/appointments/:id` | Anular una cita (no si ya está atendida) |
| GET | `/api/patients?q=texto` | Buscar pacientes |
| POST | `/api/patients` | Alta de paciente |
| GET | `/api/patients/:hc` | Ficha + antecedentes + visitas |
| PUT | `/api/patients/:hc` | Editar nombre, nacimiento, sociedad y mutua |
| PUT | `/api/patients/:hc/antecedentes` | Guardar antecedentes |
| POST | `/api/patients/:hc/visits` | Guardar una consulta (acepta `fecha` opcional) |
| POST | `/api/reset` | Recargar datos de práctica |

---

## Decisiones de diseño (y por qué)

1. **Formularios descritos como datos** (`fields.js` y `sectionForms.js`). La historia tiene más de 500 campos. En vez de escribir cada `<input>`, las tablas de refracción se describen en `GRIDS` y las demás secciones en `SECTION_FORMS`. Dos componentes (`RxGrid` y `StructuredSection`) las dibujan. Para añadir un campo basta con añadir una línea, y aparece también en la vista previa y en la base de datos.
2. **La edad no se guarda, se calcula** a partir de la fecha de nacimiento. Si se guardara, dejaría de ser correcta en el siguiente cumpleaños. El nº de HC tampoco se puede editar: es la clave que enlaza citas y visitas.
3. **Campos clínicos en JSONB.** Lo que hay que filtrar u ordenar (fecha, hora, estado, nombre) tiene su propia columna con su tipo (`DATE`, `BOOLEAN`...). Los datos del formulario van en columnas `JSONB`: es flexible y aun así se pueden consultar (`data->>'ten1_od'`). Lo explica `schema.sql`.
4. **Un solo estado de formulario** en `HistoriaClinica.jsx` ("lifting state up"). Las secciones solo leen y escriben su parte, y la vista previa ve siempre todos los datos.
5. **La vista previa es una función pura** (`preview.js`): recibe datos y devuelve bloques, sin tocar React. Así es fácil de entender y de probar.
6. **Transacciones** al guardar una visita: o se guardan los tres cambios, o ninguno. En Postgres todas las consultas de una transacción van por la misma conexión (`withTransaction` en `db.js`).
7. **Consultas parametrizadas** (`$1`, `$2`...) en todo el SQL, para evitar la inyección SQL.
8. **Secretos fuera del código.** La contraseña de la base de datos solo existe en `server/.env` (ignorado por git) y en el panel de Render.
9. **Las reglas las impone el servidor.** El selector de huecos libres ayuda a elegir, pero es la API la que rechaza (409) dos citas del mismo médico a la misma hora, o mover/anular una cita ya atendida: al navegador se le puede saltar, al servidor no.
10. **Agenda "perezosa" (lazy).** Las citas de un día no existen hasta que alguien abre ese día; entonces `agenda.js` las genera y las guarda. La tabla `agenda_days` recuerda qué días ya se generaron (así no se duplican) y un candado de Postgres (`pg_advisory_xact_lock`) evita que dos peticiones a la vez generen lo mismo.
11. **Aleatorio pero reproducible.** El generador usa números aleatorios con semilla: el mismo HC produce siempre el mismo perfil (graduación, PIO, ojo afectado), así que todas las visitas de un paciente son coherentes entre sí.
12. **Recarga automática por versión.** `SEED_VERSION` (en `seed.js`) se guarda en la tabla `meta`. Si al arrancar no coincide, el servidor recarga los datos de práctica solo. ⚠️ Eso borra las visitas que hayas guardado.
13. **Datos de práctica verificados por un test.** `seedData.test.js` comprueba que los casos escritos a mano y **todas las plantillas del generador** usan claves y opciones de desplegable que existen en el formulario; si no, el dato no se vería y nadie se daría cuenta.
14. **Row Level Security activado.** Supabase publica una API automática para cada tabla; activando RLS sin políticas, esa puerta queda cerrada y solo nuestro servidor puede acceder.

---

## Despliegue (Render + Supabase)

Todo gratis. La app entera (web + API) vive en **un** servicio de Render, y los datos en Supabase.

### 1. Base de datos en Supabase

1. Crea una cuenta en [supabase.com](https://supabase.com) y un **New project**.
   - Región: **Central EU (Frankfurt)**, la misma que usaremos en Render, para que vayan rápido entre sí.
   - Apunta la **contraseña de la base de datos** que eliges: la necesitas en el paso 3.
2. Cuando el proyecto esté listo, pulsa **Connect** (arriba) → sección **Session pooler** y copia la URI:
   ```
   postgresql://postgres.xxxxxxxx:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
   ```
   Sustituye `[YOUR-PASSWORD]` por tu contraseña. Esa es tu `DATABASE_URL`.

   > ¿Por qué *Session pooler* y no *Direct connection*? La conexión directa de Supabase solo funciona por IPv6, y Render solo usa IPv4. El pooler en modo sesión es IPv4 y es el recomendado para un servidor que está siempre encendido.
3. No hace falta crear tablas: el servidor las crea solo al arrancar.

### 2. Probar en local (opcional, recomendado)

Pon la `DATABASE_URL` en `server/.env` y ejecuta `npm run dev`. Si ves los pacientes en http://localhost:5173, la conexión funciona. En Supabase → **Table Editor** verás las tablas `patients`, `appointments` y `visits`.

### 3. Servicio en Render

1. Sube los últimos cambios a GitHub (`git push`).
2. En [render.com](https://render.com): **New → Blueprint** → conecta GitHub y elige el repositorio `clinic_dupe`. Render lee `render.yaml`.
3. Te pedirá el valor de **`DATABASE_URL`**: pega la URI de Supabase.
4. Espera a que termine el despliegue (unos minutos) y abre la dirección `https://clinic-dupe-xxxx.onrender.com`.

A partir de ahí, **cada `git push` a `main` vuelve a desplegar** la app.

### Qué esperar del plan gratuito

- **Render se duerme** tras 15 minutos sin visitas; la siguiente visita tarda ~1 minuto en despertarlo.
- **Supabase pausa el proyecto** tras 1 semana sin uso. Se reactiva desde su panel (*Restore project*).
- **`/api/reset` es público**: cualquiera con la dirección puede reiniciar los datos. Para un simulador con datos ficticios no importa, pero en una app real iría protegido con inicio de sesión.
- ⚠️ **Nunca introduzcas datos reales de pacientes.** Esta app no tiene autenticación ni cumple los requisitos del RGPD para datos de salud.

## Ideas para seguir aprendiendo

- [ ] Añadir `react-router` para tener URLs propias (`/paciente/700101`).
- [ ] Tests del frontend con Vitest + Testing Library.
- [ ] Inicio de sesión con varios usuarios (médico / optometrista).
- [ ] Pasar a TypeScript.
- [ ] Búsqueda sin tildes con la extensión `unaccent` de Postgres ("alvarez" → "Álvarez").
- [ ] Verificar el certificado SSL de Supabase (ahora la conexión va cifrada, pero sin comprobar el certificado).

## Licencia

MIT — ver [LICENSE](LICENSE).
