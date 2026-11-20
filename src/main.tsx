import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Mode hors ligne (uniquement en production, pour ne pas gêner le développement)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(() => navigator.serviceWorker.ready)
      .then((registration) => {
        // Met en cache les fichiers déjà chargés par cette première visite
        const urls = performance
          .getEntriesByType('resource')
          .map((entry) => entry.name)
          .filter((url) => url.startsWith(window.location.origin));
        registration.active?.postMessage({ type: 'CACHE_URLS', urls });
      })
      .catch(() => {
        // pas de mode hors ligne : l'application fonctionne quand même
      });
  });
}
