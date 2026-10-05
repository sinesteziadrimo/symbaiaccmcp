---
name: receptie-factura
description: Facturile de la furnizori în Symbai Accounting, de la import până la NIR sau nota contabilă — maparea liniilor pe produse sau tipuri de cheltuială, factorul TOTAL de conversie și întrebările de unitate, liniile identice, acceptarea în bloc, maparea o singură dată pe toate facturile deschise („De mapat”), regulile memorate (corectare, mutare, reparare), gestiunea și recepțiile deja făcute, previzualizarea înregistrării, corecția documentelor deja înregistrate și ecranul live Sym. Lucrează pe conexiunea Symbai Accounting; facturile introduse prin Symbai POS se lucrează cu skill-ul `receptie-factura-furnizor` pe conexiunea POS. La „mapează factura”, „introdu/finalizează facturile”, „fă NIR-ul”, „bagă marfa pe stoc”, „ce facturi am de procesat”, „de ce nu se face NIR-ul”, „bax de 24”, „unitatea nu se potrivește”, „regula e greșită”, „am un produs dublat”, „am greșit maparea pe o factură înregistrată”, „storno factură furnizor”.
---

# Recepția facturii de la furnizor (Symbai Accounting)

Scopul: marfa de la furnizor intră o singură dată în stoc, iar factura ajunge o singură dată în contabilitate, pe conturile corecte. Serviciile și cheltuielile ajung pe tipul de cheltuială potrivit, fără stoc.

Referința completă (stări, coduri, tabele) este `knowledge/mapare-facturi.md`. Ghidul live, la zi cu versiunea instalată, este resursa MCP `symbai://mapare-facturi` sau `get_invoice_mapping_guide` (cu `topic` opțional). Citește-l o dată pe sesiune, înaintea primei mapări. Dacă ghidul live diferă de acest skill, ghidul live are dreptate.

**Regula de aur:** stocul se mișcă numai la înregistrarea NIR-ului. O factură mapată și acceptată integral nu a schimbat încă nici stocul, nici contabilitatea. „Gata” înseamnă factura înregistrată și verificată prin recitire.

## 0. Înainte de orice

- **Firma și drepturile.** `get_connection_identity` arată firma și persoana conexiunii. Citirile facturilor cer modulul de citire `cheltuieli`; maparea cere scriere `cheltuieli`. NIR-ul cere în plus `stocuri` și `contabilitate`, înregistrarea fără stoc cere `contabilitate`, gestiunea pe linie și decizia „nu e aceeași livrare” cer `stocuri`. Unele drepturi se verifică abia la apel: `ecran_finalizeaza` cere `contabilitate`, iar pentru o factură cu marfă și `stocuri`; `map_incoming_invoice_line` cu `barcode` cere `stocuri`; `create_incoming_invoice_draft` cu `emailDocument` sau `inboxDocument` cere `email`. Produsele și gestiunile se citesc cu `stocuri`, furnizorii cu `parteneri`. Un tool absent din `tools/list` înseamnă drepturi restrânse; spune ce drept lipsește, nu ocoli prin alt tool.
- **Facturile din Symbai POS.** Dacă decizia are `pos_owned` / `pos_reception_handoff` sau un apel răspunde `POS_INVOICE_SOURCE_LOCKED`, factura se lucrează în Symbai POS. Oprește-te pe acea factură, spune-i utilizatorului și continuă cu celelalte.
- **Starea de acum.** Dacă utilizatorul spune că a schimbat ceva în aplicație, recitește factura înainte să enumeri ce mai e de făcut. Nu repeta o scriere ca să verifici dacă s-a salvat; citește.
- **Rezultat incert.** `outcomeUnknown:true` (pe ecranul live: `rezultatIncert:true`) înseamnă că legătura s-a întrerupt și scrierea poate fi deja aplicată. Recitește (`get_incoming_invoice`, `get_invoice_intake_decision`) înainte de orice reîncercare. Nu repeta orbește o mapare, o aprobare și mai ales o înregistrare.

## 1. Află ce e de făcut

- Toate facturile deschise: `list_invoice_intake_decisions` (câte 1–25), continuând cu `offset=nextOffset` până `hasMore:false`. Nu raporta lista după prima pagină.
- O factură: `get_invoice_intake_decision(invoiceId)`. Folosește `phase`, `questions[]` (fiecare cu `code`, `ask`, `lineIds`, `resolvers`), `requirements[]` și `posting` (calea și unealta). Rezolvă întrebările cu uneltele din `resolvers`, nu la întâmplare.
- Ordinea de lucru pe factură: antet → liniile documentului → mapare → recepție (gestiune, livrări deja primite) → aprobare → previzualizare → înregistrare → verificare.

**Facturi noi:**
- Din SPV: `list_available_efactura_messages` → (opțional `preview_efactura_inbox_message`) → `import_efactura_inbox_messages` cu `selectedIds`. Deciziile salvate se reaplică singure pe liniile noi.
- Din email, poză sau PDF, în ordinea aceasta:
  1. Furnizorul: `list_suppliers` cu `search` după codul fiscal, apoi după denumire. `create_supplier` numai dacă nu există.
  2. Dublura: `check_duplicate_invoice` cu `supplierId`, `invoiceNumber` și `invoiceDate`.
  3. Ciorna: `create_incoming_invoice_draft` cu `supplierId`, o `idempotencyKey` stabilă și datele de pe document (cu `emailDocument` sau `inboxDocument` cere și dreptul `email`); liniile cu `add_incoming_invoice_line`. Copiază datele exact de pe document; nu completa ce nu se vede.
- O factură cu `supplierMissing:true` primește furnizorul cu `update_incoming_invoice_context` înainte de orice altă modificare.

## 2. Mapează fiecare linie cu dovezi

Pe fiecare linie nemapată sau neacceptată:

1. `get_invoice_line_mapping_suggestions(lineId)`: propunerile cu `source`, `reason`, `confidence`, `trustTier`, `autoApplicable` și avertismente. `ruleResolution.conflict` = decizii salvate diferite pentru aceeași denumire; nu alegi singur.
2. Când propunerea nu e evidentă: `get_supplier_mapping_context(lineId)` — istoricul aceluiași articol la același furnizor, regulile, produsele candidate cu unitatea lor, natura liniei și avertismentele. Citește paginile până la capăt (`coverage.next`) înainte să tragi concluzia că o dovadă lipsește. Pentru alte produse candidate: `list_products` (`search`) și `get_product`.
3. Decide:
   - **Dovadă clară** (cod de bare, codul articolului la furnizor, regulă salvată fără conflict și confirmată de istoric): `map_incoming_invoice_line` cu `productId` și `accepted:true`, **fără** `source:"manual"`. Linia se acceptă ca decizie a asistentului; nu învață regula și nu se propagă.
   - **Utilizatorul a ales sau a confirmat produsul**: `accepted:true` și `source:"manual"`. Decizia lui învață regula furnizorului și se aplică liniilor identice ale facturii (vezi secțiunea 5).
   - **Doar asemănare de nume, istoric contradictoriu, două produse la fel de bune**: întreabă (secțiunea 13). Continuă cu celelalte linii între timp.
4. Contul liniei cu produs vine din tipul produsului; de regulă nu-l trimiți. La marfa care intră în stoc, contul liniei trebuie să fie contul de NIR al produsului (îl arată previzualizarea); alt cont blochează NIR-ul (`stock_account_mismatch`). Alt cont se poate alege numai pentru produsele fără stoc sau pe liniile de cheltuială. Dacă contul produsului pare greșit, tipul produsului e greșit: spune-i contabilului. La schimbarea produsului trimite în același apel și factorul noului produs.
5. **Produs lipsă**: caută-l întâi (diacritice, abrevieri, alt nume). Un produs nou se creează (`create_product`, cu tipul corect, care decide contul) numai cu acordul utilizatorului sau dacă el a cerut deja crearea produselor lipsă. Un produs propus de asistent pe linie se acceptă cu `accept_invoice_proposed_product`, după aceeași verificare.

O regulă salvată este o dovadă, nu un adevăr de neatins. Dacă istoricul sau documentul o contrazic, nu o aplica; spune utilizatorului ce regulă pare greșită și propune corectarea ei (secțiunea 7).

## 3. Unitatea și factorul TOTAL

`packMultiplier` este factorul **TOTAL**: câte unități de stoc ale produsului înseamnă **o** unitate a furnizorului de pe linie, cu pasul de unitate inclus. Bax de 12 sticle, produs în buc → 12. Sac de 25 kg facturat la bucată, produs în kg → 25; produs în g → 25000. Facturat în kg, produs în g → 1000 (se aplică și singur). Aceeași unitate → fără factor (`noPackSplit:true` numai dacă unitățile sunt chiar aceleași). Cel mult 4 zecimale.

- Nu există conversie 1:1 implicită. Când unitățile nu se convertesc singure, maparea răspunde 409 `PACK_CONVERSION_REQUIRED` cu `question {kind, supplierUnit, productUnit, suggestedFactor?}`.
- Caută dovada: denumirea („6x1,5L”, „SAC 25KG”), cantitatea netă de pe document, factorul folosit în istoricul articolului (`get_supplier_mapping_context`), conversiile învățate (`list_pack_conversions`). Cu dovadă clară, retrimite maparea cu factorul.
- Fără dovadă, întreabă exact: „1 {supplierUnit} = câți {productUnit}?”. `suggestedFactor` e un indiciu, nu o dovadă.
- `PACK_FACTOR_CONTRADICTS_IDENTICAL_UNITS` sau `PACK_FACTOR_CONTRADICTS_DOCUMENT_MULTIPACK`: factorul nu se potrivește cu documentul; numai utilizatorul îl confirmă, în aplicație. Nu insista prin alt tool.
- După mapare, verifică cantitatea și prețul convertite (`get_incoming_invoice` sau previzualizarea). Valoarea liniei rămâne cea de pe factură; un bax care devine mii de bucăți înseamnă factor greșit.

## 4. Linii fără produs: servicii, cheltuieli, garanții, reduceri

- **Servicii, utilități, chirie, transport separat**: `list_expense_destination_types` cu `brandId` și `locationId` ale facturii, apoi `map_incoming_invoice_line` cu `productTypeCode` și fără `productId`. Alt cont decât cel implicit numai din `eligibleAccountCodes` al tipului. Refuzuri: `EXPENSE_TYPE_NOT_AVAILABLE`, `EXPENSE_ACCOUNT_NOT_ON_TYPE`. Fără tipuri configurate, mapează pe un cont valid de cheltuială.
- **Alimente și băuturi** nu devin cheltuieli și nu se pun pe produse fără stoc.
- **Garanția SGR** (0,50 lei/ambalaj, HG 1074/2021) nu este marfă (`LINE_NATURE_CONFLICT` dacă o pui pe produs). Mapeaz-o pe tipul sau contul folosit de firmă pentru garanții; dacă nu e clar care, întreabă contabilul.
- **Reducere pe factură**: distribuie-o pe liniile de marfă cu `absorb_invoice_line`. 609 și 767 numai pe linii negative (OMFP 1802/2014). O sumă negativă singură nu dovedește o reducere; poate fi retur, corecție sau garanție — verifică documentul sau întreabă.
- **Transport pe factura de marfă**: în costul mărfii (`absorb_invoice_line`) sau cheltuială separată. E politica firmei: urmeaz-o dacă se vede în istoric, altfel întreabă o dată și aplic-o la fel pe toate facturile cerute.
- **Două lucruri pe o linie** sau o factură de utilități pe mai multe locații: `split_invoice_line` după cantitate (`count` + `quantities`) sau după valoare (`lineTotals`, suma exact egală cu valoarea liniei). Factura revine la verificare.

## 5. Liniile identice și acceptarea în bloc

- Decizia utilizatorului (`source:"manual"`) se aplică liniilor identice ale aceleiași facturi. `identicalLines`: lipsă = cele neacceptate primesc maparea, cele acceptate automat pe alt produs revin la verificare; `"accept"` = le corectează și rămân acceptate; `"skip"` = numai linia cerută. Citește `propagation {updated, skippedHumanDecisions, failed}`. Deciziile unei persoane nu se rescriu.
- Maparea asistentului fără `source:"manual"` nu se propagă: mapează liniile identice separat sau folosește `apply_invoice_saved_mappings` dacă există deja o regulă.
- `accept_invoice_ai_suggestions(invoiceId)` acceptă numai propunerile sigure. Citește `corrected[]` (conturi aduse la tipul produsului) și `blocked[]` (`reason`, `message`, `nextAction`). Rezolvă fiecare linie blocată după motivul ei (tabelul din `knowledge/mapare-facturi.md`); nu repeta apelul. Zero linii acceptate nu este un succes.
- Mapările AI în lot (`suggest_incoming_invoice_mappings`, urmărit cu `get_invoice_mapping_job`) produc doar propuneri; se verifică la fel.

## 6. Același articol pe toate facturile deschise („De mapat”)

Când același articol al furnizorului apare nemapat pe mai multe facturi, ia o singură decizie:

1. `list_supplier_products_to_map` (filtru `status`: `todo`, `proposal`, `none`, `rule`, `ready`; `search`; `supplier`) — un rând pe articol, cu facturile, liniile, propunerea curentă și `representative.lineId`. Dovezile: `get_supplier_mapping_context` pe aceeași linie.
2. `map_supplier_product_on_open_invoices` cu `lineId` = `representative.lineId`, `productId` (marfă) sau `accountCode` (cheltuială), factorul TOTAL dacă e nevoie, `confirm:true`; `userConfirmed:true` numai dacă utilizatorul a ales sau a confirmat produsul.
3. Decizia se aplică tuturor liniilor grupului. Cu `userConfirmed:true` învață o dată regula furnizorului (pe linia reprezentativă); fără el rămâne propunerea ta și regula nu se învață.
4. Citește rezultatul: `linesAccepted` din `linesTotal`, `failed[]` cu codul fiecărei linii, `ruleSaved` și `remaining`. `ruleSaved:false` înseamnă că regula nu s-a învățat: spune motivul din `ruleSkippedReason`. `remaining` > 0 înseamnă că grupul are mai multe linii decât se aplică într-un apel: recitește `list_supplier_products_to_map` și repetă cu noul `representative.lineId` (cel vechi răspunde `MAPPING_WORKBENCH_LINE_STALE`). Liniile eșuate se rezolvă pe factura lor.

Reducerile, absorbțiile și retururile sunt specifice unui document: nu le decide pentru toate facturile deschise. După corectarea regulilor, pe o singură factură: `apply_invoice_saved_mappings`.

## 7. Regulile memorate: corectare, conflicte, mutare, reparare

- Citire: `list_mapping_rules` (`search`, `supplierId`, `productId`; pe pagini cu `nextPage`), `get_mapping_rule`, `get_mapping_rule_history`. `posOwned:true` = regula vine din Symbai POS; se corectează acolo.
- Ordinea între regulile care se potrivesc: ultima decizie confirmată, apoi regula preferată, apoi `priorityOrder`. Ca utilizatorul să păstreze una singură, nu te baza pe `isPreferred`/`priorityOrder`: folosește `resolve_supplier_product_mapping_conflict` sau `delete_mapping_rule` pe cea concurentă.
- Corectare: `update_mapping_rule` (produs, cont, factor TOTAL) sau `delete_mapping_rule`, după acordul utilizatorului. Când schimbi produsul regulii și factorul rămâne valabil pentru produsul nou, trimite `packMultiplier` împreună cu `packFactorConfirmationVersion:1`; altfel factorul vechi se golește. O regulă greșită se reaplică pe fiecare factură nouă până o corectezi; nu remapa linie cu linie la nesfârșit.
- Conflicte pe un articol al furnizorului: `list_supplier_product_mapping_conflicts` → `resolve_supplier_product_mapping_conflict` cu `supplierProductId` (din listă), `keepRuleId` sau `keepProductId` și `mode` (`demote` sau `delete`). Conflictele din `list_mapping_rule_conflicts` (aceeași denumire, decizii diferite) nu au `supplierProductId`: se rezolvă cu `update_mapping_rule` sau `delete_mapping_rule`, după acordul utilizatorului.
- Produs dublat sau înlocuit: `preview_mapping_rule_repoint` cu `moves` (produs vechi → produs nou). Arată-i utilizatorului ce se mută, ce se unifică și ce rămâne, apoi, cu acordul lui, `repoint_product_mapping_rules` cu aceleași argumente.
- Facturi deschise mapate după o regulă greșită: `preview_invoice_mapping_repairs` (`dateFrom`, `dateTo`, opțional `supplierId`, `ruleIds`; pagini cu `afterId`). Arată schimbările înainte/după pe fiecare document, apoi `apply_invoice_mapping_repair` cu tokenul acelui document. Liniile din `failed[]` rămân pentru utilizator. Documentele înregistrate apar ca probleme și nu se repară aici: urmează secțiunea 10.
- Conversii de ambalaj învățate greșit: `list_pack_conversions` → `delete_pack_conversion`. Facturile deja mapate nu se schimbă.
- `create_mapping_rule` rar: regulile se învață din decizii. Caută întâi; o denumire existentă cu altă decizie e refuzată cu `MAPPING_RULE_IDENTITY_EXISTS` și `existingRuleId`.

## 8. Recepția: gestiune, dată, livrare deja primită

- Un NIR intră într-o singură gestiune: pe factură (`update_incoming_invoice_context` cu `warehouseId`) sau pe linie (`set_invoice_line_reception_warehouse` cu `warehouseId`). Toate liniile de marfă ale unui NIR merg în aceeași gestiune; o linie împărțită (`splits`) pe mai multe gestiuni blochează NIR-ul (`multiple_warehouses`). Gestiunea trebuie să fie a aceluiași brand și aceleiași locații cu factura. Nu ghici gestiunea când firma are mai multe: întreabă o dată.
- Data recepției: `update_incoming_invoice_context` cu `receiptDate` (nu în viitor, într-o lună deschisă).
- **Nu recepționa de două ori.** Întrebarea `receipt_reconciliation` sau refuzul `EFACTURA_RECEIPT_RECONCILIATION_REQUIRED` înseamnă că o recepție a aceluiași furnizor, cu aceleași produse, poate fi chiar această livrare. Citește `list_invoice_receipt_candidates` și arată-i utilizatorului candidații (număr, dată, gestiune, produse comune). Dacă e aceeași livrare, o leagă el din aplicație (**Intrări → Reconciliere**). Dacă nu e, `dismiss_invoice_receipt_candidate` cu motivul spus de el (minim 8 caractere) și `acknowledged:true`. Decizia îi aparține lui.
- Verificarea fizică: `record_invoice_physical_reception` consemnează numai ce a raportat utilizatorul (`match`/`diff`, cantități, produse în plus). Produsele în plus se înregistrează separat înainte de NIR.

## 9. Aprobă, previzualizează, înregistrează

1. `approve_incoming_invoice(id, confirm:true)` când decizia nu mai are întrebări.
2. `preview_incoming_invoice_posting(invoiceId)`: calea (`nir`, `accounting_only`, `official_credit_note`, `delivery_note_nir`, `adopt_source_reception`), pe fiecare linie stoc sau cheltuială, cantitatea și prețul în unitatea produsului, contul și sursa lui, gestiunea, totalurile. Arată utilizatorului esențialul înainte de prima înregistrare dintr-o serie.
3. Înregistrează cu unealta din `posting.tool`: `post_incoming_invoice_to_nir` (marfă) sau `post_incoming_invoice_accounting` (servicii, cheltuieli, nota de credit a furnizorului în condițiile din secțiunea 10). Niciodată amândouă. La valută: `exchangeRateConfirmation` copiat exact din `get_incoming_invoice_exchange_rate`.
4. Refuzurile au `documentIssues[]` și `lineIssues[]` (linia, codul, mesajul, remedierea). Rezolvă exact ce spun, apoi reia o singură dată.
5. Verifică: `get_incoming_invoice(id)` are `nirDocumentId` sau `billId` și starea `posted`; `get_invoice_intake_decision` arată `done`.

Cererea utilizatorului „introdu / finalizează facturile” autorizează `confirm:true` pentru pașii obișnuiți: cazurile clare, aprobarea, previzualizarea și înregistrarea. Întrebi numai pentru fapte lipsă și continui celelalte facturi.

## 10. Documente deja înregistrate: corecția

O factură cu NIR sau cu notă contabilă nu se remapează și nu se editează; decizia ei are `phase:"done"`. Calea corecției depinde de document și de cine a greșit.

**a) Document introdus manual (ciornă, poză, PDF), fără factura electronică din SPV: storno integral.**
1. `preview_incoming_invoice_full_storno(invoiceId)`: dacă se poate (`eligible`), blocajele, data minimă și cea propusă, nota și NIR-ul afectate.
2. Arată-i utilizatorului efectul și obține acordul explicit pentru stornare. Apoi `full_storno_incoming_invoice` cu `documentDate`, `registrationDate` (lună deschisă) și `reason`.
3. Introdu documentul corect și reia fluxul. Corectează și regula care a produs greșeala.

Plățile și decontările se anulează înaintea stornării. Lunile închise rămân protejate.

**b) Factura electronică oficială (din SPV), greșită chiar pe document.** Nu se stornează intern: previzualizarea arată `OFFICIAL_SUPPLIER_CREDIT_NOTE_REQUIRED`. Corecția este nota de credit a furnizorului, importată din SPV. `post_incoming_invoice_accounting` o înregistrează numai când:
- liniile sunt servicii sau cheltuieli pe conturi din grupele 61–69 (nu 60x);
- factura inițială nu are NIR și nici produse cu stoc;
- nu este vorba de TVA la încasare sau de cheltuieli în avans (471).

O notă de credit pentru marfă sau pe alte conturi decât grupele 61–69 este refuzată cu `SUPPLIER_CREDIT_NOTE_REQUIRES_RETURN_WORKFLOW`, iar una cu TVA la încasare sau cheltuieli în avans cu `SUPPLIER_CREDIT_SPECIAL_REGIME_UNSUPPORTED`. Acestea nu se pot finaliza prin conexiunea MCP: oprește-te și predă-le contabilului, cu factura inițială, nota de credit și liniile afectate. Nu ocoli refuzul prin alt tool; returul de stoc prin MCP nu se face pe o recepție deja facturată.

**c) Greșeală internă pe o factură din SPV deja înregistrată** (produs, factor sau cont greșit la mapare). Furnizorul nu a greșit, deci nu îi cere notă de credit.
1. Arată-i utilizatorului și contabilului dovezile: factura, NIR-ul sau nota, liniile afectate, valorile înregistrate și cele corecte (produs, cantitate, factor, cont).
2. Corectează regula care a produs greșeala (secțiunea 7), ca facturile următoare să iasă corect.
3. Spune clar că documentul deja înregistrat îl corectează contabilul. Nu încerca să-l modifici prin alte unelte.

## 11. Facturile din Symbai POS

Când firma introduce facturile prin Symbai POS, Accounting refuză scrierile pe ele (`POS_INVOICE_SOURCE_LOCKED`), cu excepția lunilor deja predate contabilității. Maparea și recepția se fac atunci în POS, cu skill-ul `receptie-factura-furnizor` pe conexiunea Symbai POS; regulile `posOwned` se corectează tot acolo. `handoff_incoming_invoice_to_pos` (cu `warehouseId`, gestiunea POS în care intră marfa) predă o factură verificată și aprobată recepției din POS, numai la cererea utilizatorului; după predare se continuă în POS.

## 12. Ecranul live Sym (utilizatorul are pagina deschisă)

Pe **Revizie AI** (`/inventory/ai-review`, un rând pe linie de factură) și pe **Reguli mapare → De mapat** (`/inventory/mapping-rules`, un rând pe articol), lucrezi sub ochii utilizatorului. Merge numai pe conexiunea nominală a persoanei care are pagina deschisă.

- `ecran_citeste`: pagina (`paginaCheie`), rândurile vizibile în ordine („rândul 4”), rândul de sub mouse, filtrele, întrebările deschise și replicile necitite (`deLaUtilizator`). `detalii:"nemapate"` dă următoarele rânduri de lucrat. Folosește-l când utilizatorul spune „ăsta”, „rândul 3”, „mapează ce vezi” sau mesajul conține „[Ecran Sym: …]”.
- `ecran_arata`: `evidentiaza` (culori și etichete scurte), `intreaba` (întrebarea chiar sub rând, cu până la 6 variante-buton reale și câmp de text), `deruleaza`, `noteaza` (o frază de stare: „Am mapat 6, mai am 3”), `curata`. Dacă răspunsul e `inAsteptare`, continuă cu `ecran_citeste(asteaptaRaspunsSecunde: 50)`; după aproximativ 3 minute fără răspuns, încheie cu o frază scurtă.
- `ecran_mapeaza` (Revizie AI, cu `pagina:"facturi"` luat din `paginaCheie` al `ecran_citeste`; `confirm:true` numai după cererea sau acordul utilizatorului): dacă utilizatorul a schimbat între timp pagina, nu se scrie nimic și recitești ecranul. Salvează rândurile încărcate pe pagină prin aceeași validare ca aplicația; decizia se învață ca regulă. Un răspuns cu `intrebareNecesara` (unitatea) se pune pe rând cu `ecran_arata(intreaba)`, apoi reapelezi cu factorul confirmat. Un răspuns dat pe rând confirmă numai acel rând.
- `ecran_propune` (De mapat): pregătește alegerea ta pe rând, **nesalvată**; utilizatorul o aplică pe toate facturile deschise dintr-un clic sau o respinge. Conversia: `stockUnitsPerSupplierUnit` (factor TOTAL) sau `keepSupplierPack`. Rezultatul spune ce a aplicat, a schimbat sau a respins el (`propuneriRezolvate`). Cheltuielile ale căror linii n-ar păstra tipul se mapează pe Revizie AI.
- `ecran_finalizeaza` (Revizie AI): înregistrează o factură aprobată întreagă (NIR sau doar contabil). Cere dreptul `contabilitate`, iar pentru o factură cu marfă și `stocuri`. Candidații de recepție îi arăți utilizatorului; decizia e a lui.

Întrebări scurte și concrete, cu variantele reale: „Roșii cherry 250 g → Roșii cherry (kg) sau Roșii (kg)?”, „1 BAX = câte buc?”.

## 13. Când întrebi și când continui singur

Continui singur, fără întrebare:
- linia are o dovadă clară (cod de bare, codul articolului, regulă confirmată de istoric);
- documentul arată factorul („BAX/24”, „6x1,5L”, cantitatea netă);
- refuzul serverului spune exact ce să corectezi și ai datele.

Întrebi utilizatorul (o întrebare pe subiect, cu variantele concrete), apoi treci la liniile următoare:
- factorul nu reiese din document sau istoric;
- două produse sunt la fel de plauzibile sau istoricul se contrazice;
- produsul lipsește și trebuie creat;
- gestiunea nu e determinată;
- o recepție existentă poate fi aceeași livrare;
- tratamentul transportului, al unei reduceri sau al unei sume negative nu reiese din document sau din practica firmei;
- o acțiune ireversibilă: storno, ștergerea sau mutarea regulilor, aplicarea reparațiilor, ștergerea unei ciorne.

Nu inventa produse, conturi, factori, gestiuni, numărători fizice sau date de pe document.

## 14. Raportul

La final spune, cu cifre: câte facturi s-au înregistrat (NIR sau contabil, cu numerele lor), câte linii s-au mapat și câte reguli s-au învățat sau corectat, ce a rămas blocat și de ce (motivul și ce trebuie decis), plus orice regulă sau produs care pare greșit. Nu raporta „gata” fără recitire.

## Capcane

- **Marfă intrată de două ori**: un al doilea NIR pentru aceeași livrare. Verifică întotdeauna candidații de recepție.
- **Cantitate de 12 ori prea mare sau prea mică**: factor greșit sau lipsă. Pe factura neînregistrată remapezi cu factorul corect. Pe cea înregistrată urmezi secțiunea 10: documentul manual se stornează; la factura din SPV arăți dovezile contabilului și nu ceri furnizorului notă de credit pentru o greșeală de mapare. Corectează și regula.
- **„Am acceptat tot, dar NIR-ul nu merge”**: citește decizia și `lineIssues`; de regulă lipsește gestiunea, o întrebare de unitate sau contul liniei diferă de contul produsului.
- **Serviciu pe cont de marfă**: remapează linia pe tipul de cheltuială; nu schimba tipul unui produs folosit de toată firma pentru o singură factură.
- **Cont greșit la marfă**: contul vine din tipul produsului. Dacă tipul e greșit, spune-i contabilului; schimbarea tipului mută contul de stoc pentru tot produsul.
- **„Am corectat regula și facturile vechi au rămas la fel”**: corect. Cele deschise se repară cu previzualizarea reparațiilor; cele înregistrate urmează secțiunea 10.
