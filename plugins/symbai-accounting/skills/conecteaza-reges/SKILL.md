---
name: conecteaza-reges
description: Conectează firma Accounting la REGES-ONLINE, verifică identitatea angajatorului și depanează Account disabled / unauthorized_client, prin MCP și browserul autorizat al utilizatorului.
---

# Conectează firma la REGES

1. Citește `get_company` și `get_reges_connection_setup` pe conexiunea firmei solicitate. Verifică denumirea și CUI-ul. Client ID și client secret ale aplicației sunt centrale, administrate securizat de Symbai; nu le cere, nu le copia și nu folosi credențialele altei firme. Dacă `productionApplicationConfigured=false`, este necesară configurarea serverului de către suport, nu generarea unui client de către angajator.
2. Dacă accesul este deja salvat, rulează `get_reges_integration_health` înainte să schimbi ceva. Nu regenera automat parole funcționale. `ready=true` înseamnă pregătire tehnică; nicio angajare nu a fost transmisă.
3. Folosește browserul autorizat al utilizatorului la `https://reges.inspectiamuncii.ro`. Utilizatorul gestionează personal loginul/2FA dacă sesiunea lipsește. Selectează firma și verifică CUI-ul afișat, apoi **Setări → Angajator → Utile**. Copiază **ID angajator**, nu ID utilizator. Pentru test folosește portalul distinct al mediului test și datele lui, fără date reale de producție.
4. Folosește utilizatorul/parola API existente dacă sunt disponibile. **Obține credențialele** generează date noi și le înlocuiește pe cele vechi. **Activează accesul** reactivează accesul extern existent. Generarea/activarea blochează modificările în portalul REGES, inclusiv pentru contabili. Explică această consecință și obține acord explicit dacă utilizatorul nu l-a dat deja. Nu dezactiva sau regenera accesul pentru a ocoli o eroare.
5. Citește datele afișate în portal fără a le publica în mesaje, capturi, fișiere sau jurnale. Apelează `configure_reges_connection` cu `environment: prod`, `employerId`, `username`, `password` pentru firma conexiunii MCP. Parola este cea API a angajatorului, nu parola personală a persoanei. Tool-ul necesită scriere **Setări** și drepturile curente ale emitentului tokenului.
6. Verifică rezultatul cu `get_reges_integration_health` (citire **Salarizare**). La `Account disabled`, accesul extern trebuie activat cu acordul explicat. La `unauthorized_client`/`invalid_client`, este o problemă a aplicației pentru suportul Symbai; nu regenera credențialele angajatorului. La identitate diferită, oprește transmiterea și verifică firma/GUID-ul în portal. Nu transmite angajări fictive ca test.

MCP Accounting nu controlează singur portalul REGES. Dacă nu ai browser, îndrumă utilizatorul să completeze **Accounting → Setări → Companie → REGES**, folosind tutorialul inclus. Nu cere secrete în chat ca alternativă implicită. Dacă lipsesc tool-uri, verifică drepturile și versiunea live; nu pretinde că versiunea locală este publicată. Un timeout la salvare poate avea rezultat incert: citește starea și verifică identitatea înainte de a repeta; nu regenera accesul.
