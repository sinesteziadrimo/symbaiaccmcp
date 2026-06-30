---
name: conecteaza-accounting
description: Configurează sau repară conexiunea MCP la instanța Symbai Accounting (serverul "symbai-accounting"). Folosește când tool-urile de contabilitate nu apar în sesiune, la „conectează-mă la Symbai Accounting / la contabilitate", „nu am acces la facturile/datele mele de contabilitate", erori 401 / „Token MCP lipsă", sau eroarea Claude Desktop „Some MCP servers could not be loaded".
---

# Conectează / repară conexiunea Symbai Accounting (MCP)

Scop: serverul MCP `symbai-accounting` să apară conectat în sesiunile Claude Code, cu tool-urile lui (`get_dashboard`, `list_invoices`, `post_journal_entry`, `list_tax_declarations` etc.).

> **Important — diferit de Symbai POS**: tokenul de contabilitate se creează **DIN APLICAȚIA de contabilitate**, NU din portalul Hub. Un client de Symbai Accounting **nu are nevoie de cont Symbai Hub** — totul e local.

## Ce îți trebuie de la utilizator

- **URL-ul instanței de contabilitate**: `https://<instanța-ta>/mcp` (de regulă `https://accounting.symbai.app/mcp`, sau adresa pe care o folosește pentru a se loga în contabilitate). UI-ul afișează endpoint-ul exact sub cardul de token.
- **Tokenul** `symbai_acc_mcp_...` — îl creează din aplicația de contabilitate → **Setări → Integrări → „Acces AI (MCP)"** → butonul **„Token nou"**. Bifează modulele pe care AI-ul are voie să le **modifice** (citirea e mereu permisă), apoi „Creează token". Tokenul se afișează **o singură dată**. Dacă l-a pierdut: revocă tokenul vechi și creează altul (10 secunde) — nu se poate recupera.

## Configurarea corectă

> Cel mai probabil utilizatorul **NU** are CLI-ul `claude` în terminal. Dacă `claude ...` dă „command not found", e NORMAL — treci la metoda 1 (editare fișier).

1. **Editează `.claude.json`** (metoda implicită) — din folderul home (Windows: `C:\Users\<nume>\.claude.json`; macOS/Linux: `~/.claude.json`; creează-l dacă lipsește). În obiectul `"mcpServers"` de la **nivelul rădăcină**, adaugă (păstrând restul fișierului):
   ```json
   "symbai-accounting": { "type": "http", "url": "<URL>", "headers": { "Authorization": "Bearer <TOKEN>" } }
   ```
   După salvare, cere utilizatorului să închidă complet și să redeschidă aplicația.

2. **Scurtătură cu CLI** — DOAR dacă `claude --version` afișează o versiune:
   ```
   claude mcp add --transport http --scope user symbai-accounting <URL> --header "Authorization: Bearer <TOKEN>"
   ```
   `--scope user` e obligatoriu (altfel conexiunea se leagă doar de folderul curent).

Pentru comoditate, aplicația îți dă în cardul de token, la creare, **exact** comanda CLI și un **mesaj de lipit în chat** — folosește-le ca atare.

## Capcana — claude_desktop_config.json (NU-l folosi)

`claude_desktop_config.json` / Settings → Developer → „Local MCP servers" acceptă DOAR servere stdio locale. O intrare HTTP `symbai-accounting` acolo NU funcționează și dă la pornire: **„Some MCP servers could not be loaded ... skipped: symbai-accounting"**. Pentru Claude Code, serverul trăiește în `~/.claude.json` și se vede la `/mcp` — panoul „Local MCP servers" rămâne gol (e normal). Dacă apare eroarea: șterge DOAR intrarea greșită din acel fișier și fă configurarea corectă de mai sus.

## Verificare (în ordine)

1. **Instanța e activă?** POST la `<URL>` fără header → **HTTP 401** „Token MCP lipsă...". 404/HTML → URL greșit.
2. **Tokenul e valid?** Același POST cu `Authorization: Bearer <TOKEN>` + body JSON-RPC `initialize` → **HTTP 200**. Tot 401 → token revocat/expirat/greșit → regenerează din aplicație.
3. **După restart**, sesiune nouă: `/mcp` arată `symbai-accounting` conectat.
4. **Confirmă TU cu un tool** — cheamă `get_dashboard` sau `list_invoices`. Dacă întoarce date, conexiunea + permisiunile sunt OK. „Permisiune insuficientă" pe un tool de scriere = conexiunea e bună, doar modulul nu e bifat pe token → Setări → Integrări → recreează tokenul cu modulul bifat.

## Alte cauze frecvente

- **Aplicația nu a fost repornită complet** — conexiunile MCP se încarcă la pornire.
- **„Permisiune insuficientă" la scriere** — modulul nu e bifat pe token; tokenurile nu se pot edita, deci recreează-l cu modulele dorite.
- **Accesul s-a oprit brusc** — tokenul a fost revocat sau a expirat → verifică în Setări → Integrări → Acces AI (MCP).
