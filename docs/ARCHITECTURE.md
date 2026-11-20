# Architecture — MBT

## 1. Choix technique : web responsive + Capacitor (pas de migration React Native)

| Critère | Web (React + Vite) + **Capacitor** | Expo / React Native |
| --- | --- | --- |
| Réutilisation de l'existant | ~100 % (UI, logique, styles Tailwind) | Réécriture complète de l'UI (pas de DOM, pas de Tailwind CSS natif) |
| Une seule base de code web + Android + iOS | Oui | Web via react-native-web, moins fidèle |
| Accès natif utile à MBT (téléphone, SMS, GPS, partage, stockage sécurisé, biométrie) | Oui via plugins Capacitor | Oui |
| Performances requises (formulaires, carte, animations simples) | Suffisantes | Meilleures, mais non nécessaires |
| Coût / risque | Faible | Élevé (tout reconstruire) |

**Décision :** conserver React + Vite (SPA hors ligne, pas besoin de rendu serveur → Next.js n'apporte rien
ici et complique l'empaquetage Capacitor) et ajouter **Capacitor** pour produire les applications Android/iOS.
React Native ne se justifierait que si des fonctions natives lourdes apparaissaient (ex. traitement audio
temps réel, widgets d'écran d'accueil).

## 2. Organisation du code

```
src/
  app/          coque : routes, mise en page responsive, navigation (onglets / barre latérale)
  components/   composants visuels partagés (charte MBT)
  features/     modules verticaux : UI + logique propres au module
    serenite/   exercices, ambiances sonores, préférences
    carnet/     coffre chiffré, écrans du carnet
    info/       bibliothèque d'articles sourcés
    specialistes/ annuaire de structures vérifiées
  lib/          logique métier sans UI (crypto, stockage, appareil, lieux, contacts, toasts)
  data/         contenus statiques versionnés (numéros, articles, structures)
  screens/      écrans historiques (progressivement déplacés dans features/)
tests/
  unit/         Vitest (logique métier)
  e2e/          Playwright (parcours utilisateur, mobile + desktop)
```

Règle : un composant React n'accède jamais directement à IndexedDB/localStorage/crypto ; il passe par `lib/`.

## 3. Modèle de données (local, sur l'appareil)

| Donnée | Stockage | Protection |
| --- | --- | --- |
| Entrées du carnet + pièces jointes | IndexedDB `mbt-vault` | **Chiffrées** AES-GCM 256, clé dérivée du code (PBKDF2-SHA-256, 310 000 itérations, sel aléatoire). Clé uniquement en mémoire, verrouillage auto. |
| Contacts de confiance | localStorage | En clair (choix assumé : utilisables en urgence sans code). Aucune donnée envoyée. |
| Préférences (sérénité, profil, accueil vu) | localStorage | Non sensibles |
| Conversation de l'assistant | sessionStorage | Effacée à la fermeture / sortie rapide |
| Cache des lieux | sessionStorage | Données publiques |

Aucune donnée personnelle n'est envoyée à un serveur MBT (il n'en existe pas). Seuls des services publics
reçoivent des requêtes : tuiles OSM, Nominatim (position approximative, uniquement après accord), IGN (ville saisie).

## 4. Services externes

| Besoin | Service | Statut |
| --- | --- | --- |
| Carte, lieux | OpenStreetMap, Nominatim, Overpass | Intégré (gratuit, quotas d'usage) |
| Géocodage de ville | Géoplateforme IGN | Intégré |
| Voix des témoignages | ElevenLabs (génération hors ligne → MP3 statiques) | Script prêt, compte à régulariser |
| Envoi SMS automatique | Fournisseur SMS (Brevo, OVHcloud, Twilio…) via backend | **Non intégré** : impossible sans backend ni coût. L'app prépare le SMS dans l'appli du téléphone. |
| Soumission de témoignages + modération | Backend (API + PostgreSQL) | **Non intégré** : conception ci-dessous |

## 5. Backend futur (conçu, non déployé)

Nécessaire uniquement pour : témoignages soumis par les utilisateurs, synchronisation chiffrée optionnelle,
envoi de SMS serveur.

- API REST (Node/TypeScript, validation Zod), PostgreSQL, hébergement en France/UE (HDS non requis sauf données de santé).
- `POST /testimonies` → statut `pending` (jamais public), anonymisation, limitation de débit, captcha respectueux de la vie privée.
- Back-office de modération avec comptes nominatifs, double validation, journal d'audit sans contenu sensible.
- `GET /testimonies?status=published` uniquement les témoignages validés.
- Schéma SQL : `docs/backend-schema.sql`.

## 6. Environnements

| Mode | Commande | Usage |
| --- | --- | --- |
| development | `npm run dev` | Développement local (pas de service worker, pas de CSP stricte) |
| test | `npm test`, `npm run test:e2e` | Tests unitaires et de parcours |
| production | `npm run build` | Build web + CSP stricte + service worker ; base des apps Capacitor |

Variables : `.env.development`, `.env.production` (aucun secret côté client — tout ce qui est préfixé `VITE_` est public).

## 7. Risques principaux

| Risque | Mesure |
| --- | --- |
| Perte du code du carnet = perte des données | Avertissement clair à la création ; export possible ; pas de « porte dérobée » |
| Quotas Nominatim/Overpass dépassés à grande échelle | Cache, repli, et serveur dédié avant un déploiement large |
| Fausses promesses (intervention, envoi) | Libellés vérifiés : « préparé », « ouvre ton appli SMS », « MBT n'est pas affilié » |
| Mineurs : RGPD (art. 8), consentement parental si traitement en ligne | Aucun compte, aucune collecte serveur à ce stade ; AIPD à réaliser avant tout backend |
| WebView et `tel:`/`sms:` | Gérés nativement par Capacitor (intents externes) ; à tester sur appareils réels |
