---
name: zilieri-si-straini
description: Zilieri (Legea 52/2011) de la înregistrarea zilei până la D112 și nota contabilă, inclusiv cetățeni străini (NIF, document de ședere, drept de muncă) și acte HR traduse în limba lor, prin MCP Accounting. La „am zilieri mâine”, „pune zilierii în registru”, „transmite la ITM”, „plătește zilierii”, „zilier nepalez/străin”, „contract în limba lui”, „traducere act”, „acord de plată săptămânală”, „minor zilier”, „accident zilier”.
---

# Zilieri și salariați străini

Începe cu `get_hr_workflow_guide` (fluxurile `dayLaborers`, `foreignWorkers` și regulile `dayLaborerRules`, `translationRules`). Confirmă firma conexiunii cu `get_connection_identity` înainte de orice scriere.

## Ziua de lucru
1. `get_day_laborer_today` arată ce e de făcut: zile de transmis la ITM (și întârziate), corecții, SSM de confirmat, plăți scadente, documente de ședere care expiră, accidente necomunicate.
2. `register_day_laborer_day` ÎNAINTE de începere, cu `startTime`, județ, localitate, adresă, CAEN, ore și tarif. Serverul verifică minimul orar, 12 h/zi, plafoanele (90/180 la firmă, 120/180 personal, 25 zile consecutive), minorii (6 h/zi, 30 h/săptămână, fără noapte, acordul părintelui la 15 ani) și regimul pastoral (50% din tarif).
3. Transmiterea în registrul electronic ITM: vezi secțiunea „Portalul ITM în browser”. Fără browser, dă-i utilizatorului pachetul și pașii; consemnează numai ce a fost confirmat în portal.
4. SSM: `generate_day_laborer_ssm_document` → `send_hr_document_for_signature` (zilierul semnează pe emailul din fișa lui) → `confirm_day_laborer_ssm`. Informarea zilierului: `generate_day_laborer_information`.
5. Plata la sfârșitul zilei: `mark_day_laborer_days_paid` (mai multe zile cu aceeași dovadă). Plata săptămânală/la final de perioadă/lunară cere întâi `create_day_laborer_declaration kind=payment_agreement`; lunar doar pentru perioade peste 30 de zile. Apoi `generate_day_laborer_payment_receipt`.
6. Contabilitate: `preview_day_laborer_payment_journal` → `post_day_laborer_payment_journal` (621 = 462; 462 = 4315/444/5311/5121). D112 include automat zilele plătite în luna plății.
7. Registrul lunar: `generate_day_laborer_registry`; o regenerare înlocuiește varianta nedepusă. După depunere: `mark_day_laborer_registry_submitted`.
8. Ziua anulată după transmiterea la ITM se corectează și în registrul electronic: `record_day_laborer_itm_correction`. Accidentul: `record_day_laborer_incident`, apoi `mark_day_laborer_incident_notified` după comunicarea la ITM.

## Portalul ITM în browser (fără API)
Registrul electronic al zilierilor nu e în REGES Online și nu are API: e aplicația „Inspecția Muncii” (https://www.inspectiamuncii.ro:4443 sau mobil), cu cont de la ITM-ul județean. Dacă ai browser/computer use:
1. `get_day_laborer_itm_portal_pack` pentru ziua curentă (portalul transmite doar registrul „Azi”, înainte de ora de începere). Conține valorile exacte ale câmpurilor și CSV-ul pentru Contacte (nume, prenume, CNP — doar români).
2. Utilizatorul se autentifică singur în portal. Nu introduce parole, nu crea conturi, nu accepta termeni în numele lui și nu ocoli CAPTCHA.
3. Contacte → adaugă zilierii (străinii manual, cu cetățenia și documentul) → Azi → adaugă din Contacte → completează ocupația, ora, orele, remunerația brută pe zi, CAEN, locul; „Instruit SSM” numai dacă pachetul are `instruitSsm: true`.
4. Compară fiecare rând cu pachetul; apasă „Transmite” numai la cererea explicită a utilizatorului.
5. Citește „Codul unic de confirmare transmitere” al fiecărui zilier și consemnează-l cu `record_day_laborer_itm_transmission` (`confirmations`). Rândurile în „Stare eroare” nu sunt transmise. Verifică apoi cu `get_day_laborer_itm_sheet`.
6. Corecție: „Istoric registru” → „Radiere” → rândul corect → retransmite → `record_day_laborer_itm_correction`.

## Străini
- Zilierul străin are nevoie de domiciliu/reședință în România (documentul de ședere și valabilitatea lui) și de documentul de identitate. Cei din afara UE/SEE/Elveției au nevoie și de temeiul dreptului de muncă (permis unic, aviz etc.). Fără CNP se folosește NIF-ul de la ANAF (`identifierType: nif`) și data nașterii.
- Nu inventa numere de documente, temeiuri sau date de valabilitate; cere-le utilizatorului.
- Plafonul personal de 120 de zile se verifică din declarația zilierului (`create_day_laborer_declaration kind=annual_days`).

## Acte în limba persoanei
- `list_hr_document_languages` arată limbile și actele standard traduse (CIM, act adițional, informări, SSM, actele zilierilor). Traducerea se atașează sub textul românesc; versiunea română prevalează.
- Salariat: `set_employee_document_language`; zilier: `update_day_laborer documentLanguage`. `generate_hr_document` folosește automat limba din fișă sau `translationLanguage` explicit. Un act fără traducere standard este refuzat cu `translationLanguage` explicit; nu-l prezenta ca tradus.

Toate scrierile sunt evidențe legale: explică efectul, cere acordul explicit, folosește `confirm:true`, apoi verifică prin citire. Dacă un tool lipsește din catalog, versiunea live nu îl are încă.
