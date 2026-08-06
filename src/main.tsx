import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { hidratar } from './data/repo';
import './index.css';

/* Pintamos de inmediato con los datos en caché o los de fábrica y, en
   paralelo, traemos el catálogo del backend si existe (ver src/data/repo.ts).
   Si no hay backend, la app sigue en modo local con localStorage. */
hidratar().catch(() => undefined);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
