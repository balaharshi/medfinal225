import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import './configureApiFetch.ts';
import { initGA } from './services/analytics';
import App from './App.tsx';
import './index.css';

initGA();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
