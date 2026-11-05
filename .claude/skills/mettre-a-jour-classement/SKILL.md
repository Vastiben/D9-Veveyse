---
name: mettre-a-jour-classement
description: Traite des captures d'écran du match center ou du widget AFF-FFV pour les groupes Juniors D-9 suivis (Groupe 8 / Degré 2 avec Châtel ; Groupe 4 / Degré 1 avec Bossonnens) et met à jour le dashboard correspondant. Se déclenche dès que Bastien envoie une ou plusieurs images du calendrier ou des résultats d'un groupe — même en vrac, même avec des chevauchements entre captures consécutives.
---

# Mettre à jour le classement d'un groupe

Deux groupes suivis — **identifier le groupe d'après l'en-tête de la capture**
(ou demander si elle n'en montre pas) :

| En-tête de la capture                              | Fichier de données   | Page            |
|----------------------------------------------------|----------------------|-----------------|
| Juniors D-9 · Stärkeklasse 2 · Gruppe 8            | `data/degre-2.json`  | `index.html`    |
| Juniors D-9 · Stärkeklasse 1 · Gruppe 4            | `data/degre-1.json`  | `degre-1.html`  |

Les pages sont hébergées sur GitHub Pages et chargent leur fichier de données
par `fetch` à chaque visite (voir ADR-0004) : mettre à jour ce fichier et
le pousser sur `main` suffit, la page se met à jour toute seule — pas de
republication à faire.

Chaque capture montre une portion du calendrier du widget officiel, avec des
chevauchements fréquents entre captures consécutives (le bas de l'une est le
haut de la suivante). Le numéro de match (Spielnummer) est la clé de
déduplication : une même rencontre ne doit jamais apparaître deux fois dans
le fichier de données du groupe.

## Étapes

1. **Extraire** de chaque capture, pour chaque rencontre visible : date au
   format ISO `AAAA-MM-JJ`, numéro de match, équipe domicile, équipe
   extérieur, score si joué, heure de coup d'envoi si affichée.
   **Renommer** les équipes Team Veveyse au passage — les captures
   affichent le numéro de club, le fichier de données du groupe le nom du village :

   | Groupe | Vu sur la capture          | Écrit dans les données     |
   |--------|----------------------------|----------------------------|
   | 8      | Team Veveyse (5076) b      | Team Veveyse (Semsales)    |
   | 8      | Team Veveyse (5014) c      | Team Veveyse (Châtel)      |
   | 8      | Team Veveyse (5008) b      | Team Veveyse (Bossonnens)  |
   | 4      | Team Veveyse (5008) a      | Team Veveyse (Bossonnens)  |
   | 4      | Team Veveyse (5047) q      | Team Veveyse (CSP)         |

   (Groupe 4 : les « a » de Team Veveyse sont Bossonnens, les autres CSP —
   précision de Bastien, 2026-11-05.) Une équipe inconnue : demander, ne
   pas deviner.

   Ne jamais écrire la forme numérotée dans les données : sinon la même
   équipe apparaît deux fois au classement.

   **Nullwertung** (« N » sur la capture, ligne en noir sans icône de
   feuille de match) : `statut: "nullwertung"`, buts 0/0 — affiché mais jamais
   compté au classement.

2. **Dédupliquer** par numéro de match. Pour une rencontre sans numéro (pas
   encore commencée), dédupliquer par le triplet (date, domicile, extérieur)
   — si un numéro lui est attribué plus tard, il vient compléter cette même
   entrée, jamais en créer une nouvelle.

3. **Fusionner** dans le fichier de données du groupe :
   - nouvelles rencontres → ajoutées ;
   - rencontres déjà connues dont le score vient d'être saisi → mises à
     jour, `statut` passe à `"termine"`.
   - Pas de champ `journee` à assigner : la page le déduit elle-même (blocs
     de numéros de match, repli sur les dates — voir CONTEXT.md).

4. Mettre à jour `derniere_maj` (du fichier concerné) à la date du traitement.

5. **Committer et pousser** le fichier de données sur `main`, message de
   commit décrivant les rencontres ajoutées. Rien d'autre à toucher :
   les pages ne contiennent pas les données.

   Si l'environnement impose de développer sur une branche dédiée (ex.
   Claude Code on the web qui fixe une branche `claude/...`), committer
   là puis fusionner (fast-forward) cette branche dans `main` et pousser
   `main` dans la foulée, sans redemander confirmation — c'est `main` qui
   sert GitHub Pages, donc l'étape ne peut pas s'arrêter à la branche de
   travail. Cette autorisation vaut spécifiquement pour ce skill (données
   du dashboard, pas de code) ; elle ne s'étend à aucune autre tâche.

Terminé quand : chaque numéro de match n'apparaît qu'une fois dans
le fichier de données, et le total de rencontres correspond au cumul
réellement vu dans les captures (pas de perte au recoupement des
chevauchements).

## Invariants de la page (à ne jamais réintroduire)

- **Aucun jugement ni recommandation** dans le contenu (pas de verdict sur
  une inscription en division supérieure, pas de commentaire sur le niveau
  d'une équipe). La page montre le classement et les scores, point.
- **Tri du classement** : points, puis confrontation directe entre équipes
  à égalité de points (calculée uniquement sur les rencontres jouées entre
  elles), puis différence de buts, puis buts marqués. Départage final
  alphabétique si tout est encore égal (convention d'affichage, pas une
  règle du règlement).
- **Tout le texte de la page est en français.**
- Le classement n'est pas officiel : l'AFF-FFV n'en publie pas en Juniors
  D-9. Le dire dans les notes méthodologiques de la page, ne pas le
  cacher.
