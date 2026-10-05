# Facturi primite: mapare, recepție (NIR) și corecții — referință

Referința pentru skill-ul `receptie-factura`. Explică ce înseamnă stările, codurile și răspunsurile uneltelor din fluxul facturilor de la furnizori în Symbai Accounting. Ghidul live, mereu la zi cu versiunea instalată, este resursa MCP `symbai://mapare-facturi` (sau unealta `get_invoice_mapping_guide`, cu `topic` opțional: `flux`, `factor`, `cheltuieli`, `linii_identice`, `reguli`, `receptie`, `corectii`, `pos`, `unelte`). Când ghidul live și acest fișier diferă, ghidul live are dreptate.

## Pe scurt

O factură primită devine stoc și notă contabilă în această ordine:

1. **Intră în aplicație**: import din SPV (e-Factura), ciornă din email/poză/PDF sau aviz.
2. **Se mapează fiecare linie**: marfa pe un produs din nomenclator (cu factorul de conversie corect), serviciile și cheltuielile pe un tip de cheltuială (adică pe un cont).
3. **Se aprobă** factura, după ce decizia de intrare nu mai are întrebări.
4. **Se înregistrează o singură dată**, pe calea potrivită: **NIR** (marfă care intră în stoc, plus nota contabilă) sau **doar contabil** (servicii, cheltuieli, nota de credit a furnizorului pentru servicii). Niciodată amândouă pentru aceeași factură.
5. **Se verifică** prin recitire: factura are NIR sau notă contabilă și starea „posted”.

Stocul se mișcă numai la înregistrarea NIR-ului. O factură mapată, chiar acceptată integral, nu a modificat încă nici stocul, nici contabilitatea.

## Paginile din aplicație

| Meniu | Ce faci acolo |
|---|---|
| **Intrări** → Facturi Furnizori | Factura deschisă linie cu linie: mapare, împărțire, absorbție, gestiuni, aprobare, NIR, storno. |
| **Intrări** → Avize & Draft | Avize și ciorne (poze, documente introduse manual). |
| **Intrări** → Reconciliere | Legarea unei facturi de recepția sau avizul care a adus deja marfa; diferențele dintre factură și recepție. |
| **Intrări** → Recepții (NIR) | NIR-urile create. |
| **Revizie AI** | Toate liniile facturilor deschise într-o singură listă, cu propunerile motivate. Aici lucrează și ecranul live Sym. |
| **Reguli mapare** → De mapat | Câte un rând pe articol al furnizorului, cu toate liniile lui din facturile deschise: o decizie pentru toate. |
| **Reguli mapare** → Reguli învățate | Memoria sistemului: reguli, conflicte, mutarea regulilor de pe un produs pe altul, repararea facturilor neînregistrate. |
| **Calitate inbox** | Facturi fără NIR, ciorne vechi, mapări slabe. |

## Decizia de intrare a facturii

`get_invoice_intake_decision(invoiceId)` (sau `list_invoice_intake_decisions` pentru toate facturile deschise, paginat cu `offset=nextOffset` până `hasMore:false`) spune ce mai lipsește:

- `phase`: `ready` (gata de aprobare/înregistrare), `needs_decision` (sunt întrebări), `blocked` (nu se lucrează aici: anulată, înlocuită, predată recepției din Symbai POS, administrată din Symbai POS), `done` (înregistrată: are NIR sau notă contabilă; corecția urmează secțiunea „Documentele înregistrate”).
- `posting.route` și `posting.tool`: calea înregistrării (vezi tabelul de mai jos). `posting.routeFinal:false` înseamnă că liniile încă nemapate pot schimba calea.
- `questions[]`: fiecare are `code`, `ask` (ce lipsește și cum se rezolvă), `lineIds`, `resolvers` (uneltele de folosit), uneori `serverCode` (refuzul pe care l-ar da aprobarea sau înregistrarea) și `details`.
- `requirements[]`: condiții de la înregistrare, de exemplu `exchange_rate_confirmation` (factura în valută) sau `receipt_reconciliation_provisional`.
- `nextSteps[]` și `lines` {`total` (toate liniile documentului), `economic` (liniile cu valoare proprie, fără cele împărțite sau absorbite), `decided` (mapate și confirmate), `unmapped` (fără produs sau cont, inclusiv cele cu un produs nou sau o cheltuială doar propuse), `unaccepted` (mapate, dar neconfirmate)}.

### Codurile întrebărilor, pe grupe

| Grupă | Coduri | Ce faci |
|---|---|---|
| Documentul nu se lucrează aici | `posted`, `superseded`, `cancelled`, `pos_owned`, `pos_reception_handoff` | Înregistrată (`posted`, faza `done`): corecția după secțiunea „Documentele înregistrate”. Înlocuită: lucrezi pe documentul care o înlocuiește. Din POS: se lucrează în POS. |
| Antet | `currency_invalid`, `country_invalid`, `invoice_date_invalid`, `invoice_number_missing`, `supplier_missing`, `period_closed` | `update_incoming_invoice_context`, cu datele de pe document. Furnizorul se caută după cod fiscal (`list_suppliers`) înainte să fie creat (`create_supplier`). |
| Liniile documentului | `no_lines`, `line_values_invalid`, `vat_evidence_missing`, `vat_account_invalid`, `totals_mismatch` | `add_incoming_invoice_line`, `update_incoming_invoice_line`, `absorb_invoice_line`. Valorile vin de pe document; nu se inventează. |
| Maparea | `lines_unmapped`, `lines_unaccepted`, `pending_new_product`, `pending_expense`, `mapped_product_invalid`, `mapped_product_inactive`, `product_type_without_stock`, `unit_question`, `purchase_account_invalid`, `inventory_account_requires_product`, `discount_account_sign` | Fluxul de mapare de mai jos. |
| Recepția | `receipt_reconciliation`, `warehouse_missing`, `multiple_warehouses`, `warehouse_unit_mismatch`, `warehouse_split_mismatch`, `stock_account_mismatch`, `stock_account_unresolved`, `delivery_note_product_required`, `physical_extras_unresolved` | Gestiune, recepții existente, conturi de stoc, avize. |

## Căile de înregistrare

`preview_incoming_invoice_posting(invoiceId)` arată calea fără să scrie nimic: pentru fiecare linie destinația (`stock`, `expense`, nedecis sau `not_applicable` la o factură deja înregistrată sau blocată), cantitatea și prețul convertite în unitatea produsului cu factorul folosit, gestiunea, contul și sursa lui, plus totalurile exacte și blocajele rămase.

| `posting.route` | Ce înseamnă | Unealta |
|---|---|---|
| `nir` | Factura are marfă care intră în stoc: NIR plus nota contabilă, într-o singură tranzacție. | `post_incoming_invoice_to_nir` |
| `accounting_only` | Numai servicii și cheltuieli, nicio linie pe produs cu stoc. | `post_incoming_invoice_accounting` |
| `official_credit_note` | Nota de credit a furnizorului din SPV, legată de factura inițială. Nu intră pe NIR. Se înregistrează numai pentru servicii și cheltuieli (conturi din grupele 61–69), când factura inițială nu are NIR sau stoc și nu e cu TVA la încasare sau cheltuieli în avans; altfel refuz (vezi „Documentele înregistrate”). | `post_incoming_invoice_accounting` |
| `delivery_note_nir` | Aviz de însoțire: marfa intră în stoc; fiecare linie trebuie să fie pe un produs. | `post_incoming_invoice_to_nir` |
| `adopt_source_reception` | Factura generată dintr-o recepție deja făcută: se refolosește recepția, fără al doilea NIR. | `post_incoming_invoice_to_nir` |

Un NIR intră într-o singură gestiune. Gestiunea vine din linie (`set_invoice_line_reception_warehouse` cu `warehouseId`) sau din factură (`update_incoming_invoice_context` cu `warehouseId`). Toate liniile de marfă ale unui NIR merg în aceeași gestiune; o linie împărțită (`splits`) pe mai multe gestiuni blochează NIR-ul (`multiple_warehouses`). La marfa care intră în stoc, contul liniei este contul de NIR al produsului; alt cont dă `stock_account_mismatch`. Alt cont se alege numai pentru produsele fără stoc sau pe liniile de cheltuială; un cont de produs greșit înseamnă tip de produs greșit și se spune contabilului. Data NIR-ului este data recepției, dacă a fost aleasă (`receiptDate`), altfel data contabilă.

## Factorul de conversie: TOTAL

În Symbai Accounting `packMultiplier` este factorul **TOTAL**: câte unități de stoc ale produsului (unitatea din nomenclator) înseamnă **o** unitate a furnizorului, exact cum e scrisă pe linia facturii, cu pasul de unitate inclus.

| Pe factură | Produsul ținut în | Factor |
|---|---|---|
| 1 bax (12 sticle) | buc | 12 |
| 1 sac de 25 kg, facturat la bucată | kg | 25 |
| 1 sac de 25 kg, facturat la bucată | g | 25000 |
| kg | g | 1000 (pasul exact se aplică singur; poți omite factorul) |
| kg (KGM) | kg | fără factor |
| bax, iar produsul e ținut tot în baxuri | bax | fără factor (`noPackSplit:true` numai când unitățile sunt aceleași) |

- Nu înmulți separat ambalajul cu pasul de unitate și nu retrimite cifra unui ecran: trimite rezultatul final.
- Cantitatea se înmulțește cu factorul, prețul unitar se împarte, valoarea liniei rămâne exact cea de pe factură.
- Cel mult 4 zecimale (`0.24` sau `"0,24"`).
- La schimbarea produsului factorul vechi se șterge: trimite factorul noului produs în același apel.
- **Nu există 1:1 implicit** când unitățile nu se pot converti singure (bax → buc, buc → kg, l → kg). Salvarea răspunde cu întrebarea de unitate, iar NIR-ul nu se face până nu e lămurită.

### Întrebarea de unitate (`PACK_CONVERSION_REQUIRED`)

Refuzul 409 aduce `question {kind, supplierUnit, productUnit, suggestedFactor?}`; `kind` este `pack_factor` (ambalaj) sau `unit_dimension` (de exemplu litri în kilograme). Ordinea corectă:

1. Caută dovada în document: denumirea („6x1,5L”, „SAC 25KG”, „BAX/24”), cantitatea netă declarată, codul articolului.
2. Caută în istoric: factorul TOTAL folosit pe același articol la același furnizor (`get_supplier_mapping_context`) și conversiile învățate (`list_pack_conversions`).
3. Dacă dovada e clară, retrimite `map_incoming_invoice_line` cu `packMultiplier`.
4. Altfel întreabă exact: „1 {supplierUnit} = câți {productUnit}?”. `suggestedFactor` este doar un indiciu, nu o dovadă.

Alte refuzuri ale factorului:

- `PACK_FACTOR_CONTRADICTS_UNIT_DIMENSION`: factorul contrazice un pas exact (de exemplu 1 kg trimis ca 1 g). Recitește unitățile.
- `PACK_FACTOR_CONTRADICTS_IDENTICAL_UNITS` și `PACK_FACTOR_CONTRADICTS_DOCUMENT_MULTIPACK`: factorul nu se potrivește cu documentul. Numai utilizatorul îl poate confirma, în aplicație; asistentul nu îl forțează.
- `PACK_FACTOR_INVALID`: numărul nu e valid (zero, negativ, prea multe zecimale).

## Propunerile și dovezile unei linii

- `get_invoice_line_mapping_suggestions(lineId)`: propunerile în ordinea motorului (cod de bare, codul articolului la furnizor, regula salvată cu aceeași denumire, o corecție de citire, potriviri parțiale, regulile generale, memoria conturilor, catalogul). Fiecare are `source`, `reason`, `confidence`, `trustTier`, `autoApplicable`, contul, factorul TOTAL și avertismentele. `autoApplicable:true` există numai pentru o regulă salvată fără avertismente. `ruleResolution.conflict` înseamnă decizii salvate diferite pentru aceeași denumire: nu alegi singur.
- `get_supplier_mapping_context(lineId)`: dovezile complete: linia (valori, TVA, reduceri, absorbții), natura ei (marfă, garanție SGR, reducere, serviciu) ca indiciu, istoricul aceluiași articol la același furnizor, regulile cu aceeași denumire, ce alege motorul, produsele candidate cu unitatea de stoc și rețetele în care intră, plus avertismentele (istoric contradictoriu, factor diferit, produs inactiv, tip fără stoc). Este pe pagini: continuă cu `coverage.next` (`historyOffset`, `ruleOffset`, `recipeOffset`). O pagină goală cu `next` nenul nu dovedește lipsa istoricului.

Ce cântărește cât:

- **Dovadă**: cod de bare identic, codul articolului la furnizor, aceeași decizie confirmată de mai multe ori în istoric, documentul însuși.
- **Indiciu**: denumire asemănătoare, procent de potrivire, o singură apariție veche, propunerea AI.
- **O regulă salvată este o dovadă, nu un adevăr de neatins.** Dacă istoricul o contrazice, semnalează contradicția și nu o aplica orbește.

## Liniile identice

`map_incoming_invoice_line` aplică decizia **unei persoane** (`accepted:true` cu `source:"manual"`) și liniilor identice ale aceleiași facturi: același cod al furnizorului sau aceeași denumire, aceeași unitate, aceeași natură.

- `identicalLines` lipsă: liniile neacceptate primesc maparea și se acceptă; cele acceptate automat pe alt produs se corectează și revin la verificare.
- `"accept"`: le corectezi și rămân acceptate.
- `"skip"`: numai linia cerută.
- Răspunsul are `propagation {updated, skippedHumanDecisions, failed}`. Deciziile luate de o persoană nu se rescriu niciodată.
- O mapare a asistentului fără `source:"manual"` se salvează ca propunere acceptată a asistentului: nu învață regula și nu se propagă la liniile identice. Mapează-le separat sau folosește `apply_invoice_saved_mappings`.

## Ce învață sistemul

- Regulile se învață numai din deciziile confirmate de utilizator: `map_incoming_invoice_line` cu `source:"manual"` și decizia luată pe „De mapat” (`map_supplier_product_on_open_invoices` cu `userConfirmed:true`, care învață o dată, pe linia reprezentativă).
- Răspunsul de la „De mapat” spune dacă regula s-a învățat: `ruleSaved` (la `false`, motivul e în `ruleSkippedReason`). `remaining` > 0 înseamnă că grupul are mai multe linii decât se aplică într-un apel: recitește `list_supplier_products_to_map` și repetă cu noul `representative.lineId`; cel vechi răspunde `MAPPING_WORKBENCH_LINE_STALE`.
- Propunerile acceptate de asistent (`source` `rule`, `import`, `ai` sau lipsă) nu învață regula.
- Ordinea între regulile care se potrivesc: ultima decizie confirmată, apoi regula preferată (`isPreferred`), apoi `priorityOrder` (numărul mai mic trece înainte). Doar `isPreferred` sau `priorityOrder` nu fac o regulă să câștige. Ca să rămână una singură: `resolve_supplier_product_mapping_conflict` (o face preferată și ultima folosită) sau `delete_mapping_rule` pe cea concurentă.
- Conflictele pe un articol al furnizorului vin din `list_supplier_product_mapping_conflicts` și se rezolvă cu `resolve_supplier_product_mapping_conflict(supplierProductId, keepRuleId sau keepProductId, mode)`; `supplierProductId` vine numai din această listă. Conflictele din `list_mapping_rule_conflicts` (aceeași denumire, decizii diferite) se rezolvă cu `update_mapping_rule` sau `delete_mapping_rule`, după acordul utilizatorului.
- Regulile cu `posOwned:true` vin din Symbai POS și se corectează numai acolo.
- O regulă nouă sau corectată nu schimbă facturile deja înregistrate.

## Accept-all: motivele liniilor rămase

`accept_invoice_ai_suggestions(invoiceId)` acceptă numai propunerile sigure. Contul fiecărei linii cu produs se aduce la contul tipului produsului (`corrected[]`: linia, contul vechi, contul nou). Liniile rămase sunt în `blocked[]`, cu `reason`, `message` și `nextAction`. Un răspuns cu zero linii acceptate nu este un succes.

| `reason` | Ce înseamnă | Ce faci |
|---|---|---|
| `no_product` | Linia nu are produs sau cont. | Mapează pe produs sau pe tip de cheltuială. |
| `pending_new_product` | E propus un produs nou. | Caută întâi unul existent (`list_products`); `accept_invoice_proposed_product` numai dacă chiar nu există. |
| `pending_expense` | E propusă doar o cheltuială. | Confirmă tipul de cheltuială (`list_expense_destination_types`, `map_incoming_invoice_line` cu `productTypeCode`). |
| `saved_decision_conflict` | Deciziile salvate duc la produse diferite. | Alege produsul pe linie, individual; apoi curăță regula concurentă. |
| `inactive_product` | Produsul ales e dezactivat. | Alege un produs activ. |
| `no_account` | Produsul nu are cont de intrare. | Contul vine din tipul produsului; spune contabilului ce tip trebuie completat sau alege contul pe linie. |
| `invalid_account` | Contul nu e un cont activ de achiziții. | Alege un cont valid. |
| `inventory_account_without_product` | Cont de stoc (clasa 3) fără produs. | Pune produsul cu stoc sau un cont de cheltuială. |
| `reception_requires_product` | Linia vine dintr-o recepție. | Păstrează produsul din recepție. |
| `nature_conflict` | Natura liniei (de exemplu garanție SGR) nu se potrivește cu produsul. | Mapează linia pe natura ei reală. |
| `food_line_no_stock` | Aliment sau băutură pe un produs fără stoc. | Alege un produs cu stoc; alimentele nu devin cheltuieli. |
| `unit_incompatible` | Unitatea nu se convertește singură. | Întrebarea de unitate (factor TOTAL). |
| `pack_factor_unverified` | Factorul propus nu se confirmă din factură. | Verifică factorul și confirmă linia individual. |
| `low_confidence` | Propunere nesigură. | Verifică linia cu dovezile și confirm-o individual. |
| `split_parent` | Linia e împărțită. | Lucrează pe sublinii. |
| `absorbed` | Linia e inclusă în costul altei linii. | Nu se acceptă separat. |

## Servicii, cheltuieli, garanții și reduceri

- **Servicii, utilități, chirie, transport facturat separat**: fără produs. `list_expense_destination_types` (cu `brandId` și `locationId` ale facturii) dă tipurile de cheltuială ale firmei, fiecare cu contul implicit și conturile permise (`eligibleAccountCodes`). Trimite `productTypeCode` și, dacă vrei alt cont decât cel implicit, un `accountCode` din listă. Refuzuri: `EXPENSE_TYPE_NOT_AVAILABLE` (tipul nu e configurat), `EXPENSE_ACCOUNT_NOT_ON_TYPE` (contul nu aparține tipului). Fără tipuri configurate, linia de serviciu se mapează direct pe un cont valid.
- **Cont de stoc fără produs**: refuzat (`INVENTORY_ACCOUNT_REQUIRES_PRODUCT`). O linie pe clasa 3 cere un produs cu stoc.
- **Alimente și băuturi** (capitolele NC 01–24): nu devin cheltuieli și nu se pun pe produse fără stoc.
- **Garanția SGR** (0,50 lei pe ambalaj, HG 1074/2021): nu este marfă; mapată pe produsul de marfă dă `LINE_NATURE_CONFLICT`. Se mapează pe tipul sau contul pe care firma îl folosește pentru garanții; dacă nu e clar care, întreabă contabilul.
- **Reduceri**: o reducere pe factură se distribuie pe liniile de marfă cu `absorb_invoice_line` (strategie proporțională, egală sau pe o singură linie). Conturile 609 (reduceri ulterioare) și 767 (sconto) se folosesc numai pe linii negative (OMFP 1802/2014); altfel `DISCOUNT_ACCOUNT_REQUIRES_NEGATIVE_LINE`. O sumă negativă singură nu dovedește o reducere: poate fi un retur, o corecție sau o garanție.
- **Transport sau altă cheltuială pe o factură de marfă**: fie intră în costul mărfii (`absorb_invoice_line` pe liniile de marfă), fie rămâne cheltuială separată. E o alegere de politică contabilă: urmează practica firmei sau întreabă.
- **O linie cu două lucruri** (două articole, o factură de utilități pe mai multe locații): `split_invoice_line` după cantitate (`count` + `quantities`) sau după valoare (`lineTotals`, cu suma exact egală cu valoarea liniei; `productIds` opțional). Factura revine la verificare. `undo_invoice_line_split` anulează.
- **Cheltuiala pe mai multe unități**: `set_invoice_expense_allocations` sau `set_invoice_line_expense_allocations` (procente cu suma 100).

## Recepții care pot fi aceeași livrare

Același transport poate ajunge de două ori: o recepție sau un aviz deja înregistrat în stoc, apoi factura. Ca marfa să nu intre de două ori, NIR-ul este refuzat cu `EFACTURA_RECEIPT_RECONCILIATION_REQUIRED` (cu `receiptCandidates`) când o recepție aplicată și nefacturată a aceluiași furnizor are aceleași produse.

- `list_invoice_receipt_candidates(invoiceId)` arată candidații și deciziile deja salvate.
- **Este aceeași livrare**: utilizatorul leagă factura de recepție din aplicație (**Intrări → Reconciliere**). Nu crea al doilea NIR.
- **Nu este aceeași livrare**: `dismiss_invoice_receipt_candidate` cu `receiptDocumentId`, motivul spus de utilizator (cel puțin 8 caractere) și `acknowledged:true`. Decizia rămâne în auditul facturii. Fără decizia lui explicită, nu o salva.
- La facturile în valută verificarea definitivă se face la înregistrare, cu cursul confirmat; de aceea decizia poate avea cerința `receipt_reconciliation_provisional`.

## Facturile din Symbai POS

Când firma introduce facturile prin Symbai POS, scrierile pe facturi din Accounting sunt refuzate (`POS_INVOICE_SOURCE_LOCKED`), cu excepția lunilor pe care POS le-a predat deja contabilității. Maparea și recepția se fac atunci în POS, cu skill-ul `receptie-factura-furnizor` pe conexiunea Symbai POS. O factură predată recepției din POS (`POS_RECEPTION_HANDOFF_ACTIVE`, întrebarea `pos_reception_handoff`) se continuă în POS. Predarea unei facturi verificate și aprobate către recepția POS (`handoff_incoming_invoice_to_pos`, cu `warehouseId`, gestiunea POS în care intră marfa) se face numai la cererea utilizatorului.

## Documentele înregistrate

O factură cu NIR sau cu notă contabilă nu se remapează și nu se editează. Calea corecției depinde de document și de cine a greșit.

| Situația | Corecția |
|---|---|
| Document introdus manual (ciornă, poză, PDF), fără factura electronică din SPV | Storno integral, pașii de mai jos. |
| Factura electronică din SPV, greșită chiar pe document (prețul, cantitatea, articolul facturat) | Nota de credit a furnizorului, importată din SPV. Se înregistrează prin MCP numai în condițiile de mai jos; altfel o finalizează contabilul. |
| Factura electronică din SPV, înregistrată cu o greșeală internă (produs, factor sau cont greșit la mapare) | Nu se cere notă de credit furnizorului. Arată dovezile utilizatorului și contabilului, corectează regula pentru facturile următoare; documentul înregistrat îl corectează contabilul. |

**Storno integral** (numai documentele fără factura electronică din SPV):

1. `preview_incoming_invoice_full_storno(invoiceId, documentDate?, registrationDate?)`: `eligible`, blocajele, data minimă și cea propusă, nota și NIR-ul afectate.
2. `full_storno_incoming_invoice` cu `documentDate`, `registrationDate` (într-o lună deschisă) și `reason`, după acordul utilizatorului.
3. Se introduce documentul corect și se parcurge din nou fluxul.

**Nota de credit a furnizorului** (calea `official_credit_note`, unealta `post_incoming_invoice_accounting`) se înregistrează numai când:

- liniile sunt servicii sau cheltuieli pe conturi din grupele 61–69 (nu 60x);
- factura inițială nu are NIR și nici produse cu stoc;
- nu este vorba de TVA la încasare sau de cheltuieli în avans (471).

O notă de credit pentru marfă sau pe alte conturi decât grupele 61–69 este refuzată cu `SUPPLIER_CREDIT_NOTE_REQUIRES_RETURN_WORKFLOW`; una cu TVA la încasare sau cheltuieli în avans, cu `SUPPLIER_CREDIT_SPECIAL_REGIME_UNSUPPORTED`. Acestea nu se pot finaliza prin conexiunea MCP: asistentul se oprește și le predă contabilului, cu factura inițială, nota de credit și liniile afectate. Returul de stoc prin MCP nu se face pe o recepție deja facturată.

**Greșeala internă pe o factură din SPV**: dovezile pentru contabil sunt factura, NIR-ul sau nota, liniile afectate, valorile înregistrate și cele corecte (produs, cantitate, factor, cont).

Blocaje frecvente în previzualizarea stornării:

| Cod | Ce înseamnă |
|---|---|
| `OFFICIAL_SUPPLIER_CREDIT_NOTE_REQUIRED` | Factura vine din SPV și nu se stornează intern. Dacă furnizorul a greșit documentul, corecția este nota lui de credit; dacă greșeala e la mapare, dovezile merg la contabil. |
| `INCOMING_FULL_STORNO_PAYMENT_REVERSAL_REQUIRED` | Factura are plăți sau decontări; acestea se anulează întâi. |
| `INCOMING_FULL_STORNO_PREPAID_RECOGNITION_EXISTS` | Cheltuiala în avans e deja recunoscută parțial; se inversează întâi. |
| `INCOMING_FULL_STORNO_ALREADY_DONE` | Stornarea există deja. |
| `ACCOUNTING_PERIOD_CLOSED` | Data cade într-o lună închisă. |

Reparațiile după reguli (`preview_invoice_mapping_repairs`) listează documentele înregistrate ca probleme, fără să le modifice.

## Refuzuri la înregistrare

Refuzurile 4xx ale aprobării și înregistrării au `documentIssues[]` și `lineIssues[]`: `lineId`, `lineNumber`, `code`, `message`, `remedy`. Citește-le și rezolvă exact ce spun; nu repeta apelul neschimbat.

Un răspuns cu `outcomeUnknown:true` (pe ecranul live: `rezultatIncert:true`) înseamnă că legătura s-a întrerupt, iar scrierea poate fi deja aplicată. Recitește factura (`get_incoming_invoice`, `get_invoice_intake_decision`) înainte de orice reîncercare; o înregistrare nu se repetă orbește.

| Cod | Ce faci |
|---|---|
| `EFACTURA_RECEIPT_RECONCILIATION_REQUIRED` | Recepții care pot fi aceeași livrare (secțiunea de mai sus). |
| `PACK_CONVERSION_REQUIRED` | Întrebarea de unitate, apoi `map_incoming_invoice_line`. |
| `NIR_WAREHOUSE_REQUIRED`, `INCOMING_INVOICE_WAREHOUSE_UNIT_MISMATCH`, `NIR_WAREHOUSE_SPLIT_QUANTITY_MISMATCH` | Alege gestiunea (din același brand și aceeași locație cu factura) sau corectează împărțirea liniei. |
| `NIR_STOCK_ACCOUNT_MISMATCH` | Linia are alt cont decât contul în care intră produsul la NIR; remapează pe contul produsului (previzualizarea îl arată). Dacă acel cont pare greșit, tipul produsului e greșit: spune-i contabilului. |
| `ACCOUNTING_POSTING_REQUIRES_SERVICE_ONLY` | Factura are marfă: calea este NIR-ul. |
| `SUPPLIER_CREDIT_NOTE_REQUIRES_RETURN_WORKFLOW` | O notă de credit nu intră pe NIR și nici pe înregistrarea contabilă când privește marfă, o factură inițială cu NIR sau stoc ori conturi din afara grupelor 61–69. Nu se poate finaliza prin MCP: oprește-te și predă-o contabilului. |
| `SUPPLIER_CREDIT_SPECIAL_REGIME_UNSUPPORTED` | Nota de credit privește TVA la încasare sau cheltuieli în avans. Nu se poate finaliza prin MCP: predă-o contabilului. |
| `DISCOUNT_ACCOUNT_REQUIRES_NEGATIVE_LINE` | 609/767 numai pe linii negative. |
| `DOCUMENT_SCONTO_ACCOUNT_MISSING` | Contul 767 lipsește din planul de conturi; îl adaugă contabilul. |
| `INCOMING_RECEIPT_DATE_PERIOD_CLOSED` | Data recepției e într-o lună închisă; alege altă dată. |
| `DELIVERY_NOTE_PROVISIONAL_ECONOMICS_REQUIRED` | Fiecare linie de aviz cere maparea confirmată pe un produs, cantitate pozitivă, unitate de măsură și valoare provizorie explicită (preț unitar zero sau mai mare, valoarea liniei mai mare ca zero). Verifică toate aceste câmpuri, nu doar produsul. |
| `POS_INVOICE_SOURCE_LOCKED` | Factura se lucrează în Symbai POS. |

La facturile în valută, înregistrarea cere `exchangeRateConfirmation`, copiat exact din `get_incoming_invoice_exchange_rate`.

## Verificarea fizică

`record_invoice_physical_reception` consemnează ce a constatat utilizatorul la descărcare: `status` `match` sau `diff`, cantitățile numărate pe linii și produsele găsite în plus. Nu finalizează NIR-ul. Produsele găsite în plus (`physical_extras_unresolved`) se înregistrează separat înainte de NIR. Consemnează numai ce a raportat utilizatorul; nu inventa numărători.
