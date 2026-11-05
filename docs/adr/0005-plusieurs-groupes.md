# ADR-0005 — Plusieurs groupes : une page et un fichier de données par groupe

**Statut** : Acceptée — 2026-11-05

## Contexte

Bastien suit aussi les Juniors D-9 Degré 1 (Stärkeklasse 1, Groupe 4,
10 équipes) où joue Team Veveyse (Bossonnens), en plus du Groupe 8
(Degré 2, 16 équipes, Châtel). Le site ne gérait qu'un groupe : 16 équipes
et 8 matchs par journée codés en dur, un seul `data/matches.json`.

## Décision

- **Une page HTML mince par groupe** (`index.html` = Degré 2, conserve
  l'URL déjà partagée ; `degre-1.html` = Degré 1), reliées par une
  navigation. Chacune désigne son fichier via `data-source`.
- **Un fichier de données par groupe** : `data/degre-2.json` (ex
  `matches.json`), `data/degre-1.json`.
- **Code partagé** dans `assets/app.js` et `assets/style.css` : titre,
  nombre d'équipes, taille des journées (n/2) et lien source viennent des
  données, plus du HTML.
- **Journées** : déduites des blocs de numéros de match (chaque équipe
  une seule fois par bloc, sinon repli sur les dates). Les dates seules
  faussaient les matchs reportés (ex. 168706 joué le 30.09 mais journée 8).
- **Statut `nullwertung`** : affiché, jamais compté au classement.

## Alternatives écartées

- Une page unique avec `?groupe=` : URL moins lisible, pas d'avantage.
- Dupliquer `index.html` : deux copies de 600 lignes à garder alignées.

## Conséquences

- Un nouveau groupe = un JSON + une page de 30 lignes + une ligne dans la
  table de la skill.
- Le renommage du repo (hors périmètre de cette ADR) change l'URL GitHub
  Pages : les liens déjà partagés sont à renvoyer.
