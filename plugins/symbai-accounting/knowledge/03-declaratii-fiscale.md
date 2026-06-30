# Declarații fiscale RO — ce sunt, cine depune, termene

> Snapshot orientativ (ANAF / Codul Fiscal — Legea 227/2015 / Codul de Procedură Fiscală). Termenele și pragurile se modifică — verifică la zi. Calendarul exact al firmei: vezi modulul fiscal din aplicație.

## Declarații periodice
| Cod | Ce este | Cine / când |
|---|---|---|
| **D300** | Decontul de TVA | Plătitorii de TVA, lunar/trimestrial; termen uzual 25 ale lunii următoare. |
| **D301** | Decont special de TVA | Pentru neplătitori cu operațiuni speciale (ex. achiziții intra-UE). |
| **D390 (VIES)** | Declarația recapitulativă operațiuni intracomunitare | Lunar, dacă există operațiuni intra-UE. |
| **D394** | Declarația informativă livrări/achiziții pe teritoriul național | Plătitorii de TVA, la termenul decontului. |
| **D112** | Contribuții sociale + impozit pe venit + evidența nominală a asiguraților | Angajatorii, lunar (sau trimestrial pt. anumite categorii); termen uzual 25. |
| **D100** | Obligații de plată la bugetul de stat | Pe tipuri de impozit, periodicitate variabilă. |

## Declarații anuale / periodice mai rare
| Cod | Ce este |
|---|---|
| **D101** | Impozitul pe profit anual (PJ pe regim de profit). |
| **D205 / D207** | Declarații informative privind impozitul reținut la sursă / pe venituri. |
| **D406 (SAF-T)** | Fișierul standard de control fiscal (raportare detaliată ANAF). |
| **D700** | Modificări/mențiuni privind înregistrarea fiscală. |
| **Situații financiare anuale** | Bilanț + cont de profit și pierdere + note (OMFP 1802/2014); termen legal anual. |

## Reguli pentru asistent
- Pentru „ce declarații am de depus / când" — orientează-te după tabel + datele firmei (regim TVA lunar/trimestrial, are salariați → D112, are operațiuni intra-UE → D390). Confirmă termenele exacte cu calendarul fiscal din aplicație/ANAF.
- Pentru DATELE unei declarații: D300 → `get_vat_summary`; restul → din rapoarte (`get_profit_loss`, `get_trial_balance`) + datele din module. Generarea XML oficială + depunerea în SPV/ANAF se fac în aplicație (acțiuni oficiale, ireversibile) — tu pregătești și verifici.
- NU declara „depus" decât după confirmarea în SPV. Depunerea e ireversibilă.

## Surse oficiale (pentru actualizare)
- ANAF — formulare, instrucțiuni, calendar fiscal: anaf.ro.
- Codul Fiscal (Legea 227/2015) + normele de aplicare; Codul de Procedură Fiscală.
- OMFP 1802/2014 — reglementări contabile (partidă dublă).
- e-Factura / e-Transport / SAF-T — secțiunile dedicate ANAF.
