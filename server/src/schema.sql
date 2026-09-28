-- =====================================================================
-- Esquema de la base de datos (PostgreSQL · Supabase)
-- =====================================================================
-- Tres tablas, una por cada "cosa" que existe en la clínica:
--
--   patients      → la ficha del paciente (datos que casi no cambian)
--   appointments  → las citas de la agenda (una fila por cita)
--   visits        → cada consulta guardada en la historia clínica
--
-- Decisión de diseño: los formularios clínicos tienen unos 560 campos.
-- Crear una columna por campo haría la tabla enorme y rígida, así que
-- guardamos esos campos en columnas JSONB (`antecedentes`, `data`).
--   ✔ Añadir un campo en el frontend no obliga a tocar la base de datos.
--   ✔ JSONB es JSON "binario": Postgres lo valida y permite consultarlo,
--     p. ej.  SELECT data->>'ten1_od' FROM visits;
--   ✘ Sin columnas propias, esos campos no tienen tipo ni restricciones.
-- Los datos que SÍ filtramos u ordenamos (fecha, hora, estado, nombre...)
-- tienen su propia columna con su tipo.
--
-- "IF NOT EXISTS" hace que el script pueda ejecutarse en cada arranque sin
-- borrar nada: solo crea lo que falte.
-- =====================================================================

CREATE TABLE IF NOT EXISTS patients (
  hc            TEXT PRIMARY KEY,                    -- nº de historia clínica
  nombre        TEXT NOT NULL,                       -- "Apellidos, Nombre"
  nacimiento    DATE NOT NULL,                       -- tipo fecha de verdad
  sociedad      TEXT NOT NULL DEFAULT 'PRIVADO',     -- aseguradora
  mutua         TEXT NOT NULL DEFAULT '',
  antecedentes  JSONB NOT NULL DEFAULT '{}'::jsonb   -- alergias, medicación...
);

CREATE TABLE IF NOT EXISTS appointments (
  -- GENERATED ... AS IDENTITY: Postgres asigna el id automáticamente
  -- (1, 2, 3...). Es el equivalente moderno de AUTOINCREMENT / SERIAL.
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  fecha       DATE NOT NULL,
  -- '~' es "cumple la expresión regular": obliga al formato HH:MM.
  hora        TEXT NOT NULL CHECK (hora ~ '^[0-2][0-9]:[0-5][0-9]$'),
  ticket      TEXT NOT NULL DEFAULT '',
  nota        TEXT NOT NULL DEFAULT '',
  medico      TEXT NOT NULL,
  hc          TEXT NOT NULL REFERENCES patients(hc) ON DELETE CASCADE,
  prestacion  TEXT NOT NULL,
  -- CHECK limita los valores posibles: la BD rechaza cualquier otro estado.
  status      TEXT NOT NULL DEFAULT 'citado'
              CHECK (status IN ('citado', 'sala', 'consulta', 'atendido')),
  urgente     BOOLEAN NOT NULL DEFAULT false       -- Postgres sí tiene booleanos
);

-- Un índice es como el índice de un libro: acelera las búsquedas por fecha,
-- que es lo que hace la agenda cada vez que se abre.
CREATE INDEX IF NOT EXISTS idx_appointments_fecha ON appointments (fecha);

CREATE TABLE IF NOT EXISTS visits (
  id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  hc              TEXT NOT NULL REFERENCES patients(hc) ON DELETE CASCADE,
  appointment_id  INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
  fecha           DATE NOT NULL,
  profesional     TEXT NOT NULL DEFAULT '',
  prestacion      TEXT NOT NULL DEFAULT '',
  data            JSONB NOT NULL DEFAULT '{}'::jsonb,  -- campos de la consulta
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()   -- fecha y hora con zona horaria
);

CREATE INDEX IF NOT EXISTS idx_visits_hc ON visits (hc);

-- ---------------------------------------------------------------------
-- SEGURIDAD en Supabase: Row Level Security (RLS)
-- ---------------------------------------------------------------------
-- Supabase publica automáticamente una API REST para cada tabla del
-- esquema "public". Si RLS está desactivado, cualquiera con la clave
-- pública ("anon key") del proyecto podría leer o borrar estas tablas.
-- Activando RLS SIN crear ninguna política, esa API queda bloqueada.
-- Nuestro servidor Express no se ve afectado: se conecta con el usuario
-- "postgres", que es el dueño de las tablas y se salta RLS.
ALTER TABLE patients     ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits       ENABLE ROW LEVEL SECURITY;
