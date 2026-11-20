# Android et iOS

MBT embarque le build React dans Capacitor 8. Les parcours du carnet, de l’atelier et des récits fonctionnent avec les fichiers intégrés à l’application.

| Plateforme | Environnement |
| --- | --- |
| Android | JDK 21, SDK 36, cible API 36, minimum API 24. Biométrie forte à partir d’Android 11. |
| iOS | Xcode 26 ou ultérieur et SDK accepté par App Store Connect. Dépendances résolues avec Swift Package Manager. |

```bash
npm ci
npm run mobile:sync
npm run mobile:android
npm run mobile:ios
```

## État vérifié le 20 novembre 2026

| Vérification | Android | iOS |
| --- | --- | --- |
| Génération | `assembleDebug` et `bundleRelease` réussis avec JDK 21. APK de debug et AAB non signé. | Syntaxe Swift et fichiers projet/plist vérifiés. Compilation requiert Xcode, absent de cette machine. |
| Appareil réel | Aucun appareil retourné par `adb devices -l`. Appels, SMS, GPS et biométrie en attente. | Aucun essai sur iPhone. |
| Publication | Signature de distribution et dépôt Play Console en attente. | Archive, signature et dépôt App Store Connect en attente. |

- APK installable pour les essais · [Télécharger MBT pour Android](https://github.com/eulogep/mission-better-together/releases/download/v1.0.0-beta.1/MBT-Android-v1.0.0-beta.1.apk). Le build local est disponible à `android/app/build/outputs/apk/debug/app-debug.apk`.
- Bundle à signer avec la clé d’import Google Play · `android/app/build/outputs/bundle/release/app-release.aab`.
- Identifiant configuré · `fr.missionbettertogether.mbt` sur les deux plateformes. Vérifier sa disponibilité dans les comptes éditeurs.

## Protocole sur appareils réels

Installer la build sur un Android et un iPhone. Pour chaque ligne, relever le modèle, l’OS, la version de l’app, l’état initial de l’autorisation, le résultat et l’heure de l’essai. Utiliser uniquement des contacts et notes de test. Pour les numéros d’urgence, contrôler les libellés et cibles sans déclencher la communication.

| Parcours | Manipulation et observation attendue |
| --- | --- |
| Téléphone | Ajouter un contact de test joignable, appuyer sur « Appeler », vérifier la destination dans le composeur ou la boîte système, puis annuler. Vérifier qu’un appui bref sur SOS n’ouvre pas le composeur. |
| SMS | Préparer un message de test vers un contact de test. Vérifier le numéro, le texte et les caractères accentués dans la messagerie, puis annuler. Refaire avec plusieurs destinataires et vérifier le parcours un par un sur iOS si le système ignore la liste. |
| Localisation refusée | À la première utilisation, refuser la permission. Vérifier le retour explicite, la recherche par ville et l’accès aux liens d’aide. Refaire côté SMS en laissant le message sans coordonnées. |
| Localisation accordée | Sur installation neuve, vérifier que la permission est demandée au geste. Tester la localisation approximative si disponible, puis précise. Révoquer la permission dans les réglages et retester. |
| Biométrie | Sur appareil personnel avec verrouillage système, créer une note fictive. Activer dans « Sécurité du carnet » avec le code, verrouiller, ouvrir avec la biométrie, puis répéter en annulant. Changer le code, ajouter une empreinte ou réinitialiser Face ID et vérifier que le code ouvre encore la note. Reconfigurer, désactiver, réactiver puis confirmer l’effacement complet. |
| Confidentialité | Mettre le carnet en arrière-plan, observer l’aperçu multitâche, revenir après 30 secondes et vérifier le verrouillage. Vérifier le mode discret et la sortie rapide. Contrôler la sauvegarde et la restauration iOS avec des contacts fictifs. |
| Mode avion | Ouvrir le carnet et lancer une narration française. Vérifier les commandes et sous-titres. Confirmer que la carte signale l’indisponibilité du réseau. |

Sur Android, l’APK déclare les permissions de localisation et de biométrie. Il ne déclare ni appel direct, ni envoi de SMS, ni localisation en arrière-plan. Les captures et l’aperçu sont masqués par `FLAG_SECURE`. Sur iOS, l’app ajoute un cache visuel à l’arrière-plan. Le comportement de ce cache et des sauvegardes iOS doit être observé avant de les décrire sur la fiche du store.

## Préparation de publication

**Titre** · MBT – Mission Better Together

**Description courte** · Des ressources pour reconnaître le harcèlement, en parler et trouver de l’aide.

**Description** · MBT propose des fiches, des récits illustratifs et des exercices pour réfléchir à ce que l’on peut faire face au harcèlement. Prépare tes mots, retrouve des contacts d’aide et conserve des notes dans un carnet chiffré sur ton appareil. Une partie des ressources est disponible hors ligne.

1. Confirmer les comptes éditeurs et l’identifiant. Signer l’AAB avec la clé d’import confiée au titulaire du compte. Pour iOS, synchroniser, archiver dans Xcode avec l’équipe de signature validée, puis tester la distribution avec TestFlight. [Exigences Apple](https://developer.apple.com/news/upcoming-requirements/), [API cible Google Play](https://support.google.com/googleplay/android-developer/answer/11926878).
2. Préparer les captures provenant des builds mobiles, les textes de la fiche et l’URL publique de confidentialité. Choisir la classification et le public à partir du contenu réel de la version, notamment les références à la violence, au harcèlement et à la détresse. Renseigner le support avec les coordonnées de l’éditeur.
3. Établir les déclarations de données sur la version distribuée. Inventorier les requêtes cartographiques, les services de géocodage et l’envoi volontaire de coordonnées à une appli SMS. Vérifier les pratiques des tiers avant de répondre aux questionnaires Google Play et Apple. [Données Apple](https://developer.apple.com/app-store/app-privacy-details/), [Sécurité des données Google Play](https://support.google.com/googleplay/android-developer/answer/10787469).
4. Tester les parcours ci-dessus et intégrer la [relecture par des professionnels](RELECTURE-ENFANCE.md). Google demande, pour certains nouveaux comptes personnels, un test fermé avec au moins 12 testeurs inscrits sans interruption pendant 14 jours avant la demande d’accès à la production. [Conditions Google Play](https://support.google.com/googleplay/android-developer/answer/14151465).
5. Si la collecte de récits est activée dans une version ultérieure, renseigner les pratiques de collecte de cette version et intégrer l’anti-abus, le signalement et le contact de modération avant soumission. [Règles de l’App Store](https://developer.apple.com/app-store/review/guidelines/), [règles Google Play](https://support.google.com/googleplay/android-developer/answer/9876937).

## Texte de confidentialité à finaliser

MBT fonctionne sans compte. Le carnet et ses pièces jointes sont chiffrés sur l’appareil. Les contacts ajoutés dans MBT et les préférences sont stockés localement. La biométrie du carnet, si elle est activée, est traitée par le système du téléphone. Les récits illustratifs sont fournis avec l’app. Cette version ne reçoit pas de témoignages.

Quand tu recherches des lieux d’aide à proximité, les services cartographiques reçoivent une requête liée à la zone recherchée. Pour une recherche par ville, le texte saisi est transmis au service de géocodage. Si tu ajoutes ta position à un SMS, les coordonnées sont insérées dans le brouillon de l’application de messagerie. Le système du téléphone gère l’appel et l’envoi.

Tu peux effacer tes notes et pièces jointes depuis « Sécurité du carnet » et retirer l’autorisation de localisation dans les réglages du téléphone. Les rapports exportés sont conservés à l’endroit que tu choisis.

Avant de publier ce texte, indiquer le responsable éditorial, le contact de confidentialité et les informations complètes sur les prestataires. Vérifier les données de sauvegarde sur iOS et publier la version finale à une URL HTTPS accessible depuis la fiche et l’app.
