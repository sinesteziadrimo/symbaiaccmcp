# Symbai Accounting — privire de ansamblu (client-facing)

Symbai Accounting e platforma de contabilitate AI-first, multi-țară (RO, DE, GB, US, FR, ES, IT, PL, HU, SG), cu partidă dublă, integrare eFactura ANAF și sincronizare cu Symbai POS și Symbai Supplier. Prin conexiunea MCP (`symbai-accounting`), un asistent AI poate citi datele și executa acțiuni reale pe contabilitatea firmei — fără cont Symbai Hub.

## Modulele și ce fac

| Modul | Ce acoperă | Modul de scriere (token) |
|---|---|---|
| **Tablou de bord & Rapoarte** | KPI firmă, balanță de verificare, P&L, cash-flow, bilanț, vânzări/achiziții, vechime datorii | citire (mereu) |
| **Facturi de vânzare (AR)** | facturi emise, facturare eFactura, serii fiscale | `facturare` |
| **Cheltuieli & facturi primite (AP)** | bonuri/facturi furnizori, facturi primite (eFactura), reguli de mapare, NIR | `cheltuieli` |
| **Contabilitate (jurnal)** | note contabile (debit=credit), plan de conturi, solduri inițiale, închidere perioadă | `contabilitate` |
| **Declarații fiscale** | D300 (TVA), D394, D406 (SAF-T), D112, D390, D100/D101..., echivalente DE/FR; depunere ANAF | `declaratii` |
| **Parteneri** | clienți (cumpărători) și furnizori, fișe, lookup CUI/VAT | `parteneri` |
| **Stocuri & gestiune** | depozite, documente de inventar (NIR/transfer/ajustare), produse | `stocuri` |
| **Salarizare & HR** | angajați, state de plată, contracte (salariile se setează în aplicație) | `salarizare` |
| **Bancă & casă** | conturi bancare, tranzacții, reconciliere, registru de casă, registru încasări-plăți | `banca` |
| **Import & migrare** | import asistat de date, reguli de mapare | `import` |
| **Setări** | date firmă, serii fiscale, automatizări | `setari` |

## Glosar rapid

- **Balanță de verificare** = lista conturilor cu solduri debit/credit la o lună — trebuie să fie echilibrată.
- **Notă contabilă (jurnal)** = înregistrare cu cel puțin 2 linii, unde **total debit = total credit**.
- **AR / AP** = creanțe (facturi de vânzare) / datorii (facturi de achiziție).
- **eFactura / ANAF** = sistemul fiscal RO; depunerea e ireversibilă — se confirmă explicit.
- **NIR** = notă de intrare-recepție (recepția mărfii pe stoc).
- **Perioadă închisă** = lună blocată contabil; nu se mai pot posta note pe acea dată.

## Reguli de aur (pentru asistent)

- Citește datele reale înainte de orice acțiune; nu presupune cote de TVA sau solduri.
- Acțiunile ireversibile (depunere ANAF, închidere perioadă, salarizare, aplicare document stoc, ștergere factură, postare notă) cer `confirm:true` — explică întâi, apoi execută.
- Banii sunt zecimale (text); nu rotunji prin float; notele contabile trebuie echilibrate.
- După scriere, verifică prin re-citire și arată dovada.
