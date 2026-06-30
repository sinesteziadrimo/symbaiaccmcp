#!/usr/bin/env node
/**
 * Symbai Accounting self-heal pentru marketplace-ul de plugin.
 *
 * DE CE EXISTĂ: auto-update-ul nativ al marketplace-urilor terțe are moduri tăcute
 * de blocare — clona locală a marketplace-ului (`~/.claude/plugins/marketplaces/symbai-acc`)
 * uneori nu mai face `git fetch`, sau divergează (commit local / force-push în upstream),
 * iar `git pull --ff-only` eșuează în tăcere. Rezultat: clientul rămâne ÎNGHEȚAT pe o
 * versiune veche, deși are `autoUpdate: true`.
 *
 * CE FACE: la pornirea sesiunii aduce clona de marketplace la zi cu upstream-ul.
 *   - fetch origin
 *   - dacă se poate fast-forward → ff (păstrează orice; cazul „nu mai fetcha")
 *   - dacă a divergeat ȘI working tree-ul e CURAT → reset --hard origin/<branch>
 *     (recuperează din divergență; cazul „force-push / commit accidental în clonă")
 *   - dacă working tree-ul e MURDAR → NU atinge nimic (protejează editări locale)
 *
 * GARANȚII: nu blochează niciodată pornirea, nu scrie pe stdout decât JSON valid de hook,
 * orice eroare e înghițită (exit 0), are throttle (o dată / 6h) ca să nu lovească rețeaua
 * la fiecare sesiune.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const THROTTLE_MS = 6 * 60 * 60 * 1000; // o dată la 6 ore
const MARKETPLACE_NAME = "symbai-acc";
const UPSTREAM_HINT = "symbaiaccmcp"; // confirmă că e repo-ul corect

function ok(extra = {}) {
  // Output minimal valid de hook; niciodată nu blochează.
  process.stdout.write(JSON.stringify({ continue: true, ...extra }));
  process.exit(0);
}

function git(cwd, args, timeout = 12000) {
  return execFileSync("git", args, {
    cwd,
    timeout,
    stdio: ["ignore", "pipe", "ignore"],
    encoding: "utf8",
  }).trim();
}

try {
  const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT;
  if (!pluginRoot) ok();

  // Urcă din .../plugins/cache/symbai-acc/symbai-accounting/<ver> până găsim
  // un folder care conține `marketplaces/<name>/.git`.
  let marketplaceDir = null;
  let cur = path.resolve(pluginRoot);
  for (let i = 0; i < 8 && cur; i++) {
    const candidate = path.join(cur, "marketplaces", MARKETPLACE_NAME);
    if (fs.existsSync(path.join(candidate, ".git"))) {
      marketplaceDir = candidate;
      break;
    }
    const parent = path.dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
  if (!marketplaceDir) ok();

  // Throttle pe baza unui fișier de stare în CLAUDE_PLUGIN_DATA (sau lângă clona
  // de marketplace, în folderul părinte). NU scriem în repo — altfel hook-ul își
  // murdărește singur clona și apoi refuză reparația ca "local changes".
  const dataDir = process.env.CLAUDE_PLUGIN_DATA || path.dirname(marketplaceDir);
  const stampFile = path.join(dataDir, `.symbai-self-heal-${MARKETPLACE_NAME}-stamp`);
  // stamp() scrie marca de timp DOAR la ieșirile „utile" (am confirmat la-zi sau am
  // reparat). NU o scriem după fetch, ca un eșec parțial să nu blocheze reparația 6h.
  const stamp = () => {
    try {
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(stampFile, String(Date.now()));
    } catch {
      /* irelevant — throttle e best-effort */
    }
  };
  try {
    const last = Number(fs.readFileSync(stampFile, "utf8").trim());
    if (Number.isFinite(last) && Date.now() - last < THROTTLE_MS) ok();
  } catch {
    /* niciun stamp încă → continuă */
  }

  // Confirmă că e repo-ul Symbai Accounting (nu altă clonă întâmplătoare).
  let remote = "";
  try {
    remote = git(marketplaceDir, ["remote", "get-url", "origin"], 5000);
  } catch {
    ok();
  }
  if (!remote.includes(UPSTREAM_HINT)) ok();

  // Branch-ul curent (de regulă main). HEAD detached → reatașăm pe main.
  let branch = "main";
  let detached = false;
  try {
    branch = git(marketplaceDir, ["rev-parse", "--abbrev-ref", "HEAD"], 5000) || "main";
  } catch {
    /* fallback main */
  }
  if (branch === "HEAD") {
    branch = "main";
    detached = true;
  }
  // Apărare ieftină: nume de branch suspect → nu atinge nimic.
  if (!/^[A-Za-z0-9._\/-]+$/.test(branch)) ok();

  // Fetch upstream. NU marcăm stamp pe eșec de rețea — reîncercăm data viitoare.
  try {
    git(marketplaceDir, ["fetch", "origin", branch, "--quiet"], 15000);
  } catch {
    ok();
  }

  const upstreamRef = `origin/${branch}`;

  // Suntem deja la zi?
  let head = "";
  let upstream = "";
  try {
    head = git(marketplaceDir, ["rev-parse", "HEAD"], 5000);
    upstream = git(marketplaceDir, ["rev-parse", upstreamRef], 5000);
  } catch {
    ok();
  }
  // Deja la zi ȘI atașat pe branch → nimic de făcut (marcăm throttle).
  if (head === upstream && !detached) {
    stamp();
    ok();
  }

  const UPDATED_MSG = {
    hookSpecificOutput: {
      additionalContext:
        "Pachetul Symbai Accounting a fost actualizat automat la ultima versiune. Skill-urile și cunoștințele noi sunt disponibile.",
    },
  };

  // HEAD detached: reatașează pe branch ȚINTĂ, dar DOAR dacă working tree-ul e curat.
  if (detached) {
    let dirtyD = "x";
    try {
      dirtyD = git(marketplaceDir, ["status", "--porcelain"], 5000);
    } catch {
      ok();
    }
    if (dirtyD) ok();
    try {
      git(marketplaceDir, ["checkout", "-B", branch, upstreamRef], 8000);
      stamp();
      ok(UPDATED_MSG);
    } catch {
      ok();
    }
  }

  // Încearcă fast-forward (cazul tipic: pur și simplu în urmă).
  try {
    git(marketplaceDir, ["merge", "--ff-only", upstreamRef], 8000);
    stamp();
    ok(UPDATED_MSG);
  } catch {
    /* ff a eșuat → probabil divergent; tratează mai jos */
  }

  // Divergent. Resetează DOAR dacă working tree-ul e curat (nu distrugem editări locale).
  let dirty = "x";
  try {
    dirty = git(marketplaceDir, ["status", "--porcelain"], 5000);
  } catch {
    ok();
  }
  // Are modificări locale → nu atinge; marcăm throttle (nu se rezolvă singur,
  // n-are sens să refacem fetch la fiecare pornire).
  if (dirty) {
    stamp();
    ok();
  }

  try {
    git(marketplaceDir, ["reset", "--hard", upstreamRef], 8000);
    stamp();
    ok({
      hookSpecificOutput: {
        additionalContext:
          "Pachetul Symbai Accounting a fost re-sincronizat cu upstream (clona divergise) și e acum la ultima versiune.",
      },
    });
  } catch {
    ok();
  }
} catch {
  // Orice altă eroare neașteptată: tăcut, nu bloca pornirea.
  ok();
}
