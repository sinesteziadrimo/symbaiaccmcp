# Salarizare, contribuții și regimuri de impozitare — RO

> Snapshot orientativ. Cotele, plafoanele și facilitățile se schimbă des (legi anuale) — verifică MEREU la zi (ANAF, Codul Fiscal, Codul Muncii). Nu da cifre ca definitive fără confirmare.

## Salarizare & contribuții (uzual)
Din salariul brut se rețin (angajat):
- **CAS** (pensii) ~25% · **CASS** (sănătate) ~10% · **impozit pe venit** ~10% (după deducerea CAS+CASS și a deducerii personale).
Angajatorul datorează în plus:
- **CAM** (contribuția asiguratorie de muncă) ~2,25%.
Pot exista **facilități/scutiri** pe domenii (IT, construcții, agroalimentar) — verifică eligibilitatea și cotele speciale la zi.

Raportare: **D112** (lunar, termen uzual 25) — contribuții + impozit + evidența nominală a asiguraților.
Contracte de muncă: se raportează în **REGES (Revisal)** la ITM — înregistrarea/modificarea/încetarea sunt acțiuni oficiale (în Symbai: `regesUsername/regesPassword` pe firmă; transmiterea = acțiune deliberată, confirmă).

Conturi: 641 cheltuieli salarii, 421 salarii datorate, 4315 CAS, 4316 CASS, 444 impozit venit, 436/646 CAM.

## Regimuri de impozitare a firmei
- **Impozit pe profit**: cotă **16%** pe profitul impozabil (venituri − cheltuieli deductibile ± ajustări fiscale). Declarație **D101** anual + plăți anticipate/trimestriale după caz.
- **Microîntreprindere**: impozit pe **venituri** (cotă redusă), condiționat de **plafon de venituri + condiții** (nr. salariați, tip activitate, structura veniturilor) — **plafonul a scăzut în ultimii ani și condițiile s-au înăsprit**; verifică pragul + eligibilitatea CURENTE. Firma are `micro_regime` + date de start/stop.
- **Dividende**: impozit pe dividende reținut la sursă — **verifică cota curentă** (s-a modificat recent). Declarație D205 după caz.
- **PFA / II** (persoane fizice): de regulă contabilitate în partidă simplă (Registru de încasări și plăți), impozit pe venit + CAS/CASS pe plafoane.
- **TVA la încasare**: opțional sub anumite plafoane (vezi 02-tva.md).

## Reguli pentru asistent
- Tratează toate cotele/plafoanele de mai sus ca ORIENTATIVE; spune clar „verifică la zi" pentru cifre exacte.
- Salariile NU se setează prin MCP (se gestionează în aplicație); poți crea/edita angajați (`create_employee`/`update_employee`) și contracte fără sume de salariu.
- Pentru obligații salariale efective → datele din modulul de salarizare + `get_profit_loss` (cheltuieli cu personalul clasa 64).
- Pentru eligibilitate micro vs profit → e o analiză cu plafon + condiții; prezintă raționamentul + recomandă confirmarea cu un consultant/ANAF pentru decizii fiscale.
