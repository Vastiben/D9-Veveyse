# Contexte — D9-Chatel

Suivi de deux groupes Juniors D-9 (AFF-FFV) pour Team Veveyse : Degré 2 /
Groupe 8 (Châtel) et Degré 1 / Groupe 4 (Bossonnens) — calendrier, résultats, et un classement calculé puisque la fédération n'en
publie pas dans cette catégorie.

## Vocabulaire

- **Noms des équipes Team Veveyse** : l'AFF-FFV les affiche avec le
  numéro de club — (5076) b, (5014) c, (5008) b en Groupe 8 ; (5008) a,
  (5047) q en Groupe 4. Dans les données et sur la page, on écrit le
  village : Team Veveyse (Semsales), (Châtel), (Bossonnens), (CSP). La conversion se fait à chaque
  mise à jour (skill `mettre-a-jour-classement`).
- **AFF-FFV** : Association fribourgeoise de football, fédération qui gère
  le championnat.
- **Degré 1 / Degré 2** : traduction de Stärkeklasse 1 / 2, niveau de force
  au sein des Juniors D-9.
- **Groupe 8** (Degré 2, 16 équipes, suivi : Châtel) et **Groupe 4**
  (Degré 1, 10 équipes, suivi : Bossonnens) : les deux poules suivies ici.
- **Nullwertung** (« N ») : match annulé côté AFF-FFV, non comptabilisé au
  classement. Statut `nullwertung`.
- **Journée** : un cycle de matchs où chaque équipe du groupe joue une fois
  (n/2 rencontres). Les journées ne sont pas numérotées par l'AFF-FFV. Les
  pages les déduisent : les numéros de match sont attribués par journée en
  blocs consécutifs (journée = (numéro − plus petit numéro) / (n/2)), ce qui
  résiste aux matchs reportés ; si un numéro manque ou qu'une équipe joue
  deux fois dans un bloc, repli sur un découpage par date en tranches de n/2.
  Jamais stocké dans les données, recalculé à l'affichage.
- **Spielnummer / numéro de match** : identifiant unique de chaque
  rencontre côté AFF-FFV. Sert de clé pour dédupliquer les rencontres vues
  sur plusieurs captures d'écran qui se chevauchent.
- **Statuts d'une rencontre** : `termine` (score saisi), `score_non_saisi`
  (coup d'envoi passé, score pas encore entré côté AFF-FFV),
  `a_venir` (pas encore commencée).
- **Classement calculé** : reconstitué à partir des scores, avec le même
  ordre de critères qu'un classement officiel — points, confrontation
  directe, différence de buts, buts marqués — mais ce n'est pas un document
  de la fédération. Voir `docs/adr/0001-classement-calcule.md`.
- **Confrontation directe** : au sein d'un groupe d'équipes à égalité de
  points, les points gagnés uniquement dans les rencontres jouées entre
  elles (pas l'ensemble de leurs matchs). Ne s'applique que si toutes les
  équipes du groupe se sont déjà affrontées entre elles — en cours de
  ronde, un groupe est souvent incomplet (une équipe pas encore opposée
  aux autres), et appliquer quand même la confrontation directe la
  pénaliserait injustement avec un score de 0. Dans ce cas, `index.html`
  passe directement à la différence de buts pour tout le groupe.

## Portée

- **Dans le périmètre** : les Groupes 8 et 4, ronde d'automne 2026, calendrier et
  scores, classement calculé.
- **Hors périmètre** : tout jugement ou recommandation sur le niveau d'une
  équipe ou une éventuelle inscription en division supérieure — ce repo
  documente des faits, pas des avis.

## Source des données — pourquoi c'est manuel

Le match center (`matchcenter.aff-ffv.ch`) et le service de widgets
(`widget.football.ch`) de l'ASF/SFV bloquent explicitement l'accès
automatisé : une requête machine reçoit un message indiquant que l'accès
est interdit et renvoie vers `clubservices@football.ch` pour toute demande
d'accès aux données. Ce repo respecte cette règle — **aucun scraping,
aucun accès programmatique**. Une personne prend toujours la capture
d'écran ; c'est l'étape ensuite (lecture de l'image, mise à jour du
classement) qui est automatisée.

Si un accès autorisé aux données est un jour obtenu (voir la demande à
`clubservices@football.ch`), cette contrainte disparaît et la capture
d'écran elle-même devient inutile — à documenter dans un nouvel ADR le cas
échéant.

## Un seul chemin de mise à jour

La page est hébergée sur GitHub Pages (ADR-0004), pas sur un Artifact
Claude : un Artifact partagé publiquement ne peut déclarer aucune capacité
runtime et reste figé sur une version précise à chaque republication
(constaté et documenté en ADR-0002/0003 avant d'abandonner cette voie).
un fichier `data/degre-N.json` par groupe est la source de vérité (ADR-0005) ;
chaque page le charge par `fetch` à chaque visite. Mise à jour via la skill
`mettre-a-jour-classement` dans une session Claude Code — voir
`README.md`.
