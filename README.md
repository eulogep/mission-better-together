# MBT — Mission Better Together

Application de prévention et d'accompagnement contre le harcèlement scolaire : web responsive (mobile et
ordinateur), installable, utilisable hors ligne, et empaquetée pour Android et iOS avec Capacitor.

**Principe :** rien n'est simulé. Chaque action a un effet réel et vérifiable (appel via le téléphone, SMS
préparé dans l'appli SMS, carte OpenStreetMap, carnet chiffré sur l'appareil), ou est explicitement présentée
comme non disponible. Aucune donnée n'est envoyée à un serveur MBT : il n'en existe pas.

> État : **base de production en cours**, pas « production ready ». Voir [Limites](#limites-connues) et
> [docs/SECURITE.md](docs/SECURITE.md) avant toute mise en ligne publique.

## Démarrer

```bash
npm install
npm run dev          # http://localhost:5173 (sans service worker)
npm run check        # types + tests unitaires + build de production
npm run test:e2e     # 48 parcours Playwright (Chrome installé requis)
npm run preview      # sert dist/ (service worker, CSP, mode hors ligne)
```

La géolocalisation et le chiffrement exigent HTTPS (ou `localhost`). Pour la production web : héberger `dist/`
sur un hébergement HTTPS avec **réécriture de toutes les routes vers `/index.html`** (l'app utilise de vraies URL :
`/carnet`, `/lieux`, `/sinformer/articles/…`).

## Fonctionnalités

| Module | Ce qui fonctionne réellement | Limites |
| --- | --- | --- |
| **Accueil** | Tableau de bord vers tous les services, météo d'humeur avec suggestions adaptées | — |
| **Navigation** | URL par écran, liens profonds, bouton retour du téléphone, onglets (mobile), barre latérale (ordinateur) | — |
| **SOS** | Appui maintenu ~1 s → composeur du téléphone sur le **112** ; appel direct au clavier/lecteur d'écran | MBT n'opère aucun service d'urgence (c'est écrit) |
| **Urgence** | Parcours victime/témoin, numéros officiels, SMS au **114** pré-rempli | — |
| **Alerte SMS** | Message prêt dans l'appli SMS du téléphone pour une ou plusieurs personnes de confiance ; position ajoutée **seulement sur demande** ; état « préparé » distinct d'« envoyé » | Pas d'envoi automatique : nécessite un fournisseur SMS + backend (voir ci-dessous) |
| **Contacts** | Ajouter, modifier, supprimer, importer (Android Chrome), appeler | Stockés en clair sur l'appareil (accès en urgence sans code) |
| **Carnet protégé** | Coffre AES-GCM 256 (clé dérivée du code, PBKDF2 600 000 itérations), auto-enregistrement, recherche, filtres, étiquettes, pièces jointes chiffrées, export de rapport, changement de code, effacement total, verrouillage auto, migration des anciennes notes en clair, mode « lâcher prise » (rien n'est enregistré) | Code oublié = données perdues (par conception) |
| **Sérénité** | 3 respirations guidées, durées (1/3/5/10 min ou libre), pause/reprise, ancrage 5-4-3-2-1, galet zen, 4 ambiances sonores **générées en direct** (Web Audio, aucun fichier sous licence), volume général et coupure, mode nuit, option « sans animation », préférences sauvegardées | Vibrations indisponibles sur iOS (API web) |
| **S'informer** | 8 fiches **sourcées et datées** (sources officielles vérifiées le 20/11/2026), recherche, catégories ; conseils par profil | Contenu à faire relire par un professionnel avant diffusion large |
| **Lieux d'aide** | Carte OpenStreetMap (Leaflet), police/gendarmerie, pharmacies, hôpitaux via Nominatim (repli Overpass), recherche de ville (IGN), itinéraire à pied dans l'appli de cartes ; géolocalisation **uniquement sur action** | Données OSM non vérifiées par MBT (indiqué) ; quotas des serveurs publics |
| **Structures d'aide** | Annuaire de 15 structures réelles (3018, 119, 3114, 114, Ma Sécurité, France Victimes 116 006, Pharos…), recherche, filtres, fiches avec canaux vérifiés et date de vérification ; assistant d'orientation automatique clairement étiqueté | Aucun professionnel individuel ni rendez-vous (aucun n'a été inventé) |
| **Récits** | 6 récits lus à voix haute, sous-titres FR/EN, **marqués comme fictifs** | Soumission de témoignages : non disponible (nécessite backend + modération, conçu dans `docs/`) |
| **Discrétion** | Sortie rapide vers une page neutre, mode discret (fausse page de révisions + verrouillage du carnet), double Échap | — |
| **Hors ligne** | Service worker : toute l'application (écrans chargés à la demande inclus) disponible sans réseau | Carte et recherche de lieux nécessitent le réseau |

## Architecture

React 19 + TypeScript strict + Vite 6 + Tailwind CSS 4, framer-motion, Leaflet, Capacitor 8.
Choix détaillé (web + Capacitor plutôt que React Native) : [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

```
src/app/        routes (URL ↔ écran), navigation (historique), mise en page responsive
src/features/   carnet (coffre + écrans), info (bibliothèque), specialistes (annuaire)
src/lib/        logique métier sans interface : vault (crypto), device (tel/sms/GPS), places, contacts, preferences, toast
src/screens/    écrans issus du prototype, rendus fonctionnels
src/data/       contenus versionnés : numéros, articles sourcés, structures vérifiées
tests/unit/     Vitest (53 tests)        tests/e2e/   Playwright (48 parcours, mobile + ordinateur)
android/ ios/   projets natifs Capacitor  docs/        audit, architecture, sécurité, mobile, schéma backend
```

## Environnements

| Mode | Fichier | Service worker | CSP |
| --- | --- | --- | --- |
| développement | `.env.development` | non | non (rechargement à chaud) |
| test | `.env.test` | non | — |
| production | `.env.production` | oui | stricte (injectée au build) |

Aucun secret dans ces fichiers ni dans le code client. Secrets locaux éventuels : `.env.local` (ignoré par Git), voir `.env.example`.

## Services externes

| Service | Usage | Coût | Données envoyées |
| --- | --- | --- | --- |
| OpenStreetMap (tuiles) | Fond de carte | Gratuit (politique d'usage) | Zone affichée |
| Nominatim / Overpass | Lieux proches | Gratuit (quotas) | Position approximative, **après accord** |
| Géoplateforme IGN | Recherche de ville | Gratuit | Texte saisi |
| ElevenLabs | Voix des récits (génération hors ligne, `npm run voices`) | Payant | Textes des récits, depuis le poste du développeur |

### Envoi de SMS automatique (non intégré)

Un navigateur ou une WebView ne peut pas envoyer un SMS sans action de l'utilisateur. Pour un envoi automatique
il faudrait : un backend (clé du fournisseur côté serveur uniquement), un fournisseur (Brevo, OVHcloud SMS, Twilio…),
la vérification du numéro de l'expéditeur, une limitation anti-abus, et le consentement explicite des destinataires.
Coût par SMS et cadre légal à valider : **non engagé**. L'app reste honnête : elle prépare le message, l'utilisateur l'envoie.

### Témoignages des utilisateurs (non intégré)

Conçu mais non déployé : API + PostgreSQL, soumission privée, anonymisation, double validation humaine avant
publication, journal d'audit sans contenu sensible. Schéma : [docs/backend-schema.sql](docs/backend-schema.sql).

## Applications mobiles

Projets `android/` et `ios/` générés. **Android : APK de débogage compilé et vérifié** ; iOS : projet généré, non
compilé (Xcode absent). Procédure, permissions et checklist des stores : [docs/MOBILE.md](docs/MOBILE.md).

```bash
npm run mobile:sync      # build + copie dans les projets natifs
npm run mobile:android   # ouvre Android Studio
npm run mobile:ios       # ouvre Xcode
```

## Tests (dernier passage)

| Suite | Résultat |
| --- | --- |
| `npm run typecheck` | OK |
| `npm test` (Vitest) | 53/53 |
| `npm run test:e2e` (Playwright, build de production, mobile 390×844 + ordinateur 1440×900) | 48/48 |
| Compilation Android `assembleDebug` | OK |

Les parcours couvrent notamment : absence d'éléments de démo, liens profonds et retour, carnet (création du code,
auto-enregistrement, verrouillage, mauvais code, persistance, **vérification qu'aucun texte n'est stocké en clair**,
migration), SOS maintenu, alerte (aucune géolocalisation sans clic), lieux (carte réelle avec données simulées),
préférences sérénité persistées, bibliothèque et annuaire, mode discret, sortie rapide, CSP, hors ligne,
absence de défilement horizontal à 320 et 768 px.

## Limites connues

- Pas de backend : pas de comptes, pas de synchronisation, pas de modération, pas d'envoi SMS automatique.
- Code de carnet court = résistance limitée face à une copie du stockage (phrase de passe conseillée à l'écran).
- Tests sur appareils réels (appels, SMS, permissions, iOS) **non réalisés** à ce stade.
- Contenus (fiches, conseils, récits) à faire relire par des professionnels de l'enfance et un juriste.
- Obligations RGPD / protection des mineurs à évaluer avant toute collecte : voir [docs/SECURITE.md](docs/SECURITE.md).

## Voix des récits (ElevenLabs)

`ELEVENLABS_API_KEY=… npm run voices` génère `public/audio/temoignage-<id>-fr.mp3` (voix et textes dans
`scripts/generate-voices.mjs`). Sans fichier, le lecteur utilise la voix de synthèse du téléphone.

## Numéros utiles (France — vérifiés le 20/11/2026)

3018 harcèlement et cyberharcèlement (7j/7, 9h–23h, numéro unique) · 119 enfance en danger (24h/24) ·
3114 prévention du suicide (24h/24) · 116 006 aide aux victimes (7j/7, 9h–20h) · 0 800 235 236 Fil Santé Jeunes ·
3919 violences femmes info · 17 police · 15 SAMU · 112 urgence européenne · 114 urgence par SMS

## Licence

Code source sous licence [MIT](LICENSE) — © 2026 Eulogep.

Composants tiers (conservent leur propre licence) : police Ubuntu (Ubuntu Font Licence 1.0), Leaflet (BSD-2-Clause),
React, Vite, Tailwind CSS, framer-motion, lucide-react et Capacitor (MIT). Données cartographiques
© contributeurs OpenStreetMap (ODbL, attribution affichée sur la carte). Les numéros et liens officiels cités
appartiennent à leurs organismes respectifs ; MBT n'est affilié à aucun d'eux.

Avertissement : MBT ne remplace ni les services d'urgence ni un accompagnement professionnel.
En cas de danger, appeler le 17 ou le 112 (SMS au 114 si impossible de parler).
