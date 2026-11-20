import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { readdirSync } from 'node:fs';

/**
 * Politique de sécurité du contenu (CSP), injectée uniquement dans le build de production
 * (le serveur de développement a besoin de scripts en ligne pour le rechargement à chaud).
 * Seuls les services réellement utilisés sont autorisés.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://tile.openstreetmap.org",
  "font-src 'self' data:",
  "media-src 'self' blob:",
  [
    "connect-src 'self'",
    'https://nominatim.openstreetmap.org',
    'https://data.geopf.fr',
    'https://api-adresse.data.gouv.fr',
    'https://overpass-api.de',
    'https://lz4.overpass-api.de',
    'https://maps.mail.ru',
  ].join(' '),
  "worker-src 'self'",
  "manifest-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "frame-src 'none'",
].join('; ');

function cspPlugin(): Plugin {
  return {
    name: 'mbt-csp',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace('<!--CSP-->', `<meta http-equiv="Content-Security-Policy" content="${CSP}" />`);
    },
  };
}

/**
 * Liste de tous les fichiers du build, lue par le service worker à l'installation :
 * l'application entière (y compris les écrans chargés à la demande) fonctionne hors ligne.
 */
function precacheManifestPlugin(): Plugin {
  return {
    name: 'mbt-precache-manifest',
    apply: 'build',
    generateBundle(_options, bundle) {
      const files = Object.keys(bundle)
        .filter((f) => !f.endsWith('.map') && f !== 'index.html')
        // Polices : uniquement les sous-ensembles latins en woff2 (les autres ne servent pas en français)
        .filter((f) => !/\.woff$/.test(f) && !/(cyrillic|greek|vietnamese)/.test(f))
        .map((f) => `/${f}`);
      const audio = readdirSync(new URL('./public/audio/', import.meta.url))
        .filter((f) => /^temoignage-[a-z-]+-fr\.mp3$/.test(f))
        .sort()
        .map((f) => `/audio/${f}`);
      this.emitFile({ type: 'asset', fileName: 'precache-manifest.json', source: JSON.stringify([...files, ...audio]) });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), cspPlugin(), precacheManifestPlugin()],
  server: {
    port: 5173,
    host: true,
  },
});
