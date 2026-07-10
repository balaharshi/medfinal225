import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
// configureApiFetch removed - consolidated to api.ts
import { initGA, initFacebookPixel } from './services/analytics';
import { AppDataProvider } from './context/AppDataContext';
import App from './App.tsx';
import './index.css';

initGA();
initFacebookPixel();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppDataProvider>
      <App />
    </AppDataProvider>
  </StrictMode>,
);
