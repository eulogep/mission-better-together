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
| Entrées du carnet + pièces jointes | IndexedDB `mbt-vault` | **Chiffrées** AES-GCM 256. La clé de données est enveloppée avec une clé dérivée du code (PBKDF2-SHA-256, 600 000 itérations). La biométrie native opt-in autorise une ouverture via Keystore ou Keychain. |
| Contacts de confiance | localStorage | En clair (choix assumé : utilisables en urgence sans code). Aucune donnée envoyée. |
| Préférences (sérénité, profil, accueil vu) | localStorage | Non sensibles |
| Conversation de l'assistant | sessionStorage | Effacée à la fermeture / sortie rapide |
| Cache des lieux | sessionStorage | Données publiques |

Aucune donnée personnelle n'est envoyée à un serveur MBT (il n'en existe pas). Seuls des services publics
reçoivent des requêtes pour les tuiles OpenStreetMap, les recherches locales Nominatim et Overpass (position uniquement sur demande) et le géocodage IGN (ville saisie).

## 4. Services externes

| Besoin | Service | Statut |
| --- | --- | --- |
| Carte, lieux | OpenStreetMap, Nominatim, Overpass | Intégré (gratuit, quotas d'usage) |
| Géocodage de ville | Géoplateforme IGN | Intégré |
| Voix françaises des récits | Piper, génération locale et MP3 embarqués | Huit pistes et sous-titres synchronisés |
| Envoi SMS automatique | Fournisseur SMS (Brevo, OVHcloud, Twilio…) via backend | **Non intégré** : impossible sans backend ni coût. L'app prépare le SMS dans l'appli du téléphone. |
| Soumission de témoignages et modération | RPC PostgreSQL pour Supabase | Migration et essais SQL locaux, sans collecte depuis l’app |

## 5. Backend de modération

La migration inclut un dépôt privé, des comptes de modération avec MFA, la double approbation d’une version anonymisée, un jeton de retrait et un audit sans contenu. Le [guide de modération](MODERATION.md) décrit les accès et les essais SQL. Le collecteur public, l’interface d’administration et le déploiement restent à préparer.

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
