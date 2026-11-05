# D9-Veveyse

Calendriers et classements calculés des Juniors D-9 (AFF-FFV) de Team Veveyse :
Degré 2 / Groupe 8 (Châtel) et Degré 1 / Groupe 4 (Bossonnens).

**Dashboards publiés** :
- Degré 2 · Groupe 8 : https://vastiben.github.io/D9-Veveyse/
- Degré 1 · Groupe 4 : https://vastiben.github.io/D9-Veveyse/degre-1.html

## Architecture

```mermaid
flowchart TD
    A["Bastien prend une capture d'écran\ndu widget / match center AFF-FFV"] --> B["Envoyée dans une session\nClaude Code ouverte sur ce repo"]
    B --> C{{"Skill mettre-a-jour-classement\nse déclenche automatiquement"}}
    C --> D["Extraction des rencontres +\ndédoublonnage par numéro de match"]
    D --> E["Fusion dans\ndata/degre-N.json"]
    E --> F["git commit + push sur main"]
    F --> G["GitHub Pages sert index.html"]
    G --> H["la page du groupe charge\nson data/degre-N.json par fetch"]
    H --> I["Classement calculé + calendrier\naffichés, à jour, publics"]
    I -. à chaque visite, sans republication .-> G
```

Une donnée source par groupe (`data/degre-N.json`), une page par groupe qui la
lit, un code commun (`assets/`), une seule skill qui les met à jour. Rien d'autre à
synchroniser.

## Skills et agents créés pour ce projet

- **1 skill** : `.claude/skills/mettre-a-jour-classement/` — décrite plus
  bas. Se déclenche seule dès qu'une capture d'écran arrive dans une
  session ouverte sur ce repo.
- **0 agent** : le flux (extraire → dédupliquer → fusionner → pousser) est
  une seule séquence sans étape parallélisable ni besoin d'isolation — une
  skill suffit, un agent séparé n'aurait rien apporté.

## Historique — comment on est arrivés là

Deux architectures essayées puis abandonnées avant celle-ci, chacune
documentée dans son ADR :

1. **Artifact Claude auto-actualisé** (ADR-0002) : la page lisait une
   capture et se republiait elle-même. Abandonné : incompatible avec le
   partage public (aucune capacité runtime n'est autorisée sur un artifact
   public).
2. **Artifact Claude statique** (ADR-0003) : plus de mise à jour depuis la
   page, mais un artifact public s'est révélé **figé sur une version
   précise** dès le premier partage, sans moyen de le faire suivre la
   dernière version tout en restant public. Repéré en pratique : la femme
   de Bastien voyait une version obsolète dès sa toute première ouverture
   du lien.
3. **GitHub Pages** (ADR-0004, actuelle) : plus de version à figer, plus
   de lien à refaire — voir le schéma ci-dessus.

Détail complet de chaque décision dans `docs/adr/`.

## Structure

- `index.html` (Degré 2) et `degre-1.html` (Degré 1) — pages minces,
  hébergées par GitHub Pages (ADR-0004). Chacune charge son fichier de
  données par `fetch` à chaque visite (attribut `data-source`).
- `assets/app.js`, `assets/style.css` — logique (classement, journées,
  rendu) et style partagés (ADR-0005).
- `data/degre-2.json`, `data/degre-1.json` — sources de vérité.
- `CONTEXT.md` — vocabulaire du domaine et portée du projet.
- `docs/adr/` — décisions structurantes : ADR-0001 (calcul du classement,
  saisie manuelle), ADR-0002 et ADR-0003 (mise à jour depuis un Artifact
  Claude — tentée puis abandonnée), ADR-0004 (hébergement GitHub Pages), ADR-0005 (plusieurs groupes).
- `.claude/skills/mettre-a-jour-classement/` — la skill qui traite les
  captures d'écran envoyées par Bastien et met à jour les données.

## Mettre à jour le dashboard

Envoyer à une session Claude Code ouverte sur ce repo une ou plusieurs
captures d'écran du widget ou du match center AFF-FFV pour l'un des groupes —
en vrac, chevauchements entre captures inclus. La skill
`mettre-a-jour-classement` se déclenche automatiquement, met à jour
le fichier de données du groupe et pousse sur `main` — la page se met à jour toute
seule à la prochaine visite, aucune republication à faire.

## Pourquoi c'est manuel

L'accès automatisé au match center et au widget de l'ASF/SFV est
explicitement interdit par la fédération (message de blocage renvoyant
vers `clubservices@football.ch`). Ce projet ne le contourne pas — voir
`CONTEXT.md` § Source des données.
