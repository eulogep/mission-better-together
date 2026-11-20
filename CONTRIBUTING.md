# Contribuer à MBT

Merci de vouloir aider ! MBT peut être utilisé par des enfants et des adolescents en situation difficile :
chaque contribution doit être **fiable, honnête et protectrice**.

## Règles d’or

1. **Rien de simulé.** Une fonctionnalité fait réellement ce qu’elle annonce, ou indique clairement qu’elle n’est pas disponible. Pas de fausse confirmation (« message envoyé », « secours prévenus »…).
2. **Aucune collecte.** Pas de traceur, pas d’analyse d’audience, pas de service tiers non indispensable. Toute nouvelle requête réseau doit être justifiée et ajoutée à la CSP (`vite.config.ts`).
3. **Rien d’automatique.** Aucun appel, SMS ou partage de position sans geste explicite de l’utilisateur.
4. **Sources officielles.** Tout numéro, horaire ou conseil doit citer une source officielle, avec la date de vérification (`src/data/articles.ts`, `src/data/structures.ts`).
5. **Ton bienveillant.** Phrases courtes, tutoiement pour les jeunes, jamais de culpabilisation.

## Démarrer

```bash
npm install
npm run dev
```

Avant d’ouvrir une pull request :

```bash
npm run check      # types + tests unitaires + build
npm run test:e2e   # parcours Playwright (Google Chrome requis)
```

## Où se trouve quoi ?

| Besoin | Fichier |
| --- | --- |
| Ajouter ou corriger un numéro | `src/data/content.ts` (services) et `src/data/structures.ts` (annuaire) |
| Ajouter une fiche « S’informer » | `src/data/articles.ts` |
| Logique métier (sans interface) | `src/lib/` |
| Nouveau module complet | `src/features/<module>/` |
| Nouvel écran / nouvelle URL | `src/app/routes.ts` puis `src/App.tsx` |

## Signaler un problème

- **Un numéro ou un lien a changé ?** Ouvre une issue avec la source officielle.
- **Une faille de sécurité ?** Ne l’expose pas publiquement : contacte le mainteneur en privé via GitHub.

En contribuant, tu acceptes que ta contribution soit publiée sous la [licence MIT](LICENSE) du projet.
