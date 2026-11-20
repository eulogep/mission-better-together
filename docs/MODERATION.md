# Backend de modération des témoignages

La [migration Supabase](../supabase/migrations/20261120182344_moderated_testimonies.sql) crée un service de modération dans PostgreSQL. L’app distribuée utilise ses huit récits illustratifs. Elle n’envoie aucun témoignage à ce service.

## Parcours du service

| Action | Interface | Accès |
| --- | --- | --- |
| Déposer un texte après confirmation | `mbt_submit_testimony` | Serveur de collecte avec rôle `service_role` |
| Consulter les dépôts en attente | `mbt_testimony_review_queue` | Compte de modération actif avec MFA |
| Proposer un titre et un texte anonymisés | `mbt_review_testimony`, action `propose` | Compte de modération actif avec MFA |
| Approuver ou rejeter la version affichée | `mbt_review_testimony`, actions `approve` et `reject` | Compte de modération actif avec MFA |
| Lire les publications | `mbt_published_testimonies`, en lecture seule | Rôles `anon` et `authenticated` |
| Retirer une contribution | `mbt_withdraw_testimony`, identifiant et jeton | Serveur de collecte avec rôle `service_role` |
| Retirer une publication après signalement | `mbt_review_testimony`, action `unpublish`, `p_revision: null` | Compte de modération actif avec MFA |
| Purge des dépôts et de l’audit | `mbt_purge_testimonies` | Tâche quotidienne à programmer côté serveur |

La soumission reçoit un titre et un texte brut. Le reçu contient un identifiant et un jeton de retrait remis une fois à l’auteur. La base conserve le hachage du jeton. Le collecteur devra éviter les journaux d’URL ou de corps qui contiendraient le texte ou le jeton.

La proposition remplace le titre et le texte par une version relue et augmente le numéro de révision. Elle annule les approbations précédentes. Deux personnes actives doivent confirmer la même version. À la publication, seule la version relue est conservée comme texte. L’audit contient l’identifiant du dossier, l’action, la date et, pour une action de modération, l’identifiant du compte. La purge supprime les dépôts en attente depuis 30 jours, les dépôts rejetés ou retirés depuis 30 jours et les événements d’audit de plus de 90 jours.

## Vérification et mise en service

- Exécuter la migration dans une instance Supabase de test en laissant `mbt_moderation` hors des schémas exposés. Utiliser des comptes nominatifs dans Supabase Auth et inscrire leurs identifiants dans `mbt_moderation.moderators` par une connexion d’administration. Tester l’authentification multifacteur avec un vrai jeton MFA.
- Exécuter [le scénario de test SQL](../tests/sql/moderated-testimonies.sql) avec une connexion d’administration locale, par exemple `psql "$MBT_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/sql/moderated-testimonies.sql`. Les données fictives sont créées et annulées dans la même transaction.
- Répéter les essais via Data API sous chaque rôle. Vérifier la présence des autorisations explicites, l’absence du schéma privé dans l’API et la suppression de la publication après retrait. Lancer l’analyse des droits puis configurer la purge quotidienne.
- Préparer avant ouverture le formulaire séparé du carnet, la limitation de débit et le contrôle anti-abus au serveur, le signalement des contenus et un contact de modération. Valider avec l’équipe responsable le périmètre d’âge, la base légale, l’information adaptée aux mineurs, la conservation et l’exercice des droits. La confirmation technique de dépôt ne vaut pas validation de la base légale.
- Demander à la modération de retirer les noms propres, établissements, dates précises, pseudonymes réutilisés, coordonnées et détails dont la combinaison pourrait permettre une réidentification. Orienter les situations urgentes vers les circuits d’aide prévus. Préparer horaires, escalade, délais de réponse et gestion des signalements.

**État local** · Le scénario SQL passe avec PostgreSQL 18.7 embarqué (PGlite), rôles et déclarations JWT de test, avec de fausses données. Le déploiement Supabase, les essais Auth/Data API et la tâche planifiée restent à réaliser sur le projet retenu.
