import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Applications Android / iOS : la même application web (dossier dist/) empaquetée dans une WebView.
 * - Aucune URL distante en production : l'app est servie localement (hors ligne, pas de dépendance serveur).
 * - androidScheme https : contexte sécurisé requis pour WebCrypto (carnet chiffré) et la géolocalisation.
 * Identifiant à confirmer avant publication (doit correspondre au compte développeur).
 */
const config: CapacitorConfig = {
  appId: 'fr.missionbettertogether.mbt',
  appName: 'MBT',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    // Pas de captures d'écran système si activé côté natif (voir docs/MOBILE.md)
    allowMixedContent: false,
  },
  ios: {
    contentInset: 'always',
  },
};

export default config;
