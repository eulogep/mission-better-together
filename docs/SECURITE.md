# Sécurité, confidentialité et protection des mineurs

MBT s'adresse en partie à des mineurs confrontés au harcèlement. Principe directeur : **collecter le moins
possible, et rien sans action explicite de l'utilisateur**.

## Données traitées

| Donnée | Où | Protection | Envoyée à un tiers ? |
| --- | --- | --- | --- |
| Carnet (récits, captures, PDF) | IndexedDB `mbt-vault` | AES-GCM 256, clé de données enveloppée avec le code (PBKDF2-SHA-256, 600 000 itérations) et, sur activation, protégée par Keystore ou Keychain | Non |
| Contacts de confiance | localStorage | En clair (accès en urgence sans code) ; sauvegarde cloud Android désactivée | Non |
| Préférences (sons, durées, profil) | localStorage | Non sensibles | Non |
| Conversation de l'assistant | sessionStorage | Effacée à la fermeture ou à la sortie rapide | Non |
| Position GPS | Mémoire, le temps d'une recherche | Demandée uniquement sur action | Nominatim ou Overpass (recherche de lieux), application de cartographie si l’utilisateur ouvre un itinéraire, application SMS si l’utilisateur ajoute des coordonnées |
| Ville saisie | Mémoire | — | Géoplateforme IGN |

Aucun compte, aucune analyse d'audience, aucun traceur, aucune police ou script tiers (police Ubuntu auto-hébergée).

## Mesures en place

- **Carnet chiffré** : chaque entrée et pièce jointe a son propre vecteur d'initialisation ; clé de données
  enveloppée par la clé dérivée du code (changement de code sans rechiffrer les données).
- **Biométrie native facultative** · L’activation vérifie le code du carnet. Android lie le déchiffrement à une opération Keystore authentifiée par biométrie forte. iOS utilise une entrée Keychain liée aux données biométriques actuellement inscrites sur l’appareil. Le code reste utilisable après modification des empreintes ou de Face ID. Les journaux du pont Capacitor sont désactivés pour éviter de journaliser la clé de session. Le déverrouillage natif reste à vérifier sur téléphone.
- **Limitation des essais** : délai croissant après 5 échecs (30 s, 60 s, …, 1 h max).
- **Verrouillage automatique** : 5 min d'inactivité, 30 s en arrière-plan, mode discret, fermeture de page.
- **Migration** des anciennes notes en clair : chiffrement → vérification de relecture → suppression des copies en clair.
- **Export** : avertissement explicite que le fichier exporté n'est pas chiffré.
- **Effacement** : « Tout effacer » (confirmation tapée) supprime la base chiffrée.
- **Sortie rapide** et **mode discret** (camouflage + verrouillage du carnet).
- **CSP stricte** en production (scripts uniquement de l'origine, liste fermée de services externes, pas d'iframe ni d'objet).
- **Aucune clé de service côté client** · Les narrations sont synthétisées localement. L’API de modération reste hors de l’application distribuée.
- **Aucune action automatique** : ni appel, ni SMS, ni partage de position sans geste de l'utilisateur ; le SOS
  nécessite un appui maintenu. Un SMS « préparé » n'est jamais présenté comme « envoyé ».
- **Honnêteté des contenus** : récits marqués fictifs, structures vérifiées et datées, mention de non-affiliation.

## Limites connues (à traiter avant un déploiement large)

| Limite | Risque | Piste |
| --- | --- | --- |
| Code court (6 chiffres) | Attaque hors ligne possible sur la clé enveloppée avec le code si quelqu'un copie le stockage | Encourager une phrase de passe. Le déverrouillage biométrique ajoute un accès protégé par Keystore ou Keychain et conserve l’accès par code. |
| Contacts en clair | Lisibles par quelqu'un qui accède au téléphone déverrouillé | Choix assumé pour l'urgence ; option future « protéger aussi mes contacts » |
| WebView et `sms:` multiples sur iOS | Destinataires multiples parfois ignorés | Tester sur appareils ; envoi un par un proposé |
| Quotas Nominatim / tuiles OSM publics | Refus de service en cas d'usage massif | Serveur de tuiles et de géocodage dédié |
| Collecte de récits inactive | Déploiement et opérateurs de modération à organiser | Voir [modération](MODERATION.md) |

## Obligations à évaluer avant la mise en production (non exhaustif — avis juridique recommandé)

- **RGPD** · La politique de confidentialité devra couvrir les appels aux services tiers. Avant une collecte de témoignages, examiner notamment le
  registre des traitements, la base légale, l’**article 8** (consentement parental pour les moins de 15 ans en France
  pour les services de la société de l'information fondés sur le consentement), **AIPD** (personnes vulnérables,
  données sensibles), hébergement UE, durée de conservation, droits d'accès/effacement.
- **Recommandations de la CNIL sur les droits numériques des mineurs** (information adaptée à l'âge, paramètres
  protecteurs par défaut).
- **Modération** des contenus publiés (témoignages) : validation humaine préalable, procédure de signalement,
  conservation des journaux sans contenu sensible.
- **Accessibilité** (RGAA) si l'éditeur est un organisme public ou une structure concernée.
