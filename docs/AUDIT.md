# Audit de l'existant — MBT (20 novembre 2026)

Branche de travail : `feature/application-reelle` (point de départ : commit `1bd155e` sur `main`).

## 1. Technologies réellement utilisées

| Élément | Constat |
| --- | --- |
| Framework | React 19 + TypeScript strict, bundler Vite 6, Tailwind CSS 4 |
| Routage | Pile d'écrans maison stockée dans `history.state` ; **une seule URL `/`** (pas de liens profonds) |
| Stockage | `localStorage` (contacts, profil, préférences), `sessionStorage` (chat, cache lieux), IndexedDB (journal, **en clair**) |
| Backend / BDD | Aucun. Aucune API propriétaire. |
| Services externes | OpenStreetMap (tuiles), Nominatim + Overpass (lieux), Géoplateforme IGN (géocodage), Google Fonts (police Ubuntu — fuite d'IP vers Google) |
| Mobile natif | Aucun projet Android/iOS. PWA (manifest + service worker) |
| Tests | Aucun test dans le dépôt (scripts Playwright ad hoc hors dépôt) |
| Git | Pas de dépôt avant cet audit |

## 2. Éléments issus du prototype Figma / de démonstration

| Élément | Fichier | Constat |
| --- | --- | --- |
| Téléphone simulé (cadre 390×844, bord noir) | `src/App.tsx` | Enveloppe artificielle sur ordinateur |
| Panneau « Accès rapide aux écrans » | `src/App.tsx` | Télécommande de démo, inutile à l'utilisateur |
| Bouton « Plein écran / Cadre mobile » | `src/App.tsx` | Démo |
| Positions en pixels absolus des filigranes | `ScreenShell.tsx` | Calées sur 390 px ; OK en mobile, à contraindre sur desktop |
| Écrans non défilables | `ScreenShell` (`scrollable=false` par défaut) | Contenu coupé sur petits écrans (iPhone SE 667 px) |

## 3. Tableau des fonctionnalités

| Fonctionnalité | État actuel | Problème identifié | Action nécessaire | Priorité |
|---|---|---|---|---|
| Accueil | Fonctionnel (liens réels, météo d'humeur) | Pas de navigation persistante ; non défilable ; enveloppé dans un faux téléphone | Barre d'onglets mobile + navigation latérale desktop ; défilement ; supprimer la démo | P0 |
| Sérénité | Partiel : une seule respiration 4-2-6 fixe (1 min) + ancrage 5-4-3-2-1 | Pas de choix d'exercice/durée, pas de son, pas de volume, pas de mode nuit, préférences non sauvegardées, option « sans animation » seulement via le système | Module complet : exercices, durées, ambiances sonores générées (Web Audio, sans licence), volume, mode nuit, préférences persistées, option sans animation | P0 |
| Carnet | Partiel : CRUD + photos + export (IndexedDB) | **Récits sensibles stockés en clair** ; pas de recherche, pas de classement, pas d'auto-enregistrement, pas de suppression totale | Coffre chiffré (AES-GCM, clé dérivée d'un code PIN, verrouillage auto), migration des anciennes entrées, auto-enregistrement, recherche, filtres, étiquettes, export, effacement total | P0 |
| Alerte SMS | Fonctionnel via `sms:` (aucun envoi automatique) | **Géolocalisation lancée automatiquement** à l'ouverture ; « message préparé » insuffisamment distingué d'« envoyé » | Position uniquement sur action explicite ; états « préparé / ouvert dans l'appli SMS » ; documenter un fournisseur SMS (non intégré) | P0 |
| Urgence | Fonctionnel (`tel:`, SMS 114, quiz témoin) | Le bouton flottant est présenté comme « Assistance MBT · Redirection d'urgence » : **promesse fausse**, MBT n'opère aucun service (c'est le 112) | Libellés honnêtes (112), page « À qui s'adresser ? » | P0 |
| S'informer | Partiel : conseils courts par profil | Pas de bibliothèque, pas de sources ni de dates, pas de recherche ; **le 3020 n'existe plus en tant que service distinct** (remplacé par le 3018, numéro unique) | Bibliothèque d'articles sourcés et datés, catégories, recherche ; corriger les numéros | P1 |
| Lieux sûrs | Fonctionnel : carte OSM réelle, recherche de ville, itinéraires | **Géolocalisation automatique** ; lieux qualifiés de « sûrs » sans définition | Géolocalisation facultative (sur action), renommer « Lieux d'aide », définition objective + mention « non vérifié par MBT » | P1 |
| Témoignages | Lecteur fonctionnel (voix de synthèse) | **Récits écrits par l'équipe présentés comme authentiques** (« Lina, 14 ans ») | Marquer clairement « récit illustratif (fictif) » ; architecture de soumission privée + modération (documentée, nécessite un backend) | P0 (honnêteté) |
| Contacts | Fonctionnel : ajout, suppression, import Android | Pas de modification ; données en clair (choix assumé : doivent rester accessibles en urgence sans code) | Ajout de la modification, actions « préparer appel / SMS / partager position » avec consentement | P0 |
| Spécialistes | **Simulé** : chat à mots-clés présenté comme « Contacter spécialistes » | Pas d'annuaire ; aucun professionnel réel | Annuaire de structures officielles vérifiées (recherche, filtres, fiches) ; l'assistant reste un outil d'orientation clairement étiqueté | P1 |
| Appel 3018 | Fonctionnel (`tel:3018` + lien tchat) | Canaux incomplets (WhatsApp, Messenger, appli) ; risque de laisser croire à un lien MBT ↔ 3018 | Fiche 3018 vérifiée avec mention « MBT n'est pas affilié » | P1 |
| Sortie rapide | Fonctionnel | — | Conserver ; verrouiller aussi le carnet | — |
| Hors ligne / PWA | Fonctionnel | Police chargée depuis Google | Auto-héberger la police | P2 |

## 4. Problèmes transverses

- **Navigation** : pas d'URL par écran, pas de barre de navigation persistante.
- **Responsive** : faux téléphone sur desktop ; écrans non défilables.
- **Accessibilité** : bonne base (libellés ARIA, zoom autorisé, mouvement réduit) ; à compléter (contrastes du jaune de marque, focus).
- **Sécurité** : carnet en clair ; pas de CSP ; police tierce (Google) ; aucun secret dans le code (vérifié).
- **Données de démo** : témoignages fictifs non signalés, 3020 obsolète, libellé « Assistance MBT » trompeur.

## 5. Réutilisation

Réutilisable tel quel : charte (ScreenShell, MbtButton), lib `device` (tel/sms/GPS), `places` (Nominatim/Overpass), `contacts`, export du journal, sortie rapide, service worker.
À refondre : `App.tsx` (coque, routage), stockage du journal (chiffrement), écran Spécialistes, contenus S'informer.

---

## 6. Après transformation (20 novembre 2026, branche `feature/application-reelle`)

| Fonctionnalité | Résultat | Preuve |
|---|---|---|
| Accueil | Tableau de bord réel, plus de démo | e2e `navigation.spec` (absence « Explorer les écrans », largeur réelle) |
| Navigation | URL par écran, retour, onglets mobile / barre latérale desktop | e2e liens profonds + retour ; unit `routes` (22 allers-retours) |
| Sérénité | Durées, préférences persistées, volume/coupure, sans animation, sons générés | e2e `Sérénité` (persistance après rechargement) |
| Carnet | Coffre chiffré, auto-enregistrement, recherche, migration, export, effacement | unit `vault`/`carnet` ; e2e « aucun texte en clair » |
| Alerte SMS | Position sur consentement, « préparé » ≠ « envoyé » | e2e : 0 appel GPS avant clic, lien `sms:` vérifié |
| Urgence | 112 honnête, quiz 1/3, SMS 114 | e2e SOS maintenu + texte « MBT n’opère aucun service d’urgence » |
| S'informer | 8 fiches sourcées/datées + recherche | unit (sources HTTPS, dates) ; e2e recherche + sources |
| Lieux | Géoloc à la demande, définition explicite, carte réelle | e2e : 0 marqueur avant action, 3 après (données simulées) |
| Témoignages | Marqués fictifs ; soumission non proposée (backend requis) | e2e « Récits illustratifs » ; `docs/backend-schema.sql` |
| Contacts | Modifier ajouté | e2e ajout → modification → appel |
| Spécialistes | Annuaire de 15 structures vérifiées, filtres, fiches | unit (canaux valides) ; e2e filtres + fiche 3018 |
| Appel 3018 | Fiche vérifiée (tél., tchat, WhatsApp/Messenger/appli via e-Enfance), non-affiliation | e2e fiche 3018 |
| Mobile | Projets Capacitor Android/iOS ; APK debug compilé | `docs/MOBILE.md` |

Restent ouverts : backend (témoignages, SMS automatique), tests sur appareils réels, compilation iOS, relecture
professionnelle des contenus, évaluation RGPD/mineurs avant toute collecte.
