# D9-Veveyse

Dashboards des Juniors D-9 (AFF-FFV) de Team Veveyse — Degré 2 / Groupe 8
(Châtel) et Degré 1 / Groupe 4 (Bossonnens) — hébergés sur GitHub Pages
(ADR-0004, ADR-0005). Voir `README.md` pour la structure et
`CONTEXT.md` pour le vocabulaire du domaine.

## Règles qui ne se discutent pas

- **Toujours en français.**
- **Aucun jugement ni recommandation** dans `index.html` (niveau d'une
  équipe, opportunité d'inscription en division supérieure). La page
  documente des faits — classement et scores — jamais un avis.
- **Jamais d'accès automatisé** au match center ou au widget AFF-FFV
  (interdit explicitement par la fédération — voir `CONTEXT.md`). Les
  données arrivent uniquement par captures d'écran envoyées par Bastien.
- Un fichier de données par groupe (`data/degre-2.json`, `data/degre-1.json`)
  = seule source de vérité, chargée par `fetch` à chaque visite — jamais de
  copie embarquée dans les pages. Une page HTML par groupe, code partagé dans
  `assets/`.

## Mise à jour depuis des captures d'écran

Skill `mettre-a-jour-classement` (`.claude/skills/`) : se déclenche
automatiquement dès réception d'images du calendrier ou des résultats d'un
groupe (elle détermine le groupe d'après l'en-tête de la capture). Met à jour le
fichier de données concerné et pousse sur `main` — GitHub Pages
sert la nouvelle version sans autre étape.
