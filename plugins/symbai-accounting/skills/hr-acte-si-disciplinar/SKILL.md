---
name: hr-acte-si-disciplinar
description: Acte HR trimise la semnat pe email (acte adiționale, declarații, decizii, pachete pentru mai mulți salariați) și dosarul disciplinar complet — referat, comisie, convocare, cercetare, decizie de sancționare, comunicare, radiere — prin MCP Accounting. La „trimite actul adițional la semnat”, „trimite declarațiile la toți”, „a greșit angajatul”, „abatere”, „sancțiune”, „referat”, „comisie de cercetare”, „avertisment”, „reducere de salariu disciplinară”.
---

# Acte HR și dosar disciplinar

Începe cu `get_hr_workflow_guide`; conține fluxurile `signing`, `employeeDeclarations`, `disciplinary` și regulile `disciplinaryRules`. Verifică firma conexiunii (`get_connection_identity`) înainte de orice scriere.

## Trimitere la semnat
1. Generează documentul (`amend_employment_contract`, `generate_hr_document`) și citește-l dacă utilizatorul vrea să-l revizuiască.
2. `preview_hr_document_signers` arată cine semnează și ce lipsește. Salariatul primește linkul pe emailul din fișa de personal, reprezentantul pe emailul din Setări → Administratori. Dacă lipsește un email, cere-l utilizatorului; nu inventa adrese.
3. `send_hr_document_for_signature` (cu `confirm:true` după acordul utilizatorului). Urmărește cu `get_contract_signature_status`; reamintire cu `resend_signature_request`; anulare cu `void_signature_request` (actul adițional și actele disciplinare primesc o copie nouă).
4. Actul adițional semnat se aplică automat în CIM și salarizare. Transmiterea în REGES rămâne separată: `list_pending_reges_amendments`, apoi `submit_amendment_to_reges`, în ordinea datei de efect.

Pentru declarații comune (luare la cunoștință ROI, informare GDPR, acord de comunicare electronică, funcția de bază) folosește `send_hr_document_pack` cu lista salariaților. Declarațiile cu date proprii fiecăruia (persoane în întreținere, cont bancar, excepții de contribuții) se emit individual sau cu `perEmployeeVariables`, din datele primite de la salariat.

## Dosar disciplinar
- Sancțiuni permise numai din art. 248 Codul muncii. Nu propune amenzi, rețineri sau „penalizări” în bani (art. 249, art. 169).
- `open_disciplinary_case` din referatul înregistrat. Termenul: 30 de zile de la înregistrare, maximum 6 luni de la faptă; `get_disciplinary_case` îl arată împreună cu `nextAction`.
- Avertismentul scris poate fi emis fără cercetare. Pentru celelalte: `appoint_disciplinary_commission` → `schedule_disciplinary_hearing` → `send_disciplinary_document document=summons` → `record_disciplinary_hearing` → `issue_disciplinary_decision`.
- Decizia cere motivele înlăturării apărărilor, criteriile art. 250 și tribunalul de la domiciliul salariatului. Cere-le utilizatorului; nu le deduce.
- Comunicarea (5 zile): `send_disciplinary_document document=decision`; după confirmarea salariatului `record_disciplinary_communication method=electronic_signature`. Dacă nu confirmă: predare personală sau recomandată, consemnată cu dovada. Emailul trimis singur nu este dovadă.
- Reducerile de salariu și retrogradarea se aplică automat la generarea statului pe perioada sancțiunii. Desfacerea disciplinară: `terminateContract:true` la comunicare, apoi `submit_termination_to_reges`.
- După 12 luni fără altă sancțiune: `expunge_disciplinary_sanction`. Contestația: `record_disciplinary_court_outcome`.

Toate aceste operații sunt acte cu efecte juridice: explică efectul, obține acordul explicit, apoi folosește `confirm:true`. Verifică rezultatul prin citire după fiecare pas. Dacă un tool lipsește din catalog, versiunea live nu îl are încă; nu pretinde contrariul.
