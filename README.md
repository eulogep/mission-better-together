# MBT — Mission Better Together

Application web mobile (installable, utilisable hors ligne) d'aide, d'alerte et d'information
contre le harcèlement. React 19 + TypeScript + Vite + Tailwind CSS 4, sans serveur.

## Lancer le projet

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # vérification TypeScript + build de production dans dist/
npm run preview   # sert le build de production (active le mode hors ligne)
```

Pour tester sur un téléphone : `npm run dev` puis ouvrir l'adresse « Network » affichée, sur le même Wi-Fi.
La géolocalisation demande HTTPS (ou `localhost`) : en production, héberger le dossier `dist/` sur un
hébergement HTTPS (Netlify, Vercel, GitHub Pages…).

## Fonctionnalités

| Fonction | Comment ça marche |
| --- | --- |
| **Appels** | Un appui ouvre le composeur du téléphone (`tel:`). L'écran d'appel propose aussi le SMS au 114 et le tchat des services qui en ont un. |
| **Alerter mes proches** | SMS pré-rempli avec la position GPS envoyé aux personnes de confiance (`sms:`), ou partage via WhatsApp, Messenger, etc. |
| **Lieux sûrs** | Vraie carte OpenStreetMap (Leaflet) : police, pharmacies, hôpitaux autour de la position ou d'une ville cherchée, itinéraire à pied dans l'appli de cartes. |
| **Journal de preuves** | Faits datés, lieu, auteurs, témoins, captures d'écran ; export d'un rapport HTML (imprimable en PDF). |
| **Contacts** | Numéros d'aide nationaux + personnes de confiance ajoutées à la main ou importées du téléphone (Android). |
| **Chat** | Assistant d'orientation automatique (mots-clés) + liens vers de vrais écoutants (3018, Fil Santé Jeunes, 3114). |
| **Témoignages** | Voix réalistes ElevenLabs (fichiers MP3, une voix par témoin) avec sous-titres synchronisés ; repli automatique sur la voix du téléphone si le fichier manque ; sous-titres FR/EN, mode silencieux. |
| **Météo du jour** | Sur l'accueil : 4 humeurs (soleil → orage) ; chaque réponse propose des actions adaptées (respirer, tchat 3018, 3114, prévenir un proche). |
| **Respire avec moi** | Respiration guidée 4-2-6 (bulle animée + vibrations) et exercice d'ancrage 5-4-3-2-1 interactif, puis « Comment tu te sens ? ». |
| **Bouton d'appel** | Maintenir appuyé ~1 s (anneau de progression) pour éviter les appels accidentels ; appel direct au clavier / lecteur d'écran. |
| **Premier lancement** | 3 écrans : bienvenue, confidentialité (sortie rapide, bouton maintenu), choix du profil, ajout d'un proche. Accès « Urgence » à chaque étape. |
| **Sortie rapide** | Quitte instantanément vers un site neutre et efface la conversation en cours. |
| **PWA** | Installable, raccourcis d'icône (Alerter, Lieux sûrs, Journal), fonctionne hors ligne. |

## Voix des témoignages (ElevenLabs)

Les voix sont générées une seule fois puis servies comme fichiers statiques (`public/audio/`) :
l'application n'appelle jamais ElevenLabs et ne contient aucune clé.

```bash
ELEVENLABS_API_KEY=votre_cle npm run voices   # crée public/audio/temoignage-<id>-fr.mp3
npm run build
```

- Voix et textes : `scripts/generate-voices.mjs` (une voix française par témoin ; `--force` pour tout régénérer).
- Coût indicatif : ~2 000 crédits pour les 6 témoignages en français.
- La clé se crée sur https://elevenlabs.io/app/settings/api-keys — ne la partagez pas et ne la mettez pas dans le code.

## Services externes utilisés (gratuits, sans clé)

- Tuiles de carte : OpenStreetMap (`tile.openstreetmap.org`)
- Lieux : Nominatim (OpenStreetMap), avec Overpass en secours
- Recherche de ville : Géoplateforme IGN / API Adresse

La position n'est envoyée qu'à ces services pour trouver les lieux proches. Les contacts et le journal
restent uniquement sur l'appareil (localStorage / IndexedDB).

Pour un usage à grande échelle, prévoir un serveur de tuiles et de recherche dédié : les serveurs
publics d'OpenStreetMap limitent le nombre de requêtes.

## Structure

| Dossier | Contenu |
| --- | --- |
| `src/App.tsx` | Navigation (pile d'écrans synchronisée avec l'historique du navigateur), raccourcis, cadre desktop |
| `src/screens/` | Un fichier par écran |
| `src/components/` | `ScreenShell`, `MbtButton`, `QuickExitBar`, `PlacesMap` |
| `src/lib/` | `device` (appel, SMS, GPS), `places` (lieux réels), `contacts`, `journal` (IndexedDB + export) |
| `src/data/content.ts` | Contenus : conseils par profil, numéros d'urgence, liens officiels, témoignages |
| `public/` | Images, icônes, `manifest.webmanifest`, `sw.js` (mode hors ligne) |

## Numéros utiles (France)

3018 (harcèlement & cyberharcèlement) · 3020 (harcèlement scolaire) · 3114 (prévention du suicide) ·
119 (enfance en danger) · 0 800 235 236 (Fil Santé Jeunes) · 3919 (violences femmes info) ·
17 (police) · 15 (SAMU) · 112 (urgence européenne) · 114 (urgence par SMS)
