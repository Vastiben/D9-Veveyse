const WEEKDAYS_FR = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MONTHS_FR = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function dayLabel(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  return `${cap(WEEKDAYS_FR[dt.getUTCDay()])} ${d} ${MONTHS_FR[m - 1]} ${y}`;
}

function dotDate(iso) {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

/* --- Regroupement en journées : dérivé des dates, jamais stocké --- */

function assignRounds(matches) {
  const teams = new Set(matches.flatMap(m => [m.domicile, m.exterieur]));
  const perRound = teams.size / 2;
  matches.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    const ah = a.heure ?? "00:00", bh = b.heure ?? "00:00";
    if (ah !== bh) return ah < bh ? -1 : 1;
    return (a.numero ?? 0) - (b.numero ?? 0);
  });

  // Les numéros de match sont attribués par journée, en blocs consécutifs :
  // on les préfère aux dates (un match reporté change de date, pas de bloc).
  // Garde-fou : chaque équipe ne joue qu'une fois par bloc, sinon repli sur les dates.
  const numbered = matches.every(m => m.numero);
  if (numbered) {
    const base = Math.min(...matches.map(m => m.numero));
    const seen = new Map();
    let valid = true;
    matches.forEach(m => {
      const j = Math.floor((m.numero - base) / perRound) + 1;
      m.journee = j;
      const set = seen.get(j) ?? seen.set(j, new Set()).get(j);
      [m.domicile, m.exterieur].forEach(t => { if (set.has(t)) valid = false; set.add(t); });
    });
    if (valid) {
      matches.sort((a, b) => a.journee - b.journee || (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)
        || (a.heure ?? "00:00").localeCompare(b.heure ?? "00:00") || a.numero - b.numero);
      return matches;
    }
  }
  matches.forEach((m, i) => { m.journee = Math.floor(i / perRound) + 1; });
  return matches;
}

/* --- Classement --- */

function computeBase(matches, teams) {
  const base = {};
  teams.forEach(t => base[t] = { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 });
  matches.filter(m => m.statut === "termine").forEach(m => {
    const h = base[m.domicile], a = base[m.exterieur];
    h.p++; a.p++;
    h.gf += m.buts_domicile; h.ga += m.buts_exterieur;
    a.gf += m.buts_exterieur; a.ga += m.buts_domicile;
    if (m.buts_domicile > m.buts_exterieur) { h.w++; a.l++; h.pts += 3; }
    else if (m.buts_domicile < m.buts_exterieur) { a.w++; h.l++; a.pts += 3; }
    else { h.d++; a.d++; h.pts++; a.pts++; }
  });
  Object.values(base).forEach(r => r.diff = r.gf - r.ga);
  return base;
}

function allPlayedEachOther(group, matches) {
  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      const played = matches.some(m => m.statut === "termine" &&
        ((m.domicile === group[i] && m.exterieur === group[j]) ||
         (m.domicile === group[j] && m.exterieur === group[i])));
      if (!played) return false;
    }
  }
  return true;
}

function h2hPoints(team, group, matches) {
  let pts = 0;
  matches
    .filter(m => m.statut === "termine" && group.includes(m.domicile) && group.includes(m.exterieur))
    .forEach(m => {
      if (m.domicile === team) {
        if (m.buts_domicile > m.buts_exterieur) pts += 3;
        else if (m.buts_domicile === m.buts_exterieur) pts += 1;
      } else if (m.exterieur === team) {
        if (m.buts_exterieur > m.buts_domicile) pts += 3;
        else if (m.buts_domicile === m.buts_exterieur) pts += 1;
      }
    });
  return pts;
}

function buildStandings(matches) {
  const teams = [...new Set(matches.flatMap(m => [m.domicile, m.exterieur]))].sort((a, b) => a.localeCompare(b, "fr"));
  const base = computeBase(matches, teams);

  function partitionAndSort(group, level) {
    if (group.length <= 1) return group;
    let keyFn;
    if (level === 0) keyFn = t => base[t].pts;
    else if (level === 1) {
      keyFn = allPlayedEachOther(group, matches)
        ? t => h2hPoints(t, group, matches)
        : t => base[t].diff;
    }
    else if (level === 2) keyFn = t => base[t].diff;
    else if (level === 3) keyFn = t => base[t].gf;
    else return [...group].sort((a, b) => a.localeCompare(b, "fr"));

    const withKeys = group.map(t => [t, keyFn(t)]);
    const uniqueKeys = [...new Set(withKeys.map(([, k]) => k))].sort((a, b) => b - a);
    const result = [];
    uniqueKeys.forEach(k => {
      const subgroup = withKeys.filter(([, kk]) => kk === k).map(([t]) => t);
      result.push(...partitionAndSort(subgroup, level + 1));
    });
    return result;
  }

  const order = partitionAndSort(teams, 0);
  return order.map(t => ({ team: t, ...base[t] }));
}

/* --- Rendu --- */

function diffBar(diff, maxAbsDiff) {
  const wrap = document.createElement("div");
  wrap.className = "diffbar";
  const left = document.createElement("div");
  left.className = "half l";
  const axis = document.createElement("div");
  axis.className = "axis";
  const right = document.createElement("div");
  right.className = "half";
  if (diff < 0) {
    const f = document.createElement("div");
    f.className = "fill n";
    f.style.width = (Math.abs(diff) / maxAbsDiff * 100) + "%";
    left.appendChild(f);
  } else if (diff > 0) {
    const f = document.createElement("div");
    f.className = "fill p";
    f.style.width = (diff / maxAbsDiff * 100) + "%";
    right.appendChild(f);
  }
  wrap.append(left, axis, right);
  return wrap;
}

function renderStandings(standings, self) {
  const body = document.getElementById("standings");
  body.textContent = "";
  const maxAbsDiff = Math.max(...standings.map(r => Math.abs(r.diff)), 1);

  standings.forEach((r, i) => {
    const tr = document.createElement("tr");
    if (r.team === self) tr.className = "self";
    else if (r.team.startsWith("Team Veveyse")) tr.className = "veveyse";

    const rank = document.createElement("td");
    rank.className = "rank left";
    rank.textContent = i + 1;

    const team = document.createElement("td");
    team.className = "left team";
    team.textContent = r.team;
    if (r.p === 1) {
      const flag = document.createElement("span");
      flag.className = "partial";
      flag.textContent = "  1 match joué";
      team.appendChild(flag);
    } else if (r.p === 0) {
      const flag = document.createElement("span");
      flag.className = "partial";
      flag.textContent = "  aucun match joué";
      team.appendChild(flag);
    }

    const cells = [r.p, r.w, r.d, r.l, `${r.gf}:${r.ga}`, (r.diff > 0 ? "+" : "") + r.diff];

    const pts = document.createElement("td");
    pts.className = "pts";
    pts.textContent = r.pts;

    tr.append(rank, team, pts);
    cells.forEach((v, idx) => {
      const td = document.createElement("td");
      td.textContent = v;
      if (idx < 4) td.className = "thin";
      tr.appendChild(td);
    });

    const bar = document.createElement("td");
    bar.className = "diffcell";
    bar.appendChild(diffBar(r.diff, maxAbsDiff));
    tr.appendChild(bar);

    body.appendChild(tr);
  });
}

function renderStats(matches, standings, self) {
  const played = matches.filter(m => m.statut === "termine");
  const goals = played.reduce((s, m) => s + m.buts_domicile + m.buts_exterieur, 0);
  const rank = standings.findIndex(r => r.team === self) + 1;

  const items = [
    [`${rank}e`, "Rang de " + self],
    [`${played.length}/${matches.length}`, "matchs joués"],
    [goals, "buts inscrits"],
    [played.length ? (goals / played.length).toFixed(1).replace(".", ",") : "0", "buts par match"],
  ];

  const strip = document.getElementById("statStrip");
  strip.textContent = "";
  items.forEach(([n, k]) => {
    const cell = document.createElement("div");
    cell.className = "stat";
    const nn = document.createElement("span");
    nn.className = "n";
    nn.textContent = n;
    const kk = document.createElement("span");
    kk.className = "k";
    kk.textContent = k;
    cell.append(nn, kk);
    strip.appendChild(cell);
  });
}

function nameNode(team, self) {
  const span = document.createElement("span");
  if (team === self) {
    const s = document.createElement("span");
    s.className = "self";
    s.textContent = team;
    span.appendChild(s);
  } else {
    span.textContent = team;
  }
  return span;
}

function sideNode(team, self, goals, other, statut) {
  const row = document.createElement("div");
  row.className = "side";
  if (statut === "termine") {
    if (goals > other) row.classList.add("winner");
    else if (goals < other) row.classList.add("loser");
  }
  const name = document.createElement("div");
  name.className = "name";
  name.appendChild(nameNode(team, self));
  const g = document.createElement("div");
  g.className = "goals";
  if (goals === null) { g.classList.add("none"); g.textContent = "–"; }
  else g.textContent = goals;
  row.append(name, g);
  return row;
}

const STATUS_LABEL = { termine: "Terminé", score_non_saisi: "Score non saisi", a_venir: "À venir", nullwertung: "Nullwertung · non comptabilisé" };

function matchNode(m, self) {
  const card = document.createElement("article");
  card.className = "match";
  if (m.domicile === self || m.exterieur === self) card.classList.add("focus");

  const sides = document.createElement("div");
  sides.className = "sides";
  sides.append(
    sideNode(m.domicile, self, m.buts_domicile, m.buts_exterieur, m.statut),
    sideNode(m.exterieur, self, m.buts_exterieur, m.buts_domicile, m.statut)
  );
  if (m.numero) {
    const num = document.createElement("div");
    num.className = "snum";
    num.textContent = "Match n° " + m.numero;
    sides.appendChild(num);
  }

  const meta = document.createElement("div");
  meta.className = "meta";
  if (m.heure) {
    const k = document.createElement("div");
    k.className = "kick";
    k.textContent = m.heure;
    meta.appendChild(k);
  }
  const chip = document.createElement("div");
  chip.className = "chip " + m.statut;
  chip.textContent = STATUS_LABEL[m.statut];
  meta.appendChild(chip);

  card.append(sides, meta);
  return card;
}

function renderMatches(matches, self) {
  const list = document.getElementById("matchList");
  list.textContent = "";
  let currentRound = null, currentDate = null, group = null;

  matches.forEach(m => {
    if (m.journee !== currentRound) {
      currentRound = m.journee;
      currentDate = null;
      const h = document.createElement("p");
      h.className = "roundhead";
      h.textContent = "Journée " + m.journee;
      list.appendChild(h);
    }
    if (m.date !== currentDate) {
      currentDate = m.date;
      group = document.createElement("div");
      group.className = "daygroup";
      const head = document.createElement("div");
      head.className = "dayhead";
      head.textContent = dayLabel(m.date);
      group.appendChild(head);
      list.appendChild(group);
    }
    group.appendChild(matchNode(m, self));
  });
}

function renderNotes(matches) {
  const notes = document.getElementById("notes");
  const nullCount = matches.filter(m => m.statut === "nullwertung").length;
  const pendingCount = matches.filter(m => m.statut === "score_non_saisi" || m.statut === "a_venir").length;

  const paragraphs = [
    `<strong>Le classement n'est pas officiel.</strong> L'AFF-FFV ne publie volontairement
     aucun classement en Juniors D-9. Celui-ci est calculé à partir des résultats du match
     center, avec les mêmes règles de tri qu'un classement officiel.`,
  ];

  if (pendingCount > 0) {
    paragraphs.push(
      `<strong>${pendingCount} match${pendingCount > 1 ? "s" : ""} non comptabilisé${pendingCount > 1 ? "s" : ""}
       dans le classement</strong> : score non saisi ou match à venir au moment du relevé.`
    );
  }

  if (nullCount > 0) {
    paragraphs.push(
      `<strong>${nullCount} match${nullCount > 1 ? "s" : ""} en Nullwertung</strong> (« N » sur le match center) :
       ${nullCount > 1 ? "ils ne sont" : "il n'est"} pas comptabilisé${nullCount > 1 ? "s" : ""} dans le classement.`
    );
  }

  paragraphs.push(
    `Source&nbsp;: match center et widget officiels de l'Association fribourgeoise de
     football. Les numéros de match permettent de retrouver chaque rencontre à la source.`
  );

  notes.innerHTML = paragraphs.map(p => `<p>${p}</p>`).join("");
}

function render(state) {
  const self = state.competition.equipe_suivie;
  const matches = state.matches;
  assignRounds(matches);

  const c = state.competition;
  document.getElementById("title").textContent = `${c.groupe}, ${c.categorie}`;
  document.getElementById("tagClass").textContent = c.classe_de_force;
  document.getElementById("tagTeams").textContent = `${new Set(matches.flatMap(m => [m.domicile, m.exterieur])).size} équipes`;
  const link = document.getElementById("sourceLink");
  if (c.lien_source) link.href = c.lien_source; else link.hidden = true;

  const rounds = new Set(matches.map(m => m.journee));
  document.getElementById("tagRounds").textContent = rounds.size === 1 ? "1 journée" : `${rounds.size} journées`;

  const dates = matches.map(m => m.date).sort();
  document.getElementById("tagDates").textContent =
    dates[0] === dates[dates.length - 1] ? dayLabel(dates[0]) : `${dotDate(dates[0])} – ${dotDate(dates[dates.length - 1])}`;

  const played = matches.filter(m => m.statut === "termine").length;
  document.getElementById("snapshot").textContent =
    `Relevé le ${dotDate(state.derniere_maj)} sur le match center de l'AFF-FFV, pour ${self}. ` +
    `${played} match${played > 1 ? "s" : ""} sur ${matches.length} ${played > 1 ? "ont" : "a"} livré son score.`;

  document.getElementById("matchesTitle").textContent = `Les ${matches.length} matchs`;

  const standings = buildStandings(matches);
  renderStandings(standings, self);
  renderStats(matches, standings, self);
  renderMatches(matches, self);
  renderNotes(matches);
}

const SOURCE = document.body.dataset.source;
fetch(SOURCE, { cache: "no-store" })
  .then(res => res.json())
  .then(render)
  .catch(() => {
    document.getElementById("snapshot").textContent =
      `Impossible de charger ${SOURCE} — vérifie que le fichier existe bien à côté de cette page.`;
  });
