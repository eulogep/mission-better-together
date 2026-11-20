# Représenter le ressenti dans Mon arbre intérieur

Recherche consultée le 20 novembre 2026. MBT transforme un ressenti volontairement décrit en une illustration. L’objectif est de permettre à une personne d’exprimer ce qu’elle ressent sur le moment.

## Études retenues

| Étude | Méthode et résultat | Conséquence pour MBT |
| --- | --- | --- |
| [Russell, 1980](https://pdodds.w3.uvm.edu/research/papers/others/1980/russell1980a.pdf) | Quatre méthodes de classification des mots et d’analyse d’auto-évaluations soutiennent une représentation autour de deux dimensions, dont une analyse portant sur 343 auto-évaluations. | Représenter séparément le caractère agréable et l’activation ressentie. |
| [Russell, Weiss et Mendelsohn, 1989](https://emotiondevelopmentlab.weebly.com/uploads/2/5/2/0/25200250/russell_j.a._weiss_a.__mendelsohn_g.a._1989.pdf) | L’*Affect Grid* recueille une position sur deux axes en une réponse. Quatre études auprès d’étudiants examinent notamment la fidélité et la validité convergente et discriminante. | Un choix peut être rapide tout en décrivant deux aspects du ressenti. |
| [Bradley et Lang, 1994](https://pubmed.ncbi.nlm.nih.gov/7962581/) | Le *Self-Assessment Manikin* compare des réponses pictographiques sur le plaisir, l’activation et la dominance à un différentiel sémantique. L’accord est élevé pour le plaisir et l’activation dans la tâche de réponse à des images. | Les visuels peuvent soutenir un choix que la personne fait elle-même. |
| [Betella et Verschure, 2016](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0148037) | Sur 309 adultes, les moyennes par image de deux méthodes donnent des corrélations de Spearman de 0,852 pour le plaisir et de 0,860 pour l’activation. La comparaison porte sur des réponses à des images, agrégées par stimulus. | L’étude étaye le format numérique, dans son protocole. Les valeurs ne constituent pas une précision individuelle ni une validation du dispositif MBT. |
| [Walsh et al., 2024](https://journals.sagepub.com/doi/10.1177/02724316231160147) | Une étude exploratoire analyse 2 220 réponses de 58 adolescents. Le ressenti du moment varie avec le contexte social et chez une même personne. | Décrire le moment présent et permettre un changement à tout instant. |
| [Limberger et al., 2023](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2023.1061229/full) | Les analyses de 186 adolescents suivis sept jours donnent un meilleur ajustement à six facteurs qu’aux modèles plus simples testés. Plusieurs facteurs sont moins fidèles au niveau intra-individuel qu’entre personnes. | Deux axes sont un format bref d’expression visuelle. Une utilisation comme instrument psychométrique exigerait une étude spécifique, notamment sur la compréhension des libellés et la fidélité intra-individuelle. |
| [Larsen, McGraw et Cacioppo, 2001](https://leeds-faculty.colorado.edu/mcgrawp/pdf/larsen.mcgraw.cacioppo.2001.pdf) et [Larsen et McGraw, 2011](https://pubmed.ncbi.nlm.nih.gov/21219075/) | Les expériences trouvent des situations dans lesquelles des personnes rapportent simultanément de la joie et de la tristesse. | Donner une option explicite pour un ressenti à la fois agréable et désagréable, distincte du milieu de l’échelle. |

## Projets et instruments réutilisables

| Projet | Utilité | Conditions indiquées par le projet |
| --- | --- | --- |
| [AffectiveSlider](https://github.com/albertobeta/AffectiveSlider) | Implémentations et pictogrammes de deux curseurs d’auto-évaluation. Le dépôt donne les consignes nécessaires pour reproduire son instrument. | [CC BY-SA 4.0](https://github.com/albertobeta/AffectiveSlider/blob/master/LICENSE). |
| [jsPsych](https://github.com/jspsych/jsPsych) et [Online Affect Rating](https://github.com/embodied-computation-group/online-affect-rating) | jsPsych sert à créer des expériences dans le navigateur. Online Affect Rating y ajoute une grille en deux dimensions pour des mesures en continu pendant des vidéos. | Les deux dépôts indiquent une licence MIT pour le code. |
| [Geneva Emotion Wheel](https://www.unige.ch/cisa/gew?trk=public_post_comment-text) | Auto-évaluation de familles d’émotions et de leur intensité. Une version française est disponible. [Étude sur le développement de l’instrument](https://access.archive-ouverte.unige.ch/access/metadata/74e0e3a5-c1b5-478d-a363-4280fe276d5c/download) | L’Université de Genève autorise les usages de recherche non commerciaux et demande une licence pour les usages commerciaux. |
| [EmoNet](https://github.com/face-analysis/emonet) | Implémentation de recherche pour estimer valence et activation à partir d’images du visage. L’entrée est une expression visible. | Le dépôt indique CC BY-NC-ND 4.0 pour son code. |

MBT implémente son propre rendu local. L’auto-évaluation permet à la personne de décider ce qu’elle souhaite exprimer. Les résultats de Gendron et al. montrent que le contexte conceptuel et culturel influence le classement d’expressions faciales et l’interprétation de vocalisations. [Expérience sur les visages](https://pubmed.ncbi.nlm.nih.gov/24708506/) · [Expérience sur les vocalisations](https://pubmed.ncbi.nlm.nih.gov/24501109/)

## Algorithme implémenté

Dans `src/lib/affect.ts`, les niveaux sont des réponses ordinales. Les cinq choix de valence vont du désagréable à l’agréable, et les cinq choix d’activation du calme à un corps très animé. La grille de 25 points permet de placer les deux réponses ensemble, au toucher ou au clavier. Les deux listes permettent de modifier chaque axe séparément. La liste de valence propose aussi un ressenti à la fois agréable et désagréable. Ce choix reste affiché à part de la grille. L’arbre change après confirmation des deux réponses. Le parcours rapide de l’accueil reste disponible.

| Valence choisie | Ciel rendu |
| --- | --- |
| Agréable | Soleil |
| Intermédiaire | Nuages |
| Désagréable, activation basse ou intermédiaire | Pluie |
| Désagréable, activation haute | Vent |
| À la fois agréable et désagréable | Pluie et éclaircies |

L’activation ajoute de zéro à quatre traits de vent et ajuste l’oscillation à l’entrée, y compris par temps ensoleillé. Les séparations entre ambiances et les couleurs sont des choix de représentation. L’arbre a la même taille dans chaque ambiance. Les préférences de mouvement réduit désactivent l’oscillation. Le rendu calcule uniquement une scène visuelle à partir des réponses de la personne. Il ne produit aucun nom d’émotion, score clinique, probabilité ou prévision.

Le choix courant reste dans l’onglet. L’effacement manuel et le mode discret suppriment ce choix. Les fonctions pures valident la forme des réponses et le format de session. Les tests automatisés couvrent la projection des 30 combinaisons, l’ancienne valeur d’humeur et le parcours web. Ils établissent le fonctionnement logiciel. La compréhensibilité et les propriétés psychométriques de cette interface auprès du public de MBT restent à étudier.
