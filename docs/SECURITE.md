# Sécurité, confidentialité et protection des mineurs

MBT s'adresse en partie à des mineurs confrontés au harcèlement. Principe directeur : **collecter le moins
possible, et rien sans action explicite de l'utilisateur**.

## Données traitées

| Donnée | Où | Protection | Envoyée à un tiers ? |
| --- | --- | --- | --- |
| Carnet (récits, captures, PDF) | IndexedDB `mbt-vault` | AES-GCM 256, clé dérivée du code (PBKDF2-SHA-256, 600 000 itérations), clé en mémoire uniquement | Non |
| Contacts de confiance | localStorage | En clair (accès en urgence sans code) ; sauvegarde cloud Android désactivée | Non |
| Préférences (sons, durées, profil) | localStorage | Non sensibles | Non |
| Conversation de l'assistant | sessionStorage | Effacée à la fermeture ou à la sortie rapide | Non |
| Position GPS | Mémoire, le temps d'une recherche | Demandée uniquement sur action | Nominatim/OpenStreetMap (recherche de lieux) ; incluse dans un SMS seulement si l'utilisateur l'ajoute |
| Ville saisie | Mémoire | — | Géoplateforme IGN |

Aucun compte, aucune analyse d'audience, aucun traceur, aucune police ou script tiers (police Ubuntu auto-hébergée).

## Mesures en place

- **Carnet chiffré** : chaque entrée et pièce jointe a son propre vecteur d'initialisation ; clé de données
  enveloppée par la clé dérivée du code (changement de code sans rechiffrer les données).
- **Limitation des essais** : délai croissant après 5 échecs (30 s, 60 s, …, 1 h max).
- **Verrouillage automatique** : 5 min d'inactivité, 30 s en arrière-plan, mode discret, fermeture de page.
- **Migration** des anciennes notes en clair : chiffrement → vérification de relecture → suppression des copies en clair.
- **Export** : avertissement explicite que le fichier exporté n'est pas chiffré.
- **Effacement** : « Tout effacer » (confirmation tapée) supprime la base chiffrée.
- **Sortie rapide** et **mode discret** (camouflage + verrouillage du carnet).
- **CSP stricte** en production (scripts uniquement de l'origine, liste fermée de services externes, pas d'iframe ni d'objet).
- **Pas de secret dans le code client** (vérifié) ; la clé ElevenLabs n'est utilisée que par un script local hors application.
- **Aucune action automatique** : ni appel, ni SMS, ni partage de position sans geste de l'utilisateur ; le SOS
  nécessite un appui maintenu. Un SMS « préparé » n'est jamais présenté comme « envoyé ».
- **Honnêteté des contenus** : récits marqués fictifs, structures vérifiées et datées, mention de non-affiliation.

## Limites connues (à traiter avant un déploiement large)

| Limite | Risque | Piste |
| --- | --- | --- |
| Code court (6 chiffres) | Attaque hors ligne possible si quelqu'un copie le stockage de l'appareil | Encourager une phrase de passe ; sur mobile, clé protégée par Keystore/Keychain + biométrie |
| Contacts en clair | Lisibles par quelqu'un qui accède au téléphone déverrouillé | Choix assumé pour l'urgence ; option future « protéger aussi mes contacts » |
| WebView et `sms:` multiples sur iOS | Destinataires multiples parfois ignorés | Tester sur appareils ; envoi un par un proposé |
| Quotas Nominatim / tuiles OSM publics | Refus de service en cas d'usage massif | Serveur de tuiles et de géocodage dédié |
| Pas de backend | Pas de modération ni de soumission de témoignages | Voir ARCHITECTURE.md §5 et `backend-schema.sql` |

## Obligations à évaluer avant la mise en production (non exhaustif — avis juridique recommandé)

- **RGPD** : aujourd'hui aucune donnée personnelle n'est traitée par l'éditeur (tout reste sur l'appareil),
  mais une politique de confidentialité publique reste nécessaire (stores). Dès qu'un backend existe :
  registre des traitements, base légale, **article 8** (consentement parental pour les moins de 15 ans en France
  pour les services de la société de l'information fondés sur le consentement), **AIPD** (personnes vulnérables,
  données sensibles), hébergement UE, durée de conservation, droits d'accès/effacement.
- **Recommandations de la CNIL sur les droits numériques des mineurs** (information adaptée à l'âge, paramètres
  protecteurs par défaut).
- **Modération** des contenus publiés (témoignages) : validation humaine préalable, procédure de signalement,
  conservation des journaux sans contenu sensible.
- **Accessibilité** (RGAA) si l'éditeur est un organisme public ou une structure concernée.
