# Plan de conturi RO + monografii contabile uzuale

> Reper de lucru (OMFP 1802/2014). Verifică planul exact al firmei cu `list_accounts`; analiticele pot diferi.

## Clasele de conturi (prima cifră)

| Clasă | Denumire | Natură | Exemple |
|---|---|---|---|
| 1 | Capitaluri, provizioane, împrumuturi | credit (pasiv) | 1012 capital subscris vărsat, 117 rezultat reportat, 121 profit/pierdere, 161 împrumuturi |
| 2 | Imobilizări | debit (activ) | 208/2808 necorporale, 212/2812 construcții, 213/2813 echipamente, 231 imob. în curs |
| 3 | Stocuri și producție în curs | debit (activ) | 301 materii prime, 371 mărfuri, 345 produse finite, 378 adaos comercial |
| 4 | Terți | mixt | 401 furnizori (C), 4111 clienți (D), 4426/4427 TVA, 421 salarii, 431/436 contribuții, 446 alte impozite |
| 5 | Trezorerie | debit (activ) | 5121 cont la bancă, 5311 casa în lei, 5314 casa valută, 581 viramente interne |
| 6 | Cheltuieli | debit | 601 materii prime, 607 mărfuri, 641 salarii, 6451 CAS angajator, 665 dif. curs, 681 amortizare |
| 7 | Venituri | credit | 701/707 vânzări, 704 servicii, 7588 alte venituri, 765 dif. curs favorabile |
| 8 | Conturi speciale | — | 8035 stocuri terți etc. |

**Regula de aur:** Activ + Cheltuieli cresc pe DEBIT; Pasiv + Venituri + Capitaluri cresc pe CREDIT. Rezultat = clasa 7 − clasa 6.

## Monografii (note contabile tipice)

**Vânzare cu factură (TVA 21%):**
- `4111 Clienți = %` (total) · `707 Venituri din vânzarea mărfurilor` (bază) · `4427 TVA colectată` (TVA)
- Descărcare gestiune: `607 Cheltuieli mărfuri = 371 Mărfuri` (cost).

**Cumpărare mărfuri (TVA deductibilă):**
- `% = 401 Furnizori` (total) · `371 Mărfuri` (bază) · `4426 TVA deductibilă` (TVA).

**Încasare client / plată furnizor:**
- `5121 = 4111` (încasare în bancă) · `401 = 5121` (plată din bancă). Casa: 5311.

**Salarii (lunar):**
- Brut: `641 = 421` (salarii datorate).
- Rețineri din salariu: `421 = %` → `4315 CAS (25%)`, `4316 CASS (10%)`, `444 Impozit pe venit (10%)`.
- Contribuția asiguratorie de muncă (CAM, angajator): `646 = 436`.
- Plata netului: `421 = 5121`; viramente contribuții: `431x/444/436 = 5121`.

**Amortizare lunară:** `6811 = 281x` (amortizarea imobilizării).

**TVA la încasare (vat_on_cash):** la facturare TVA e neexigibilă `4428`; la încasare se exigibilizează: `4428 = 4427` (vânzare) / `4426 = 4428` (cumpărare).

**Închidere TVA (lunar/trimestrial):** `4427 = 4426` și diferența → `4423 TVA de plată` sau `4424 TVA de recuperat`.

**Închidere venituri/cheltuieli (rezultat):** `7xx = 121` și `121 = 6xx`.

## Reguli pentru asistent
- Orice notă contabilă: **debit = credit**, minim 2 linii. Folosește `post_journal_entry` cu confirm.
- Nu inventa conturi — verifică cu `list_accounts` / `get_account`. Folosește analiticele firmei.
- Verifică rezultatul cu `get_trial_balance` (trebuie să fie echilibrată) și `get_account_ledger`.
