-- =====================================================================
-- Esquema de la base de datos (SQLite)
-- =====================================================================
-- Tres tablas, una por cada "cosa" que existe en la clínica:
--
--   patients      → la ficha del paciente (datos que casi no cambian)
--   appointments  → las citas de la agenda (una fila por cita)
--   visits        → cada consulta guardada en la historia clínica
--
-- Decisión de diseño importante: los formularios clínicos tienen ~300
-- campos (refracción, tensión, fondo de ojo...). Crear una columna por
-- campo haría la tabla enorme y rígida. En su lugar guardamos esos
-- campos como JSON en una columna de texto (`antecedentes`, `data`).
--   ✔ Ventaja: añadir un campo nuevo en el frontend no requiere tocar la BD.
--   ✘ Coste: no podemos hacer consultas SQL cómodas sobre esos campos
--     (aunque SQLite tiene funciones json_extract() si algún día hace falta).
-- Los datos que SÍ necesitamos filtrar/ordenar (fecha, hora, estado,
-- nombre...) tienen su propia columna.
--
-- "IF NOT EXISTS" hace que este script se pueda ejecutar en cada arranque
-- sin borrar nada: solo crea lo que falte.
-- =====================================================================

-- Obliga a SQLite a respetar las claves foráneas (por defecto no lo hace).
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS patients (
  hc            TEXT PRIMARY KEY,          -- nº de historia clínica
  nombre        TEXT NOT NULL,             -- "Apellidos, Nombre"
  nacimiento    TEXT NOT NULL,             -- fecha ISO: AAAA-MM-DD
  sociedad      TEXT NOT NULL DEFAULT 'PRIVADO',  -- aseguradora
  mutua         TEXT NOT NULL DEFAULT '',
  antecedentes  TEXT NOT NULL DEFAULT '{}' -- JSON con alergias, medicación...
);

CREATE TABLE IF NOT EXISTS appointments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha       TEXT NOT NULL,               -- AAAA-MM-DD
  hora        TEXT NOT NULL,               -- HH:MM
  ticket      TEXT NOT NULL DEFAULT '',
  nota        TEXT NOT NULL DEFAULT '',
  medico      TEXT NOT NULL,
  hc          TEXT NOT NULL REFERENCES patients(hc) ON DELETE CASCADE,
  prestacion  TEXT NOT NULL,               -- PRIMERA CONSULTA, REVISIÓN...
  -- CHECK limita los valores posibles: la BD rechaza cualquier otro estado.
  status      TEXT NOT NULL DEFAULT 'citado'
              CHECK (status IN ('citado', 'sala', 'consulta', 'atendido')),
  urgente     INTEGER NOT NULL DEFAULT 0   -- SQLite no tiene booleanos: 0/1
);

-- Un índice es como el índice de un libro: acelera las búsquedas por fecha,
-- que es lo que hace la agenda cada vez que se abre.
CREATE INDEX IF NOT EXISTS idx_appointments_fecha ON appointments (fecha);

CREATE TABLE IF NOT EXISTS visits (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  hc              TEXT NOT NULL REFERENCES patients(hc) ON DELETE CASCADE,
  appointment_id  INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
  fecha           TEXT NOT NULL,           -- AAAA-MM-DD
  profesional     TEXT NOT NULL DEFAULT '',
  prestacion      TEXT NOT NULL DEFAULT '',
  data            TEXT NOT NULL DEFAULT '{}',  -- JSON con los campos de la consulta
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_visits_hc ON visits (hc);
