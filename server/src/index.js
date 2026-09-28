// =====================================================================
// index.js — punto de entrada: arranca el servidor HTTP
// =====================================================================
import { app } from './app.js';

// process.env.PORT permite cambiar el puerto sin tocar el código
// (p. ej. `PORT=4000 npm start`). Si no existe, usamos 3001.
const PORT = Number(process.env.PORT) || 3001;

app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});
