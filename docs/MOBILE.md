# Applications Android et iOS (Capacitor)

MBT est une application web (React + Vite) empaquetée dans des applications natives avec **Capacitor 8**.
Le même code sert au web, à Android et à iOS. Rien n'est publié sur les stores à ce stade.

## Prérequis

| Plateforme | Outils |
| --- | --- |
| Android | Android Studio (SDK 35+), JDK 21 recommandé |
| iOS | macOS + Xcode 16+ (Swift Package Manager, pas de CocoaPods) |

## Cycle de travail

```bash
npm run build          # produit dist/
npx cap sync           # copie dist/ dans android/ et ios/ + met à jour les plugins
npx cap open android   # ouvre Android Studio (lancer sur émulateur ou téléphone)
npx cap open ios       # ouvre Xcode
```

Commandes équivalentes : `npm run mobile:sync`, `npm run mobile:android`, `npm run mobile:ios`.

## Ce qui est déjà configuré

| Sujet | Android | iOS |
| --- | --- | --- |
| Identifiant | `fr.missionbettertogether.mbt` (à confirmer avec le compte développeur) | idem |
| Contexte sécurisé (WebCrypto, géolocalisation) | `androidScheme: https` | natif |
| Localisation « pendant l'utilisation » uniquement | `ACCESS_COARSE/FINE_LOCATION` (demandée au premier usage) | `NSLocationWhenInUseUsageDescription` |
| Appels / SMS (`tel:`, `sms:`) | `<queries>` Android 11+ ; Capacitor ouvre les intents externes | `LSApplicationQueriesSchemes` |
| Sauvegarde cloud automatique | **désactivée** (`allowBackup=false`) : les contacts (en clair) ne partent pas dans la sauvegarde Google | à réévaluer (sauvegarde iCloud des données de l'app) |
| Aperçu des applis récentes / captures | **masqué** (`FLAG_SECURE`) | à ajouter (masquage à la mise en arrière-plan) |
| Zones sûres (encoche, barre de geste) | `viewport-fit=cover` + `env(safe-area-inset-*)` dans la mise en page | idem |
| Hors ligne | l'application est servie localement depuis l'appareil | idem |

## À faire avant une publication

1. **Icônes et écran de démarrage** natifs : `npx @capacitor/assets generate` à partir de `public/icons/icon-512.png`.
2. **Signature** : Android → keystore de publication (ne jamais le committer) ; iOS → certificats et profils de l'équipe Apple.
3. **Fiches des stores** : catégorie, classification d'âge (contenu sensible : harcèlement, suicide), politique de confidentialité publique, déclaration des données (Google « Sécurité des données », Apple « Étiquettes de confidentialité » : *aucune donnée collectée* tant qu'il n'y a pas de backend).
4. **Tests sur appareils réels** : appels, SMS (iOS ne permet pas de pré-remplir plusieurs destinataires de façon fiable), géolocalisation refusée/acceptée, mode avion, petites tailles d'écran.
5. Plugins natifs à envisager si le besoin est confirmé :
   - `@capacitor/share` (partage de fichiers plus fiable que l'API web dans les WebView) ;
   - stockage sécurisé / biométrie pour déverrouiller le carnet (Keychain / Keystore) ;
   - `@capacitor/haptics` pour des vibrations sur iOS (l'API web `navigator.vibrate` n'existe pas sur iOS).
6. **Notifications** : volontairement absentes. Une notification sur l'écran verrouillé peut révéler l'usage de l'app : à n'ajouter qu'avec un contenu neutre et sur demande explicite.

## État vérifié (20 novembre 2026)

- Projet Android généré et configuré. Compilation : voir le README (résultat de `./gradlew assembleDebug`).
- Projet iOS généré (Swift Package Manager) ; **non compilé** : Xcode n'est pas installé sur la machine de développement.
