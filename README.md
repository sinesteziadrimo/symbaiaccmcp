# Symbai Accounting pentru Claude Code / Codex

Acest repo e un **plugin Claude Code** (cu manifest și pentru Codex) care învață asistentul AI cum să lucreze cu **Symbai Accounting** — softul de contabilitate (facturi, note contabile / jurnal, plan de conturi, declarații fiscale, parteneri, stocuri, salarizare, bancă & casă, eFactura ANAF).

> **Independent de Symbai POS / Symbai Hub.** E pentru contabili care folosesc **doar** softul de contabilitate. Nu ai nevoie de cont Symbai Hub și nu instalezi nimic legat de POS. Tokenul de acces se creează **din aplicația de contabilitate**, iar serverul MCP rulează pe instanța ta — totul local.

Conține:

- **skills/** — workflow-uri pas-cu-pas: `conecteaza-accounting` (conectează/repară conexiunea MCP) și `accounting-asistent` (orientarea generală: cele două surse de adevăr — tool-uri MCP live + biblioteca de cunoștințe — și doctrina MCP-first cu confirmări pe acțiunile ireversibile).
- **knowledge/** — referințe RO de lucru: plan de conturi & monografii, TVA, declarații fiscale, salarizare & regimuri, plus catalogul de capabilități MCP (`tools-mcp.md`).

Pluginul se folosește **împreună cu conexiunea MCP** la instanța ta de contabilitate (date live + acțiuni reale). Conexiunea o adaugi din aplicație (vezi mai jos).

## Instalare (clientul rulează o singură dată)

**Metoda recomandată — prin fișier, cu AUTO-UPDATE pornit din start.** Funcționează în orice mediu (inclusiv aplicația desktop, unde comanda `/plugin` poate lipsi) și e singura care pornește actualizarea automată. Editează `settings.json` din folderul Claude (Windows: `C:\Users\<nume>\.claude\settings.json`; macOS/Linux: `~/.claude/settings.json`; creează-l dacă lipsește) și **îmbină** următoarele chei, păstrând restul fișierului:

```json
{
  "extraKnownMarketplaces": {
    "symbai-acc": {
      "source": { "source": "git", "url": "https://github.com/sinesteziadrimo/symbaiaccmcp.git" },
      "autoUpdate": true
    }
  },
  "enabledPlugins": { "symbai-accounting@symbai-acc": true }
}
```

> ⚠️ `"autoUpdate": true` este **obligatoriu** — fără el rămâi blocat pe versiunea de la instalare și nu mai primești ghidurile noi. Comanda `/plugin marketplace add` **nu** pornește auto-update — de aceea folosim fișierul.

Pluginul mai pornește la fiecare sesiune un hook fail-safe de **self-heal**: verifică clona locală de marketplace `symbai-acc`, o aduce la zi prin fast-forward când poate și o re-sincronizează cu upstream dacă a divergat dar nu are modificări locale. Nu cere pași manuali clientului; doar protejează cazul în care auto-update-ul nativ se blochează în tăcere.

Apoi instalează pluginul **o singură dată** (activarea efectivă), pe metoda disponibilă la tine:

```
# caseta de chat Claude Code:
/plugin install symbai-accounting@symbai-acc
# aplicația desktop fără /plugin: Customize / Settings → Plugins/Marketplaces → instalează „symbai-accounting" din marketplace-ul „symbai-acc"
# terminal, doar dacă `claude --version` merge:
claude plugin install symbai-accounting@symbai-acc
```

Repornește Claude Code. De aici încolo pluginul se actualizează **singur** la fiecare pornire — nu mai faci nimic.

## Conectarea la datele tale (MCP)

Separat de plugin, adaugă conexiunea MCP la instanța ta de contabilitate:

1. În aplicația de contabilitate → **Setări → Integrări → „Acces AI (MCP)"** → **„Token nou"**. Alege separat modulele pe care AI-ul le poate **citi** și pe cele pe care le poate **modifica**, apoi creează tokenul `symbai_acc_mcp_...`. Contextul minim al firmei rămâne disponibil; datele operaționale respectă modulele de citire selectate. Tokenul se afișează **o singură dată** — copiază-l.
2. Aplicația îți dă, la creare, **exact** comanda CLI și un **mesaj de lipit în chat** pentru conectare. Sau spune-i asistentului „conectează-mă la Symbai Accounting" — skill-ul `conecteaza-accounting` te ghidează (inclusiv la eroarea „Some MCP servers could not be loaded").

Tokenul se validează **local** de instanța ta — nu trece prin Symbai Hub.

## Actualizare

Cu `"autoUpdate": true` în `settings.json` **nu trebuie să faci nimic** — Claude Code reîmprospătează marketplace-ul și upgradează pluginul la fiecare pornire. Dacă mecanismul nativ se împotmolește, hook-ul de self-heal din plugin repară clona de marketplace la următoarea sesiune fără să blocheze pornirea.

Dacă vrei ultima versiune **imediat**: scrie în chat „actualizează skill-urile Symbai Accounting", sau, dacă ai comanda disponibilă, `/plugin marketplace update symbai-acc`.

## Cum se livrează conținut nou (echipa Symbai)

Urci fișiere noi de skill/knowledge în acest repo (pe `main`) și **bumpezi versiunea** în `plugins/symbai-accounting/.claude-plugin/plugin.json`, `plugins/symbai-accounting/.codex-plugin/plugin.json` și intrarea din `.claude-plugin/marketplace.json`. Clienții cu `autoUpdate: true` le primesc automat la următoarea pornire; ceilalți, manual cu `/plugin marketplace update symbai-acc`.

> **Bumpul de versiune e obligatoriu la fiecare livrare.** Claude Code servește pluginul dintr-un folder fixat pe versiune (`cache/symbai-acc/symbai-accounting/<versiune>/`); dacă `version` nu se schimbă, clienții rămân pe copia veche din cache chiar dacă au tras commit-uri noi.

## Structură

```
.claude-plugin/marketplace.json     # marketplace „symbai-acc" (listează symbai-accounting)
plugins/symbai-accounting/
  .claude-plugin/plugin.json        # manifestul pluginului (Claude Code)
  .codex-plugin/plugin.json         # manifestul pentru Codex
  hooks/hooks.json                  # SessionStart → self-heal
  scripts/self-heal-marketplace.mjs # fail-safe de auto-update
  skills/<nume>/SKILL.md            # workflow-uri
  knowledge/*.md                    # cunoștințe RO pe arii
```

## Compatibilitate

Skill-urile urmează standardul deschis Agent Skills (SKILL.md), deci funcționează în Claude Code. Pentru Codex există manifest dedicat (`.codex-plugin`); suportul de skill-uri poate diferi, dar **conexiunea MCP funcționează identic cross-tool** (e doar un server HTTP în config-ul uneltei).
