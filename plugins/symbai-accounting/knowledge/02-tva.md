# TVA în România — ghid de lucru

> Snapshot orientativ. Cotele și regulile se schimbă — verifică MEREU la zi (ANAF, Codul Fiscal — Legea 227/2015) și pe datele reale ale firmei (`get_company`, `get_vat_summary`).

## Cote
- **21%** — cota standard.
- **11%** — cota redusă (alimente, medicamente, cărți, cazare, anumite servicii — lista exactă la zi în Codul Fiscal).
- **0% / scutit** — export, livrări intracomunitare scutite, anumite operațiuni scutite (cu/fără drept de deducere).
- ⚠ Cota redusă de **5% a fost eliminată din august 2025**. Pentru documente după acea dată nu folosi 5%. Cotele sunt **dependente de data documentului** — respectă data, nu data de azi.

## Plătitor de TVA
- **Lunar** sau **trimestrial** (`vatPeriod` pe firmă). Decontul = **D300**, termen uzual **25** ale lunii următoare perioadei.
- Sub plafonul de înregistrare → neplătitor (regim special de scutire) — verifică plafonul curent.

## Tipuri de operațiuni
- **TVA la încasare** (`vat_on_cash=true`): TVA devine exigibilă la încasare/plată, nu la facturare. Se folosește 4428 (neexigibilă) → 4427/4426 la încasare.
- **Taxare inversă** (reverse charge): pentru anumite bunuri/servicii între plătitori de TVA — furnizorul nu colectează, cumpărătorul aplică 4426 și 4427 simultan (nu se plătește efectiv).
- **Intracomunitar**: achiziții/livrări intra-UE — taxare inversă pe achiziții, raportare în **D390 (VIES)** și **D394** după caz. Necesită cod valid de TVA (VIES).
- **Import/export** extra-UE: TVA în vamă / scutire la export.

## Conturi TVA
- `4426` TVA deductibilă (la cumpărări) · `4427` TVA colectată (la vânzări) · `4428` TVA neexigibilă (la încasare) · `4423` TVA de plată · `4424` TVA de recuperat.
- Închidere lunară/trimestrială: `4427 = 4426` + diferența pe 4423 (de plată) sau 4424 (de recuperat).

## Declarații legate de TVA
- **D300** — decontul de TVA (lunar/trimestrial). Input: vezi `get_vat_summary` (colectată vs deductibilă din rulajul 4427/4426).
- **D394** — declarația informativă a livrărilor/achizițiilor pe teritoriul național (între plătitori RO).
- **D390 (VIES)** — recapitulativă pentru operațiuni intracomunitare.

## Cum lucrezi (asistent)
- Pentru „cât TVA am de plată luna asta?" → `get_vat_summary(year, month)` (colectată − deductibilă). Explică că e orientativ și se confirmă cu decontul oficial.
- Nu hardcoda cote: ia cota din produs/factură; respectă data documentului.
- Depunerea efectivă a decontului se face în aplicație/ANAF (acțiune oficială) — tu pregătești datele și verifici.
