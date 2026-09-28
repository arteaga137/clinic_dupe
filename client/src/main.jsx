// Punto de entrada del frontend: conecta React con el <div id="root">.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

// StrictMode activa avisos extra en desarrollo (no afecta a producción).
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
