import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/global.css';

const raiz = document.getElementById('root');

if (!raiz) {
  throw new Error('Não foi possível iniciar o Renova.');
}

createRoot(raiz).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
